"""
Admin dashboard API endpoints.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from clarimeet.billing.database import get_organization, get_audit_logs
from clarimeet.billing.usage_tracker import UsageTracker
from clarimeet.database import get_supabase_client

log = logging.getLogger("clarimeet.billing.admin")

app = FastAPI(title="ClariMeet Admin API")


@app.get("/api/admin/billing")
async def get_admin_billing(org_id: str = Query(...)):
    """
    Get admin billing dashboard data.
    """
    try:
        org = get_organization(org_id)
        if not org:
            raise HTTPException(404, detail="Organization not found")
        
        plan_type = org.get("plan_type", "free")
        tracker = UsageTracker()
        usage_stats = tracker.get_usage_stats(org_id, plan_type)
        
        return JSONResponse({
            "success": True,
            "organization": {
                "id": org["id"],
                "name": org.get("name", org["id"]),
                "plan_type": plan_type,
                "plan_status": org.get("plan_status", "active"),
                "current_period_start": org.get("current_period_start"),
                "current_period_end": org.get("current_period_end"),
                "trial_end": org.get("trial_end"),
                "seats_total": org.get("seats_total", 1),
                "seats_used": org.get("seats_used", 0),
                "retention_days": org.get("retention_days", 90)
            },
            "usage": {
                "meetings": {
                    "used": usage_stats.meetings_used,
                    "limit": usage_stats.meetings_limit,
                    "percentage": (usage_stats.meetings_used / usage_stats.meetings_limit * 100) if usage_stats.meetings_limit else 0
                },
                "ai_credits": {
                    "used": usage_stats.ai_credits_used,
                    "limit": usage_stats.ai_credits_limit,
                    "percentage": (usage_stats.ai_credits_used / usage_stats.ai_credits_limit * 100) if usage_stats.ai_credits_limit else 0
                },
                "billing_period": {
                    "start": usage_stats.billing_period_start.isoformat(),
                    "end": usage_stats.billing_period_end.isoformat()
                }
            }
        })
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Failed to get admin billing: {e}", exc_info=True)
        raise HTTPException(500, detail=f"Failed to get admin billing: {str(e)}")


@app.get("/api/admin/analytics")
async def get_analytics(
    org_id: str = Query(...),
    period: str = Query("month")  # week, month, year
):
    """
    Get analytics data for admin dashboard.
    """
    try:
        supabase = get_supabase_client()
        if not supabase:
            raise HTTPException(500, detail="Database not available")
        
        # Calculate date range
        now = datetime.now()
        if period == "week":
            start_date = now - timedelta(days=7)
        elif period == "month":
            start_date = now - timedelta(days=30)
        elif period == "year":
            start_date = now - timedelta(days=365)
        else:
            start_date = now - timedelta(days=30)
        
        # Get meetings count
        meetings_result = supabase.table("meetings")\
            .select("id", count="exact")\
            .eq("org_id", org_id)\
            .gte("created_at", start_date.isoformat())\
            .execute()
        
        meetings_count = meetings_result.count if hasattr(meetings_result, 'count') else len(meetings_result.data) if meetings_result.data else 0
        
        # Get usage records for analytics
        usage_result = supabase.table("usage_records")\
            .select("*")\
            .eq("organization_id", org_id)\
            .gte("recorded_at", start_date.isoformat())\
            .execute()
        
        usage_data = usage_result.data if usage_result.data else []
        
        # Calculate metrics
        minutes_transcribed = 0
        ai_credits_used = 0
        action_items_generated = 0
        
        for record in usage_data:
            if record.get("usage_type") == "meeting_transcription":
                metadata = record.get("metadata", {})
                duration = metadata.get("duration_seconds", 0)
                minutes_transcribed += duration / 60
            elif record.get("usage_type") in ["ai_summary", "ai_chat"]:
                ai_credits_used += record.get("quantity", 1)
            elif record.get("usage_type") == "ai_action_items":
                action_items_generated += record.get("quantity", 1)
                ai_credits_used += record.get("quantity", 1)
        
        # Get active users (from organization_members or meetings)
        members_result = supabase.table("organization_members")\
            .select("user_id", count="exact")\
            .eq("organization_id", org_id)\
            .execute()
        
        active_users = members_result.count if hasattr(members_result, 'count') else len(members_result.data) if members_result.data else 1
        
        return JSONResponse({
            "success": True,
            "analytics": {
                "period": period,
                "start_date": start_date.isoformat(),
                "end_date": now.isoformat(),
                "metrics": {
                    "minutes_transcribed": round(minutes_transcribed, 2),
                    "meetings_processed": meetings_count,
                    "active_users": active_users,
                    "ai_credits_used": ai_credits_used,
                    "action_items_generated": action_items_generated
                }
            }
        })
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Failed to get analytics: {e}", exc_info=True)
        raise HTTPException(500, detail=f"Failed to get analytics: {str(e)}")


@app.get("/api/admin/audit-logs")
async def get_audit_logs_endpoint(
    org_id: str = Query(...),
    limit: int = Query(100),
    action_type: Optional[str] = Query(None)
):
    """Get audit logs for an organization."""
    try:
        logs = get_audit_logs(
            organization_id=org_id,
            action_type=action_type,
            limit=limit
        )
        
        return JSONResponse({
            "success": True,
            "logs": logs,
            "count": len(logs)
        })
    except Exception as e:
        log.error(f"Failed to get audit logs: {e}", exc_info=True)
        raise HTTPException(500, detail=f"Failed to get audit logs: {str(e)}")

