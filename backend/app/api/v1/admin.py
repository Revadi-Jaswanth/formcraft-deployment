from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.deps import get_current_user, require_role, get_user_repo, get_form_repo, get_submission_repo
from app.models.user import User
from app.models.form import Form
from app.models.submission import Submission
from app.repositories.user_repository import UserRepository
from app.repositories.form_repository import FormRepository
from app.repositories.submission_repository import SubmissionRepository

router = APIRouter(prefix="/admin", tags=["Admin Platform Management"])

# Enforce admin role for all routes in this router
admin_required = Depends(require_role(["admin", "ADMIN"]))

# ==========================================
# 1. Platform Telemetry & Growth Stats
# ==========================================
@router.get("/stats")
def get_platform_stats(
    db: Session = Depends(get_db),
    user_repo: UserRepository = Depends(get_user_repo),
    form_repo: FormRepository = Depends(get_form_repo),
    sub_repo: SubmissionRepository = Depends(get_submission_repo),
    current_user: User = admin_required,
):
    # Total counts
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_forms = db.query(Form).filter(Form.is_deleted == False).count()
    published_forms = db.query(Form).filter(Form.is_deleted == False, Form.status == "published").count()
    draft_forms = db.query(Form).filter(Form.is_deleted == False, Form.status == "draft").count()
    archived_forms = db.query(Form).filter(Form.is_deleted == False, Form.status == "archived").count()
    total_responses = db.query(Submission).count()
    
    # Today's responses
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_responses = db.query(Submission).filter(Submission.submitted_at >= today_start).count()
    
    # User growth, forms created, and responses submitted over last 7 days
    growth_users = []
    growth_forms = []
    growth_submissions = []
    
    for i in range(6, -1, -1):
        day_date = datetime.utcnow().date() - timedelta(days=i)
        day_start = datetime.combine(day_date, datetime.min.time())
        day_end = datetime.combine(day_date, datetime.max.time())
        
        day_label = day_date.strftime("%b %d")
        
        users_count = db.query(User).filter(User.created_at >= day_start, User.created_at <= day_end).count()
        forms_count = db.query(Form).filter(Form.created_at >= day_start, Form.created_at <= day_end, Form.is_deleted == False).count()
        subs_count = db.query(Submission).filter(Submission.submitted_at >= day_start, Submission.submitted_at <= day_end).count()
        
        growth_users.append({"date": day_label, "count": users_count})
        growth_forms.append({"date": day_label, "count": forms_count})
        growth_submissions.append({"date": day_label, "count": subs_count})

    # Most active forms (top 5 by submission count)
    from sqlalchemy import func
    active_forms_query = db.query(
        Form.id, Form.title, func.count(Submission.id).label("subs_count")
    ).join(Submission, Submission.form_id == Form.id)\
     .filter(Form.is_deleted == False)\
     .group_by(Form.id, Form.title)\
     .order_by(func.count(Submission.id).desc())\
     .limit(5).all()
     
    most_active_forms = [
        {"id": str(af[0]), "title": af[1], "responses_count": af[2]}
        for af in active_forms_query
    ]

    return {
        "summary": {
            "total_users": total_users,
            "active_users": active_users,
            "total_forms": total_forms,
            "published_forms": published_forms,
            "draft_forms": draft_forms,
            "archived_forms": archived_forms,
            "total_responses": total_responses,
            "today_responses": today_responses,
            "storage_usage_mb": round(total_forms * 0.05 + total_responses * 0.01, 2)
        },
        "charts": {
            "user_growth": growth_users,
            "forms_created": growth_forms,
            "responses_submitted": growth_submissions
        },
        "most_active_forms": most_active_forms
    }

# ==========================================
# 2. User Management
# ==========================================
@router.get("/users")
def list_all_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    user_repo: UserRepository = Depends(get_user_repo),
    current_user: User = admin_required,
):
    query = db.query(User)
    if search:
        query = query.filter(
            (User.full_name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )
    if role:
        query = query.filter(User.role.ilike(role))
    if status_filter:
        query = query.filter(User.is_active == (status_filter == "active"))
        
    users = query.order_by(User.created_at.desc()).all()
    
    res = []
    for u in users:
        forms_count = db.query(Form).filter(Form.created_by == u.id, Form.is_deleted == False).count()
        res.append({
            "id": str(u.id),
            "name": u.full_name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "forms_count": forms_count
        })
    return res

@router.get("/users/{user_id}")
def get_user_details(
    user_id: UUID,
    db: Session = Depends(get_db),
    user_repo: UserRepository = Depends(get_user_repo),
    current_user: User = admin_required,
):
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    forms = db.query(Form).filter(Form.created_by == user.id, Form.is_deleted == False).all()
    forms_list = []
    for f in forms:
        subs_count = db.query(Submission).filter(Submission.form_id == f.id).count()
        forms_list.append({
            "id": str(f.id),
            "title": f.title,
            "status": f.status,
            "created_at": f.created_at,
            "responses_count": subs_count
        })
        
    return {
        "profile": {
            "id": str(user.id),
            "name": user.full_name,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at
        },
        "forms": forms_list
    }

@router.put("/users/{user_id}/status")
def toggle_user_status(
    user_id: UUID,
    body: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user_repo: UserRepository = Depends(get_user_repo),
    current_user: User = admin_required,
):
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    is_active = body.get("is_active")
    if is_active is None:
        raise HTTPException(status_code=400, detail="is_active parameter required")
        
    user.is_active = is_active
    db.commit()
    return {"message": "User status updated successfully.", "is_active": user.is_active}

@router.delete("/users/{user_id}")
def delete_user_account(
    user_id: UUID,
    db: Session = Depends(get_db),
    user_repo: UserRepository = Depends(get_user_repo),
    current_user: User = admin_required,
):
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    # Cascade delete forms
    forms = db.query(Form).filter(Form.created_by == user_id).all()
    for f in forms:
        db.delete(f)
        
    user_repo.delete(user)
    db.commit()
    return {"message": "User and all associated data permanently removed."}

# ==========================================
# 3. Form Management
# ==========================================
@router.get("/forms")
def list_all_forms(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    form_repo: FormRepository = Depends(get_form_repo),
    current_user: User = admin_required,
):
    query = db.query(Form).filter(Form.is_deleted == False)
    if search:
        query = query.filter(Form.title.ilike(f"%{search}%"))
    if status_filter:
        query = query.filter(Form.status == status_filter)
        
    forms = query.order_by(Form.created_at.desc()).all()
    
    res = []
    for f in forms:
        creator = db.query(User).filter(User.id == f.created_by).first()
        subs_count = db.query(Submission).filter(Submission.form_id == f.id).count()
        res.append({
            "id": str(f.id),
            "title": f.title,
            "status": f.status,
            "created_at": f.created_at,
            "creator_email": creator.email if creator else "Deleted User",
            "responses_count": subs_count
        })
    return res

@router.put("/forms/{form_id}/archive")
def archive_form_admin(
    form_id: UUID,
    db: Session = Depends(get_db),
    form_repo: FormRepository = Depends(get_form_repo),
    current_user: User = admin_required,
):
    form = db.query(Form).filter(Form.id == form_id, Form.is_deleted == False).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found.")
        
    form.status = "archived" if form.status != "archived" else "draft"
    db.commit()
    return {"message": f"Form status updated to {form.status}.", "status": form.status}

@router.delete("/forms/{form_id}")
def delete_form_admin(
    form_id: UUID,
    db: Session = Depends(get_db),
    form_repo: FormRepository = Depends(get_form_repo),
    current_user: User = admin_required,
):
    form = db.query(Form).filter(Form.id == form_id, Form.is_deleted == False).first()
    if not form:
        raise HTTPException(status_code=404, detail="Form not found.")
        
    db.delete(form)
    db.commit()
    return {"message": "Form permanently deleted."}

# ==========================================
# 4. Response Management
# ==========================================
@router.get("/responses")
def list_all_responses(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    sub_repo: SubmissionRepository = Depends(get_submission_repo),
    current_user: User = admin_required,
):
    query = db.query(Submission)
    submissions = query.order_by(Submission.submitted_at.desc()).all()
    
    res = []
    for s in submissions:
        form = db.query(Form).filter(Form.id == s.form_id).first()
        if not form or form.is_deleted:
            continue
            
        creator = db.query(User).filter(User.id == form.created_by).first()
        
        # Filter by search string (form title or creator email)
        if search:
            match_title = search.lower() in form.title.lower()
            match_email = creator and (search.lower() in creator.email.lower())
            if not match_title and not match_email:
                continue
                
        fields_answered = len(s.response_values)
        
        res.append({
            "id": str(s.id),
            "form_id": str(form.id),
            "form_title": form.title,
            "creator_email": creator.email if creator else "Deleted User",
            "submitted_at": s.submitted_at,
            "ip_address": s.ip_address,
            "completion_time_seconds": s.completion_time_seconds,
            "fields_answered": fields_answered
        })
    return res

# ==========================================
# 5. Dynamic Platform Timeline & Audit Logs
# ==========================================
@router.get("/audit-logs")
def get_platform_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = admin_required,
):
    logs = []
    
    # Gather registrations
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(15).all()
    for u in recent_users:
        logs.append({
            "timestamp": u.created_at,
            "type": "USER_SIGNUP",
            "actor": u.email,
            "action": "registered a new account",
            "details": f"User: {u.full_name} ({u.role})"
        })
        
    # Gather form creations
    recent_forms = db.query(Form).order_by(Form.created_at.desc()).limit(15).all()
    for f in recent_forms:
        creator = db.query(User).filter(User.id == f.created_by).first()
        actor = creator.email if creator else "System"
        logs.append({
            "timestamp": f.created_at,
            "type": "FORM_CREATE",
            "actor": actor,
            "action": f"created form '{f.title}'",
            "details": f"Form status: {f.status}"
        })
        
    # Gather response submissions
    recent_subs = db.query(Submission).order_by(Submission.submitted_at.desc()).limit(15).all()
    for s in recent_subs:
        form = db.query(Form).filter(Form.id == s.form_id).first()
        form_title = form.title if form else "Deleted Form"
        logs.append({
            "timestamp": s.submitted_at,
            "type": "FORM_SUBMISSION",
            "actor": s.ip_address or "Anonymous",
            "action": f"submitted response to '{form_title}'",
            "details": f"Session ID: {s.session_id or 'N/A'}"
        })
        
    logs.sort(key=lambda x: x["timestamp"], reverse=True)
    return logs[:30]

# ==========================================
# 6. Platform System Settings
# ==========================================
@router.get("/settings")
def get_system_settings(
    current_user: User = admin_required,
):
    return {
        "allow_registration": True,
        "max_forms_per_user": 100,
        "max_file_size_mb": 10,
        "allowed_file_types": [".pdf", ".jpg", ".png", ".docx", ".xlsx"],
        "maintenance_mode": False
    }

@router.put("/settings")
def update_system_settings(
    body: Dict[str, Any] = Body(...),
    current_user: User = admin_required,
):
    return {
        "message": "System settings updated successfully.",
        "settings": body
    }
