"""
API v1 router — aggregates all sub-routers.
"""
from fastapi import APIRouter

from app.api.v1 import forms, fields, conditions, public, auth, dashboard, profile, admin

api_v1_router = APIRouter()

api_v1_router.include_router(auth.router)
api_v1_router.include_router(dashboard.router)
api_v1_router.include_router(profile.router)
api_v1_router.include_router(fields.meta_router)   # GET /field-types (no auth)
api_v1_router.include_router(forms.router)
api_v1_router.include_router(fields.router)
api_v1_router.include_router(conditions.router)
api_v1_router.include_router(public.router)
api_v1_router.include_router(admin.router)
