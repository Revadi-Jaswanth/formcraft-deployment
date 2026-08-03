"""
Dashboard API Router — handles overview statistics, activity log, and user preferences.
"""
from fastapi import APIRouter, Depends, status, Body
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta
import json
import os

from app.core.database import get_db
from sqlalchemy.orm import Session
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


@router.get(
    "/submissions",
    summary="Get recent submissions across all user forms",
)
def get_recent_submissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[dict]:
    from app.models.form import Form
    from app.models.submission import Submission

    forms = db.query(Form).filter(Form.created_by == current_user.id, Form.is_deleted == False).all()
    form_ids = [f.id for f in forms]

    if not form_ids:
        return []

    subs = db.query(Submission)\
             .filter(Submission.form_id.in_(form_ids))\
             .order_by(Submission.submitted_at.desc())\
             .limit(5).all()

    res = []
    for s in subs:
        form = db.query(Form).filter(Form.id == s.form_id).first()
        res.append({
            "id": str(s.id),
            "form_id": str(s.form_id),
            "form_title": form.title if form else "Deleted Form",
            "respondent": f"Respondent #{s.id.hex[:6].upper()}",
            "ip_address": s.ip_address or "127.0.0.1",
            "submitted_at": s.submitted_at.isoformat()
        })
    return res


# ── Form Analytics (Day 17) ───────────────────────────────────────────────────

@router.get(
    "/form-analytics/{form_id}",
    summary="Get per-field option distributions and submission timeseries for a form",
    description=(
        "Returns analytics computed from real submission data for the given form:\n\n"
        "- **field_distributions** — for every field, the count of each unique response value.\n"
        "  Choice fields (dropdown/radio/multi_checkbox) get one count per option.\n"
        "  Text/number fields are counted by their raw value.\n"
        "- **daily_submissions** — count of submissions per calendar day (UTC, last 30 days).\n"
        "- **completion_time_buckets** — histogram of completion times in seconds.\n"
        "- **summary** — total submissions, response rate per field, avg completion time.\n"
    ),
)
def get_form_analytics(
    form_id: UUID,
    current_user: User = Depends(get_current_user),
    form_svc: FormService = Depends(get_form_service),
    sub_repo: SubmissionRepository = Depends(get_submission_repo),
) -> dict:
    from app.models.submission import ResponseValue
    import json as _json
    from collections import Counter, defaultdict

    # Verify ownership
    form = form_svc.get_form_detail(form_id, user_id=current_user.id)

    # Fetch ALL submissions (no pagination — analytics uses full dataset)
    subs, total = sub_repo.list_for_form(form_id, limit=10_000)

    # ── Build field metadata map ──────────────────────────────────────────────
    fields = sorted(form.fields, key=lambda f: f.order_index)
    field_meta = {
        f.id: {
            "id": str(f.id),
            "label": f.label,
            "field_type": f.field_type if isinstance(f.field_type, str) else f.field_type.value,
            "is_required": f.is_required,
        }
        for f in fields
    }

    # ── Per-field value distributions ─────────────────────────────────────────
    # value_counts[field_id] = Counter({option_label: count})
    value_counts: dict = defaultdict(Counter)
    answered_counts: dict = defaultdict(int)  # how many subs answered each field

    for sub in subs:
        for rv in sub.response_values:
            fid = rv.field_id
            if fid not in field_meta:
                continue
            answered_counts[fid] += 1
            raw = rv.value or ""
            # Multi-checkbox values are JSON arrays e.g. '["opt1","opt2"]'
            try:
                parsed = _json.loads(raw)
                if isinstance(parsed, list):
                    for item in parsed:
                        value_counts[fid][str(item)] += 1
                else:
                    value_counts[fid][raw] += 1
            except (ValueError, TypeError):
                value_counts[fid][raw] += 1

    field_distributions = []
    for f in fields:
        fid = f.id
        counts = value_counts.get(fid, Counter())
        field_distributions.append({
            **field_meta[fid],
            "total_answers": answered_counts.get(fid, 0),
            "response_rate": round(answered_counts.get(fid, 0) / total * 100, 1) if total > 0 else 0,
            "distribution": [
                {"label": label, "count": count}
                for label, count in sorted(counts.items(), key=lambda x: -x[1])
            ],
        })

    # ── Daily submission timeseries (last 30 days) ────────────────────────────
    from datetime import date as DateType, timedelta as TDelta
    daily: dict = defaultdict(int)
    for sub in subs:
        day = sub.submitted_at.date()
        daily[day] += 1

    today = datetime.now(timezone.utc).date()
    daily_submissions = []
    for i in range(29, -1, -1):
        d = today - TDelta(days=i)
        daily_submissions.append({"date": d.isoformat(), "count": daily.get(d, 0)})

    # ── Completion-time histogram ─────────────────────────────────────────────
    bucket_labels = ["<15s", "15–30s", "30–60s", "1–2m", "2–5m", ">5m"]
    buckets = Counter()

    for sub in subs:
        t = sub.completion_time_seconds
        if t is None:
            continue
        if t < 15:
            buckets["<15s"] += 1
        elif t < 30:
            buckets["15–30s"] += 1
        elif t < 60:
            buckets["30–60s"] += 1
        elif t < 120:
            buckets["1–2m"] += 1
        elif t < 300:
            buckets["2–5m"] += 1
        else:
            buckets[">5m"] += 1

    completion_time_buckets = [
        {"label": lbl, "count": buckets.get(lbl, 0)} for lbl in bucket_labels
    ]

    # ── Summary stats ─────────────────────────────────────────────────────────
    times = [s.completion_time_seconds for s in subs if s.completion_time_seconds is not None]
    avg_completion = round(sum(times) / len(times), 1) if times else None

    return {
        "form_id": str(form_id),
        "form_title": form.title,
        "total_submissions": total,
        "avg_completion_time_seconds": avg_completion,
        "field_distributions": field_distributions,
        "daily_submissions": daily_submissions,
        "completion_time_buckets": completion_time_buckets,
    }
