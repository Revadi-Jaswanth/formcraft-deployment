"""
Dashboard API Router — handles overview statistics, activity log, and user preferences.
"""
from fastapi import APIRouter, Depends, status, Body
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta
import json
import os

from app.api.deps import get_current_user, get_form_service, get_submission_repo
from app.services.form_service import FormService
from app.repositories.submission_repository import SubmissionRepository
from app.models.user import User
from app.core.config import settings

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

PREFERENCES_FILE = os.path.join(settings.UPLOAD_DIR, "user_preferences.json")


def _load_preferences() -> Dict[str, Any]:
    if not os.path.exists(PREFERENCES_FILE):
        return {}
    try:
        with open(PREFERENCES_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {}


def _save_preferences(prefs: Dict[str, Any]):
    os.makedirs(os.path.dirname(PREFERENCES_FILE), exist_ok=True)
    try:
        with open(PREFERENCES_FILE, "w") as f:
            json.dump(prefs, f, indent=2)
    except Exception:
        pass


@router.get(
    "/overview",
    summary="Get user forms and responses telemetry overview",
)
def get_overview(
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
) -> dict:
    forms, _ = form_svc.list_forms(limit=1000, user_id=current_user.id)
    
    total_forms = len(forms)
    published_forms = len([f for f in forms if f.status == "published"])
    draft_forms = len([f for f in forms if f.status == "draft"])
    archived_forms = len([f for f in forms if f.status == "archived"])
    
    total_responses = sum(form_svc.form_repo.count_submissions(f.id) for f in forms)
    
    # Calculate today's submissions count (last 24 hours)
    now = datetime.now(timezone.utc)
    one_day_ago = now - timedelta(days=1)
    
    today_responses = 0
    most_active_form = None
    max_subs = -1
    
    for f in forms:
        sub_count = form_svc.form_repo.count_submissions(f.id)
        if sub_count > max_subs and sub_count > 0:
            max_subs = sub_count
            most_active_form = {
                "id": str(f.id),
                "title": f.title,
                "submission_count": sub_count,
            }
            
        # Count recent submissions in database
        subs = f.submissions
        for s in subs:
            # Handle timezone naive/aware comparison
            sub_time = s.submitted_at
            if sub_time.tzinfo is None:
                sub_time = sub_time.replace(tzinfo=timezone.utc)
            if sub_time >= one_day_ago:
                today_responses += 1

    avg_responses = round(total_responses / total_forms, 1) if total_forms > 0 else 0.0

    return {
        "total_forms": total_forms,
        "published_forms": published_forms,
        "draft_forms": draft_forms,
        "archived_forms": archived_forms,
        "total_responses": total_responses,
        "today_responses": today_responses,
        "avg_responses_per_form": avg_responses,
        "most_active_form": most_active_form,
    }


@router.get(
    "/activity",
    summary="Get user activity logs",
)
def get_activity(
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
) -> List[dict]:
    forms, _ = form_svc.list_forms(limit=1000, user_id=current_user.id)
    activity_log = []
    
    for f in forms:
        # Form creation activity
        activity_log.append({
            "type": "create",
            "icon": "FilePlus",
            "form_id": str(f.id),
            "form_title": f.title,
            "description": f"Created form template",
            "timestamp": f.created_at.isoformat(),
        })
        
        # Form update/publish activity
        if f.status == "published":
            activity_log.append({
                "type": "publish",
                "icon": "Rocket",
                "form_id": str(f.id),
                "form_title": f.title,
                "description": f"Published form (Version v{f.current_version_number})",
                "timestamp": f.updated_at.isoformat(),
            })
        elif f.status == "archived":
            activity_log.append({
                "type": "archive",
                "icon": "Archive",
                "form_id": str(f.id),
                "form_title": f.title,
                "description": "Archived form template",
                "timestamp": f.updated_at.isoformat(),
            })
            
        # Submission activity
        for s in f.submissions:
            activity_log.append({
                "type": "submit",
                "icon": "Inbox",
                "form_id": str(f.id),
                "form_title": f.title,
                "description": f"New response submission received",
                "timestamp": s.submitted_at.isoformat(),
            })

    # Sort activities chronologically (newest first)
    activity_log.sort(key=lambda x: x["timestamp"], reverse=True)
    return activity_log[:15]


@router.get(
    "/recent",
    summary="Get recently edited forms",
)
def get_recent(
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
) -> List[dict]:
    forms, _ = form_svc.list_forms(limit=5, user_id=current_user.id)
    return [
        {
            "id": str(f.id),
            "title": f.title,
            "status": f.status,
            "updated_at": f.updated_at.isoformat(),
            "submission_count": form_svc.form_repo.count_submissions(f.id),
        }
        for f in forms
    ]


@router.get(
    "/favorites",
    summary="Get favorited/pinned forms",
)
def get_favorites(
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
) -> List[dict]:
    prefs = _load_preferences()
    user_key = str(current_user.id)
    user_prefs = prefs.get(user_key, {})
    fav_ids = user_prefs.get("favorites", [])
    
    favorited_forms = []
    for fid_str in fav_ids:
        try:
            fid = UUID(fid_str)
            form = form_svc.form_repo.get_with_details(fid, user_id=current_user.id)
            if form:
                favorited_forms.append({
                    "id": str(form.id),
                    "title": form.title,
                    "status": form.status,
                    "updated_at": form.updated_at.isoformat(),
                })
        except ValueError:
            continue
            
    return favorited_forms


@router.patch(
    "/preferences",
    summary="Update user dashboard preferences (favorites, pinned, sidebar, theme)",
)
def update_preferences(
    body: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user),
) -> dict:
    prefs = _load_preferences()
    user_key = str(current_user.id)
    
    current_prefs = prefs.get(user_key, {})
    # Merge preferences
    current_prefs.update(body)
    prefs[user_key] = current_prefs
    
    _save_preferences(prefs)
    return current_prefs
