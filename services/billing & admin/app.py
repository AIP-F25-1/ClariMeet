"""
Billing and Subscription API endpoints.
"""

from fastapi import FastAPI, HTTPException, Query, Body, Request, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import logging
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from clarimeet.billing.stripe_client import StripeClient
from clarimeet.billing.usage_tracker import UsageTracker
from clarimeet.billing.database import (
    get_organization,
    create_or_update_organization,
    update_organization_plan,
    create_subscription_record,
    update_subscription_status,
    add_audit_log
)
from clarimeet.billing.plans import PLANS, get_plan_limits

log = logging.getLogger("clarimeet.billing.api")

app = FastAPI(title="ClariMeet Billing API")
router = app  # For compatibility, use app directly as router


# ============================================================================
# Request Models
# ============================================================================

class CheckoutRequest(BaseModel):
    plan_type: str  # free, pro, team
    billing_interval: str  # month, year
    org_id: str
    success_url: str
    cancel_url: str


class UpdateSubscriptionRequest(BaseModel):
    subscription_id: str
    cancel_at_period_end: Optional[bool] = None


class UpdateRetentionRequest(BaseModel):
    retention_days: int


# ============================================================================
# Helper Functions
# ============================================================================

def get_current_user_id(request: Request) -> Optional[str]:
    """Extract user ID from request (implement based on your auth system)."""
    # TODO: Implement based on your auth system
    # For now, return None (will use org_id as fallback)
    return None


# ============================================================================
# Usage & Limits Endpoints
# ============================================================================

@app.get("/api/billing/usage")
async def get_usage_stats(
    org_id: str = Query(...),
    plan_type: Optional[str] = Query(None)
):
    """
    Get usage statistics for an organization.
    """
    try:
        # Get organization if plan_type not provided
        if not plan_type:
            org = get_organization(org_id)
            if not org:
                raise HTTPException(404, detail="Organization not found")
            plan_type = org.get("plan_type", "free")
        
        tracker = UsageTracker()
        stats = tracker.get_usage_stats(org_id, plan_type)
        
        return JSONResponse({
            "success": True,
            "usage": {
                "meetings": {
                    "used": stats.meetings_used,
                    "limit": stats.meetings_limit,
                    "percentage": (stats.meetings_used / stats.meetings_limit * 100) if stats.meetings_limit else 0
                },
                "ai_credits": {
                    "used": stats.ai_credits_used,
                    "limit": stats.ai_credits_limit,
                    "percentage": (stats.ai_credits_used / stats.ai_credits_limit * 100) if stats.ai_credits_limit else 0
                },
                "billing_period": {
                    "start": stats.billing_period_start.isoformat(),
                    "end": stats.billing_period_end.isoformat()
                }
            }
        })
    except Exception as e:
        log.error(f"Failed to get usage stats: {e}", exc_info=True)
        raise HTTPException(500, detail=f"Failed to get usage stats: {str(e)}")


@app.get("/api/billing/check-limits")
async def check_limits(
    org_id: str = Query(...),
    feature: str = Query(...)  # meeting_transcription, ai_summary, ai_chat
):
    """
    Check if a feature is allowed for an organization.
    """
    try:
        org = get_organization(org_id)
        if not org:
            raise HTTPException(404, detail="Organization not found")
        
        plan_type = org.get("plan_type", "free")
        tracker = UsageTracker()
        
        if feature == "meeting_transcription":
            allowed, error = tracker.check_meeting_limit(org_id, plan_type)
        elif feature in ["ai_summary", "ai_chat", "ai_action_items"]:
            allowed, error = tracker.check_ai_credit_limit(org_id, plan_type, credits_needed=1)
        else:
            raise HTTPException(400, detail=f"Unknown feature: {feature}")
        
        return JSONResponse({
            "success": True,
            "allowed": allowed,
            "error": error
        })
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Failed to check limits: {e}", exc_info=True)
        raise HTTPException(500, detail=f"Failed to check limits: {str(e)}")


# ============================================================================
# Subscription Endpoints
# ============================================================================

@app.post("/api/billing/checkout")
async def create_checkout_session(request: CheckoutRequest):
    """
    Create a Stripe checkout session.
    """
    try:
        if request.plan_type == "free":
            raise HTTPException(400, detail="Cannot checkout for free plan")
        
        # Check if Stripe is configured
        stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
        if not stripe_secret_key:
            raise HTTPException(503, detail="Stripe is not configured. Please contact support to enable paid plans.")
        
        # Get Stripe price ID
        plan = PLANS.get(request.plan_type)
        if not plan:
            raise HTTPException(400, detail=f"Invalid plan type: {request.plan_type}")
        
        price_key = f"stripe_price_{request.billing_interval}"
        price_id = plan.get(price_key)
        if not price_id or price_id.startswith("price_"):
            # Check if it's a placeholder
            if price_id and not price_id.startswith("price_"):
                raise HTTPException(503, detail=f"Stripe price not configured for {request.plan_type} {request.billing_interval}. Please contact support.")
            raise HTTPException(400, detail=f"Price not configured for {request.plan_type} {request.billing_interval}")
        
        # Get or create organization
        org = get_organization(request.org_id)
        stripe_customer_id = None
        
        if org:
            stripe_customer_id = org.get("stripe_customer_id")
        
        # Create Stripe client
        try:
            stripe_client = StripeClient()
        except ImportError:
            raise HTTPException(503, detail="Stripe library not available. Please contact support.")
        except Exception as e:
            raise HTTPException(503, detail=f"Stripe configuration error: {str(e)}")
        
        # Create checkout session
        session = stripe_client.create_checkout_session(
            customer_id=stripe_customer_id,
            price_id=price_id,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            metadata={
                "org_id": request.org_id,
                "plan_type": request.plan_type
            }
        )
        
        # Log audit
        add_audit_log(
            organization_id=request.org_id,
            user_id=None,
            action_type="checkout_session_created",
            resource_type="subscription",
            resource_id=session["id"],
            details={"plan_type": request.plan_type, "billing_interval": request.billing_interval}
        )
        
        return JSONResponse({
            "success": True,
            "session_id": session["id"],
            "url": session["url"]
        })
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Failed to create checkout session: {e}", exc_info=True)
        raise HTTPException(500, detail=f"Failed to create checkout session: {str(e)}")


@app.post("/api/billing/webhook")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhook events.
    """
    try:
        stripe_client = StripeClient()
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")
        
        if not sig_header:
            raise HTTPException(400, detail="Missing stripe-signature header")
        
        event = stripe_client.construct_webhook_event(payload, sig_header)
        
        # Handle different event types
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            org_id = session["metadata"].get("org_id")
            plan_type = session["metadata"].get("plan_type")
            
            if org_id and plan_type:
                # Update organization
                subscription_id = session.get("subscription")
                customer_id = session.get("customer")
                
                if subscription_id:
                    subscription = stripe_client.get_subscription(subscription_id)
                    period_start = datetime.fromtimestamp(subscription["current_period_start"])
                    period_end = datetime.fromtimestamp(subscription["current_period_end"])
                    
                    create_or_update_organization(
                        org_id=org_id,
                        plan_type=plan_type,
                        stripe_customer_id=customer_id,
                        stripe_subscription_id=subscription_id,
                        current_period_start=period_start,
                        current_period_end=period_end
                    )
                    
                    # Create subscription record
                    price_id = subscription["items"]["data"][0]["price"]["id"]
                    amount_cents = subscription["items"]["data"][0]["price"]["unit_amount"]
                    billing_interval = subscription["items"]["data"][0]["price"]["recurring"]["interval"]
                    
                    create_subscription_record(
                        organization_id=org_id,
                        stripe_subscription_id=subscription_id,
                        stripe_price_id=price_id,
                        plan_type=plan_type,
                        billing_interval=billing_interval,
                        amount_cents=amount_cents,
                        current_period_start=period_start,
                        current_period_end=period_end,
                        status="active"
                    )
                    
                    add_audit_log(
                        organization_id=org_id,
                        user_id=None,
                        action_type="subscription_created",
                        resource_type="subscription",
                        resource_id=subscription_id
                    )
        
        elif event["type"] == "customer.subscription.updated":
            subscription = event["data"]["object"]
            subscription_id = subscription["id"]
            
            # Find organization by subscription ID
            org = get_organization_by_subscription(subscription_id)
            if org:
                period_start = datetime.fromtimestamp(subscription["current_period_start"])
                period_end = datetime.fromtimestamp(subscription["current_period_end"])
                
                update_organization_plan(
                    org_id=org["id"],
                    plan_type=org.get("plan_type", "free"),
                    stripe_subscription_id=subscription_id,
                    current_period_start=period_start,
                    current_period_end=period_end
                )
                
                update_subscription_status(
                    stripe_subscription_id=subscription_id,
                    status=subscription["status"]
                )
        
        elif event["type"] == "customer.subscription.deleted":
            subscription = event["data"]["object"]
            subscription_id = subscription["id"]
            
            update_subscription_status(
                stripe_subscription_id=subscription_id,
                status="cancelled",
                cancelled_at=datetime.now()
            )
            
            # Update organization to free plan
            org = get_organization_by_subscription(subscription_id)
            if org:
                update_organization_plan(org_id=org["id"], plan_type="free")
        
        elif event["type"] == "invoice.paid":
            invoice = event["data"]["object"]
            subscription_id = invoice.get("subscription")
            
            if subscription_id:
                add_audit_log(
                    organization_id=None,
                    user_id=None,
                    action_type="invoice_paid",
                    resource_type="invoice",
                    resource_id=invoice["id"],
                    details={"subscription_id": subscription_id, "amount": invoice["amount_paid"]}
                )
        
        elif event["type"] == "invoice.payment_failed":
            invoice = event["data"]["object"]
            subscription_id = invoice.get("subscription")
            
            if subscription_id:
                update_subscription_status(
                    stripe_subscription_id=subscription_id,
                    status="past_due"
                )
        
        return JSONResponse({"success": True})
    except Exception as e:
        log.error(f"Webhook processing failed: {e}", exc_info=True)
        raise HTTPException(500, detail=f"Webhook processing failed: {str(e)}")


def get_organization_by_subscription(subscription_id: str):
    """Helper to get organization by Stripe subscription ID."""
    from clarimeet.database import get_supabase_client
    supabase = get_supabase_client()
    if not supabase:
        return None
    
    try:
        result = supabase.table("organizations")\
            .select("*")\
            .eq("stripe_subscription_id", subscription_id)\
            .execute()
        
        if result.data:
            return result.data[0]
        return None
    except Exception as e:
        log.error(f"Failed to get organization by subscription: {e}")
        return None


@app.get("/api/billing/subscription")
async def get_subscription(org_id: str = Query(...)):
    """Get subscription details for an organization."""
    try:
        org = get_organization(org_id)
        if not org:
            raise HTTPException(404, detail="Organization not found")
        
        plan_type = org.get("plan_type", "free")
        plan = PLANS.get(plan_type, {})
        
        return JSONResponse({
            "success": True,
            "subscription": {
                "plan_type": plan_type,
                "plan_name": plan.get("name", plan_type.title()),
                "status": org.get("plan_status", "active"),
                "current_period_start": org.get("current_period_start"),
                "current_period_end": org.get("current_period_end"),
                "trial_end": org.get("trial_end"),
                "stripe_subscription_id": org.get("stripe_subscription_id"),
                "seats_total": org.get("seats_total", 1),
                "seats_used": org.get("seats_used", 0),
                "retention_days": org.get("retention_days", 90)
            }
        })
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Failed to get subscription: {e}", exc_info=True)
        raise HTTPException(500, detail=f"Failed to get subscription: {str(e)}")


@app.post("/api/billing/subscription/cancel")
async def cancel_subscription(
    org_id: str = Query(...),
    immediately: bool = Query(False)
):
    """Cancel a subscription."""
    try:
        org = get_organization(org_id)
        if not org:
            raise HTTPException(404, detail="Organization not found")
        
        subscription_id = org.get("stripe_subscription_id")
        if not subscription_id:
            raise HTTPException(400, detail="No active subscription found")
        
        stripe_client = StripeClient()
        stripe_client.cancel_subscription(subscription_id, immediately=immediately)
        
        add_audit_log(
            organization_id=org_id,
            user_id=None,
            action_type="subscription_cancelled",
            resource_type="subscription",
            resource_id=subscription_id,
            details={"immediately": immediately}
        )
        
        return JSONResponse({
            "success": True,
            "message": "Subscription cancelled successfully"
        })
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Failed to cancel subscription: {e}", exc_info=True)
        raise HTTPException(500, detail=f"Failed to cancel subscription: {str(e)}")


@app.post("/api/billing/retention")
async def update_retention(
    org_id: str = Query(...),
    request: UpdateRetentionRequest = Body(...)
):
    """Update data retention settings."""
    try:
        org = get_organization(org_id)
        if not org:
            raise HTTPException(404, detail="Organization not found")
        
        create_or_update_organization(
            org_id=org_id,
            retention_days=request.retention_days
        )
        
        add_audit_log(
            organization_id=org_id,
            user_id=None,
            action_type="retention_changed",
            resource_type="organization",
            resource_id=org_id,
            details={"retention_days": request.retention_days}
        )
        
        return JSONResponse({
            "success": True,
            "message": "Retention settings updated"
        })
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Failed to update retention: {e}", exc_info=True)
        raise HTTPException(500, detail=f"Failed to update retention: {str(e)}")

