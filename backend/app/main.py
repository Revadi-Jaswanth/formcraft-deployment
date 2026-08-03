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
    title=f"{settings.APP_NAME} — Enterprise Low-Code Dynamic Form Platform API",
    version=settings.APP_VERSION,
    description="""
## FormCraft — Production-Grade Dynamic Form & Workflow Platform API

### 🚀 Complete 3-Milestone Architecture:

#### **Milestone 1 — Form Schema Engine & Field Type Library**
- **Form Lifecycle Management**: Full CRUD, versioning (`form_versions` snapshots), state transitions (`draft` → `published` → `archived`), duplication & share token generation.
- **Typed Field Catalogue**: 11 supported field types (`text`, `textarea`, `number`, `email`, `phone`, `dropdown`, `radio`, `multi_checkbox`, `date`, `file_upload`, `rating`) with JSONB configurations.
- **Public Form Access**: Unauthenticated form retrieval by token.

#### **Milestone 2 — Conditional Logic Engine & Submission Pipeline**
- **Rule Evaluator**: Multi-operator condition evaluator (`equals`, `not_equals`, `contains`, `greater_than`, `less_than`, `is_empty`, `is_not_empty`, `in`) driving `show`, `hide`, `require`, and `disable` actions.
- **Validation Engine**: Server-side Pydantic & client-side validation mirroring with human-readable error contracts.
- **Submission Engine**: Secure response intake, file attachment upload handling, and confirmation payloads.

#### **Milestone 3 — Analytics, Export, File Storage & Data Compliance**
- **Response Analytics & Visualization**: Aggregated telemetry, 30-day submission velocity trends, completion time histograms, and per-field Recharts distribution charts.
- **Streaming Data Export**: High-performance CSV & JSON streaming endpoints (`GET /forms/{id}/export?format=csv|json`).
- **Advanced Submission Browser**: Server-side filtering by date range, field-values, IP addresses, search strings, and sorting.
- **Data Governance**: Data Retention Policy enforcement, audited bulk deletion (`POST /forms/{id}/submissions/bulk-delete`), and persistent `audit_logs` tracking.
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
