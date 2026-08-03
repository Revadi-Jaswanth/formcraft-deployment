"""
FormCraft API — FastAPI application entry point.
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.exceptions import FormCraftException
from app.api.v1.router import api_v1_router


from app.core.database import engine
from app.models import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    # Ensure database schema tables (e.g. audit_logs) are created
    Base.metadata.create_all(bind=engine)
    yield
    # ── Shutdown ─────────────────────────────────────────────────


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## FormCraft — Low-Code Dynamic Form Platform

### Milestone 1 endpoints:
- **Forms** — full CRUD, publish, archive, duplicate, versioning
- **Fields** — typed field library (text, number, email, dropdown, checkbox, date, file_upload, rating)
- **Conditions** — conditional show/hide/require rules
- **Public** — unauthenticated form retrieval + submission

> Auth: In development mode all admin routes are open. Set `ENVIRONMENT=production` and `API_KEY=<key>` to enable API-key protection.
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global exception handler for custom exceptions ───────────────────────────
@app.exception_handler(FormCraftException)
async def formcraft_exception_handler(request: Request, exc: FormCraftException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

# ── Static files for uploaded assets ─────────────────────────────────────────
if os.path.isdir(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# ── Health & root ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"], include_in_schema=False)
def root():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
