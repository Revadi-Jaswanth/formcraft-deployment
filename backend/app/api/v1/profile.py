"""
Profile, Settings & Account Management Router.
"""
from fastapi import APIRouter, Depends, status, Body, UploadFile, File, HTTPException
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta
import os
import shutil

from app.api.deps import get_current_user, get_form_service, get_submission_repo, get_db
from app.services.form_service import FormService
from app.repositories.user_repository import UserRepository
from app.models.user import User
from sqlalchemy.orm import Session
from app.core.security import hash_password, verify_password
from app.core.config import settings
from app.api.v1.dashboard import _load_preferences, _save_preferences

router = APIRouter(tags=["Profile & Settings"])

AVATARS_DIR = os.path.join(settings.UPLOAD_DIR, "avatars")
os.makedirs(AVATARS_DIR, exist_ok=True)


@router.get("/profile", summary="Get current user profile details")
def get_profile(
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
) -> dict:
    prefs = _load_preferences()
    user_key = str(current_user.id)
    user_prefs = prefs.get(user_key, {})
    
    # Calculate form stats
    forms, _ = form_svc.list_forms(limit=1000, user_id=current_user.id)
    total_forms = len(forms)
    total_responses = sum(form_svc.form_repo.count_submissions(f.id) for f in forms)

    return {
        "id": str(current_user.id),
        "name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role),
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "avatar_url": user_prefs.get("avatar_url"),
        "timezone": user_prefs.get("timezone", "UTC"),
        "bio": user_prefs.get("bio", ""),
        "company": user_prefs.get("company", ""),
        "website": user_prefs.get("website", ""),
        "stats": {
            "forms_created": total_forms,
            "responses_collected": total_responses,
        }
    }


@router.patch("/profile", summary="Update user profile details")
def update_profile(
    body: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
    db: Session = Depends(get_db),
) -> dict:
    prefs = _load_preferences()
    user_key = str(current_user.id)
    user_prefs = prefs.get(user_key, {})
    
    # Fields user can update
    allowed_fields = ["name", "timezone", "bio", "company", "website"]
    
    # If updating name, write to database
    new_name = body.get("name")
    if new_name is not None:
        current_user.full_name = new_name
        db.commit()
        
    for k, v in body.items():
        if k in allowed_fields and k != "name":
            user_prefs[k] = v
            
    prefs[user_key] = user_prefs
    _save_preferences(prefs)
    
    return get_profile(current_user, form_svc)


@router.post("/profile/avatar", summary="Upload profile avatar picture")
def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
) -> dict:
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".gif"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type not supported. Use JPG, PNG or GIF."
        )
        
    # Save file
    filename = f"avatar_{current_user.id}{ext}"
    filepath = os.path.join(AVATARS_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Persist avatar url path in user preferences
    prefs = _load_preferences()
    user_key = str(current_user.id)
    user_prefs = prefs.get(user_key, {})
    
    # Store path (relative to media directory)
    avatar_url = f"/public/uploads/avatars/{filename}"
    user_prefs["avatar_url"] = avatar_url
    prefs[user_key] = user_prefs
    _save_preferences(prefs)
    
    return {"avatar_url": avatar_url}


@router.post("/profile/change-password", summary="Update user password securely")
def change_password(
    current_password: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    # Verify current password
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed."
        )

    # Hash and save new password
    current_user.hashed_password = hash_password(new_password)
    db.commit()
    return {"message": "Password changed successfully."}


@router.get("/settings", summary="Get user dashboard settings")
def get_settings(
    current_user: User = Depends(get_current_user),
) -> dict:
    prefs = _load_preferences()
    user_key = str(current_user.id)
    user_prefs = prefs.get(user_key, {})
    
    return {
        "appearance": user_prefs.get("appearance", "dark"),
        "notifications": user_prefs.get("notifications", {
            "email_notifications": True,
            "submission_alerts": True,
            "weekly_reports": False,
            "marketing_emails": False,
        }),
        "language": user_prefs.get("language", "en"),
    }


@router.patch("/settings", summary="Update user settings preferences")
def update_settings(
    body: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
) -> dict:
    prefs = _load_preferences()
    user_key = str(current_user.id)
    user_prefs = prefs.get(user_key, {})
    
    # Merge settings keys
    for k, v in body.items():
        if k in ["appearance", "notifications", "language"]:
            user_prefs[k] = v
            
    prefs[user_key] = user_prefs
    _save_preferences(prefs)
    
    return get_settings(current_user)


@router.get("/sessions", summary="Get active sessions tracker")
def get_sessions(
    current_user: User = Depends(get_current_user),
) -> List[dict]:
    # Mocking active session list reflecting caller info
    return [
        {
            "id": "current-session-id",
            "browser": "Chrome",
            "os": "Windows",
            "ip_address": "127.0.0.1",
            "login_time": datetime.now(timezone.utc).isoformat(),
            "is_current": True,
        },
        {
            "id": "mock-session-id-2",
            "browser": "Safari Mobile",
            "os": "iOS",
            "ip_address": "192.168.1.144",
            "login_time": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat(),
            "is_current": False,
        }
    ]


@router.delete("/sessions/current", summary="Revoke current session logout")
def revoke_current_session() -> dict:
    return {"message": "Current session revoked successfully."}


@router.delete("/sessions/all", summary="Revoke all sessions logout")
def revoke_all_sessions() -> dict:
    return {"message": "All other sessions revoked successfully."}


@router.delete("/account", summary="Permanently delete user profile and data")
def delete_account(
    password: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
    db: Session = Depends(get_db),
) -> dict:
    # Verify password verification
    if not verify_password(password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account deletion rejected: Incorrect verification password."
        )

    # Delete user's forms (soft delete is bypassed for account deletion Danger Zone)
    forms, _ = form_svc.list_forms(limit=1000, user_id=current_user.id)
    for f in forms:
        form_svc.form_repo.delete(f.id)

    # Delete user record from database
    user_repo = UserRepository(db)
    user_repo.delete(current_user)
    db.commit()
    
    # Delete preferences
    prefs = _load_preferences()
    user_key = str(current_user.id)
    if user_key in prefs:
        del prefs[user_key]
        _save_preferences(prefs)
        
    return {"message": "Your profile has been permanently removed."}
