from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
import os
import json

from app.core.config import settings
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

SYSTEM_SETTINGS_FILE = os.path.join(settings.UPLOAD_DIR, "system_settings.json")

def _load_system_settings() -> dict:
    if not os.path.exists(SYSTEM_SETTINGS_FILE):
        return {
            "allow_registration": True,
            "max_forms_per_user": 100,
            "max_file_size_mb": 10,
            "allowed_file_types": [".pdf", ".jpg", ".png", ".docx", ".xlsx"],
            "maintenance_mode": False
        }
    try:
        with open(SYSTEM_SETTINGS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {
            "allow_registration": True,
            "max_forms_per_user": 100,
            "max_file_size_mb": 10,
            "allowed_file_types": [".pdf", ".jpg", ".png", ".docx", ".xlsx"],
            "maintenance_mode": False
        }

def _save_system_settings(data: dict):
    os.makedirs(os.path.dirname(SYSTEM_SETTINGS_FILE), exist_ok=True)
    try:
        with open(SYSTEM_SETTINGS_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception:
        pass

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

    # Calculate real uploads directory size in MB
    total_size = 0
    upload_path = settings.UPLOAD_DIR
    if os.path.exists(upload_path):
        for dirpath, dirnames, filenames in os.walk(upload_path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                try:
                    total_size += os.path.getsize(fp)
                except OSError:
                    pass
    storage_usage_mb = round(total_size / (1024 * 1024), 2)

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
            "storage_usage_mb": storage_usage_mb
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
def get_user_details_admin(
    user_id: UUID,
    db: Session = Depends(get_db),
    user_repo: UserRepository = Depends(get_user_repo),
    current_user: User = admin_required,
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    forms = db.query(Form).filter(Form.created_by == user.id, Form.is_deleted == False).all()
    
    forms_list = []
    for f in forms:
        sub_count = db.query(Submission).filter(Submission.form_id == f.id).count()
        forms_list.append({
            "id": str(f.id),
            "title": f.title,
            "status": f.status,
            "responses_count": sub_count
        })
        
    return {
        "user": {
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
def update_user_status(
    user_id: UUID,
    body: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    user_repo: UserRepository = Depends(get_user_repo),
    current_user: User = admin_required,
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    if "is_active" in body:
        user.is_active = bool(body["is_active"])
        db.commit()
        
    status_str = "activated" if user.is_active else "suspended"
    return {"message": f"User account has been {status_str}.", "is_active": user.is_active}

@router.delete("/users/{user_id}")
def delete_user_admin(
    user_id: UUID,
    db: Session = Depends(get_db),
    user_repo: UserRepository = Depends(get_user_repo),
    current_user: User = admin_required,
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    # Cascade delete forms
    db.query(Form).filter(Form.created_by == user.id).delete()
    db.delete(user)
    db.commit()
    return {"message": "User account and all related forms permanently purged."}

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
        sub_count = db.query(Submission).filter(Submission.form_id == f.id).count()
        res.append({
            "id": str(f.id),
            "title": f.title,
            "status": f.status,
            "created_at": f.created_at,
            "creator_email": creator.email if creator else "Deleted User",
            "responses_count": sub_count
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
def delete_form_admin_endpoint(
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
# 5. Dynamic Platform Timeline & Audit Logs (Day 19)
# ==========================================
@router.get("/audit-logs")
def get_platform_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = admin_required,
):
    from app.models.audit_log import AuditLog

    logs = []

    # 1. Fetch persistent database audit log entries
    db_audit_entries = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(30).all()
    for entry in db_audit_entries:
        logs.append({
            "id": str(entry.id),
            "timestamp": entry.created_at.isoformat(),
            "type": entry.action,
            "actor": entry.actor_email,
            "action": f"{entry.action.replace('_', ' ').title()} on {entry.target_type}",
            "details": f"Target ID: {entry.target_id or 'N/A'} | {entry.details}",
            "ip_address": entry.ip_address,
        })

    # 2. Gather user registrations
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(10).all()
    for u in recent_users:
        logs.append({
            "timestamp": u.created_at.isoformat(),
            "type": "USER_SIGNUP",
            "actor": u.email,
            "action": "registered a new account",
            "details": f"User: {u.full_name} ({u.role})"
        })

    # 3. Gather form creations
    recent_forms = db.query(Form).order_by(Form.created_at.desc()).limit(10).all()
    for f in recent_forms:
        creator = db.query(User).filter(User.id == f.created_by).first()
        actor = creator.email if creator else "System"
        logs.append({
            "timestamp": f.created_at.isoformat(),
            "type": "FORM_CREATE",
            "actor": actor,
            "action": f"created form '{f.title}'",
            "details": f"Form status: {f.status}"
        })

    # 4. Gather response submissions
    recent_subs = db.query(Submission).order_by(Submission.submitted_at.desc()).limit(10).all()
    for s in recent_subs:
        form = db.query(Form).filter(Form.id == s.form_id).first()
        form_title = form.title if form else "Deleted Form"
        logs.append({
            "timestamp": s.submitted_at.isoformat(),
            "type": "FORM_SUBMISSION",
            "actor": s.ip_address or "Anonymous",
            "action": f"submitted response to '{form_title}'",
            "details": f"Session ID: {s.session_id or 'N/A'}"
        })

    logs.sort(key=lambda x: x["timestamp"], reverse=True)
    return logs[:50]


# ==========================================
# 6. Platform System Settings & Retention Policy (Day 19)
# ==========================================
RETENTION_CONFIG_FILE = os.path.join(settings.UPLOAD_DIR, "retention_policy.json")


def _load_retention_policy() -> Dict[str, Any]:
    if not os.path.exists(RETENTION_CONFIG_FILE):
        return {
            "auto_delete_days": 90,
            "enabled": True,
            "archive_purged": True,
            "last_run_at": None,
            "total_purged_count": 0,
        }
    try:
        with open(RETENTION_CONFIG_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {
            "auto_delete_days": 90,
            "enabled": True,
            "archive_purged": True,
            "last_run_at": None,
            "total_purged_count": 0,
        }


def _save_retention_policy(policy: Dict[str, Any]):
    os.makedirs(os.path.dirname(RETENTION_CONFIG_FILE), exist_ok=True)
    try:
        with open(RETENTION_CONFIG_FILE, "w") as f:
            json.dump(policy, f, indent=2)
    except Exception:
        pass


@router.get("/settings")
def get_system_settings(
    current_user: User = admin_required,
):
    return _load_system_settings()


@router.put("/settings")
def update_system_settings(
    body: Dict[str, Any] = Body(...),
    current_user: User = admin_required,
):
    _save_system_settings(body)
    return {
        "message": "System settings updated successfully.",
        "settings": body
    }


@router.get("/retention-policy")
def get_retention_policy(
    current_user: User = admin_required,
):
    """Get active Data Retention Policy config."""
    return _load_retention_policy()


@router.put("/retention-policy")
def update_retention_policy(
    body: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = admin_required,
):
    """Update Data Retention Policy and record audit log."""
    from app.models.audit_log import AuditLog

    policy = _load_retention_policy()
    policy.update(body)
    _save_retention_policy(policy)

    # Record Audit Entry
    audit_entry = AuditLog(
        user_id=current_user.id,
        action="RETENTION_POLICY_UPDATE",
        target_type="system_setting",
        target_id="retention_policy",
        actor_email=current_user.email,
        details=policy,
    )
    db.add(audit_entry)
    db.commit()

    return {
        "message": "Data Retention Policy updated.",
        "policy": policy,
    }


@router.post("/retention-policy/execute")
def execute_retention_policy(
    db: Session = Depends(get_db),
    current_user: User = admin_required,
):
    """
    Executes data retention policy cleanup:
    Deletes all form submissions older than `auto_delete_days`.
    """
    from datetime import datetime, timezone, timedelta
    from app.models.audit_log import AuditLog

    policy = _load_retention_policy()
    auto_delete_days = int(policy.get("auto_delete_days", 90))

    cutoff = datetime.now(timezone.utc) - timedelta(days=auto_delete_days)

    # Query expired submissions
    expired_subs = db.query(Submission).filter(Submission.submitted_at <= cutoff).all()
    purged_count = len(expired_subs)

    for sub in expired_subs:
        db.delete(sub)

    # Update policy stats
    policy["last_run_at"] = datetime.now(timezone.utc).isoformat()
    policy["total_purged_count"] = policy.get("total_purged_count", 0) + purged_count
    _save_retention_policy(policy)

    # Record Audit Entry
    audit_entry = AuditLog(
        user_id=current_user.id,
        action="RETENTION_POLICY_EXECUTE",
        target_type="submission",
        target_id=f"cutoff_{auto_delete_days}d",
        actor_email=current_user.email,
        details={
            "purged_count": purged_count,
            "auto_delete_days": auto_delete_days,
            "cutoff_timestamp": cutoff.isoformat(),
        },
    )
    db.add(audit_entry)
    db.commit()

    return {
        "purged_count": purged_count,
        "auto_delete_days": auto_delete_days,
        "executed_at": policy["last_run_at"],
        "message": f"Retention Policy executed. Purged {purged_count} submission(s) older than {auto_delete_days} days.",
    }

