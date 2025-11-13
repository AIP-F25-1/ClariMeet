from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from datetime import datetime
from pathlib import Path

from .database import SessionLocal, UsageMetrics
from .billing import calculate_billing
from .analytics import get_analytics

app = FastAPI(title="ClariMeet Admin Dashboard")

# Get the directory where this file is located
current_dir = Path(__file__).parent
templates = Jinja2Templates(directory=str(current_dir / "templates"))

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request):
    """
    Render the admin dashboard with analytics.
    """
    stats = get_analytics()
    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "total_minutes": stats["total_minutes"],
            "average_actions": stats["average_actions"],
            "total_records": stats["total_records"]
        }
    )

@app.post("/add_usage")
async def add_usage(
    user_id: str = Form(...),
    minutes: float = Form(...),
    actions: int = Form(...)
):
    """
    Add usage metrics and calculate billing.
    
    Args:
        user_id: User identifier
        minutes: Minutes transcribed
        actions: Number of actions accepted
        
    Returns:
        JSON response with the created record
    """
    # Calculate cost using billing module
    total_cost = calculate_billing(minutes)
    
    # Create database record
    db = SessionLocal()
    try:
        usage_record = UsageMetrics(
            user_id=user_id,
            minutes_transcribed=minutes,
            actions_accepted=actions,
            total_cost=total_cost,
            timestamp=datetime.utcnow()
        )
        db.add(usage_record)
        db.commit()
        db.refresh(usage_record)
        
        return {
            "id": usage_record.id,
            "user_id": usage_record.user_id,
            "minutes_transcribed": usage_record.minutes_transcribed,
            "actions_accepted": usage_record.actions_accepted,
            "total_cost": usage_record.total_cost,
            "timestamp": usage_record.timestamp.isoformat()
        }
    finally:
        db.close()

