# FormCraft — Enterprise Low-Code Dynamic Form & Workflow Data Collection Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/Springboard-Internship-2026/Low-Code-Dynamic-Form-Workflow---Data-Collection-Platform_Jun_2026)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react)](https://react.dev)
[![Recharts](https://img.shields.io/badge/Recharts-2.12+-22b8cf.svg)](https://recharts.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1.svg?logo=postgresql)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg?logo=docker)](https://www.docker.com)

> **Production-Grade Enterprise Form & Data Collection Engine** — Built with FastAPI, SQLAlchemy, PostgreSQL, Alembic, React 19, Vite, Recharts, TailwindCSS, Zod, and React Hook Form.

---

## 🚀 Overview

FormCraft is an enterprise-grade low-code platform designed for building, versioning, rendering, and collecting data from complex dynamic forms. It features a drag-and-drop form builder, live conditional rule engine (IF/THEN show/hide/require/disable), server & client validation mirroring, Recharts visual analytics, high-performance streaming CSV & JSON exports, interactive logic flow diagrams, automated data retention policies, and persistent audit logging.

---

## 🏗️ Architecture & Folder Structure

```
Low code dynamic form/
├── backend/                  # FastAPI + SQLAlchemy Clean Architecture
│   ├── app/
│   │   ├── api/v1/           # REST Controllers (Forms, Fields, Conditions, Public, Analytics, Admin, Audit Logs)
│   │   ├── core/             # Database connection, Security, JWT Auth, Settings Config
│   │   ├── models/           # 10 Relational SQLAlchemy ORM Models (forms, versions, fields, rules, submissions, audit_logs, etc.)
│   │   ├── repositories/     # Repository Data Access Layer
│   │   ├── schemas/          # Pydantic v2 Schemas & DTOs
│   │   └── services/         # Business Logic (RuleEngine, ValidationEngine, FormService, SubmissionService)
│   ├── alembic/              # Database Schema Migrations
│   ├── uploads/              # File Upload Storage Directory
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # React 19 + Vite + TailwindCSS + Recharts
│   ├── src/
│   │   ├── components/
│   │   │   ├── form-builder/ # ConditionBuilder, RuleVisualizerGraph, FieldTypePanel, FieldConfigPanel
│   │   │   ├── public/       # Public Form Renderer & 11 Typed Field Components
│   │   │   ├── dashboard/    # Sidebar, Navbar, EmptyState, SkeletonCard
│   │   │   └── ui/           # StatusBadge, Spinners, Dialogs
│   │   ├── contexts/         # AuthContext
│   │   ├── hooks/            # TanStack React Query Hooks
│   │   ├── pages/            # DashboardHome, CreatedForms, FormBuilder, FormResponses, FormAnalytics, AdminConsole
│   │   ├── services/         # Axios API Service Modules (formsApi, responsesApi, dashboardApi, adminApi)
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml        # Orchestrates PostgreSQL 15, FastAPI, and Vite-Nginx SPA
```

---

## 🏆 21-Day Internship Roadmap & Completion Summary

The project is **100% Complete**, fulfilling all 21 Days of the 3-Milestone Internship Breakdown:

### Milestone 1 — Form Schema Engine & Field Type Library (Days 1–6)
- **Day 1**: Project skeleton (FastAPI + PostgreSQL + React Vite + Docker Compose).
- **Day 2**: `FieldType` enum & catalogue API (`GET /api/v1/field-types`) supporting 11 field types (`text`, `textarea`, `number`, `email`, `phone`, `dropdown`, `radio`, `multi_checkbox`, `date`, `file_upload`, `rating`).
- **Day 3**: Form creation API (`POST /forms`) & Form Builder UI.
- **Day 4**: Field lifecycle management (`PUT/DELETE /fields`, reordering, live preview toggle).
- **Day 5**: Form versioning snapshots (`form_versions` snapshots on publish), state transitions (`draft` → `published` → `archived`).
- **Day 6**: Unauthenticated share token links (`GET /public/forms/{share_token}`).

### Milestone 2 — Conditional Logic Engine, Server Validation & Submissions (Days 7–13)
- **Day 7**: `conditional_rules` schema & Rule Builder UI.
- **Day 8**: Rule Evaluator service supporting 8 operators (`equals`, `not_equals`, `contains`, `greater_than`, `less_than`, `is_empty`, `is_not_empty`, `in`) and 4 actions (`show`, `hide`, `require`, `disable`).
- **Day 9**: Server-side Pydantic & client-side validation mirroring with human-readable error contracts.
- **Day 10**: Dropdown membership & file attachment validation + public form renderer (`PublicForm.jsx`).
- **Day 11**: `POST /public/forms/{token}/submit` endpoint saving `submissions` and `response_values`.
- **Day 12**: Secure multipart file upload with access-controlled download links (`POST /public/uploads`).
- **Day 13**: Submission confirmation view with response summary & idempotency protection.

### Milestone 3 — Response Analytics, Export, Flow Visualizer & Admin Compliance (Days 14–21)
- **Day 14**: Response telemetry overview APIs (`GET /dashboard/overview`).
- **Day 15**: Streaming CSV & JSON data exports (`GET /forms/{id}/export?format=csv|json`).
- **Day 16**: Server-side submission filtering (date range, field values, IP address, search queries, pagination).
- **Day 17**: Per-field Recharts visualizations (Pie/Donut charts for choice fields, Bar charts for text/numeric fields, 30-day submission velocity trends).
- **Day 18**: Form duplication (`POST /forms/{id}/duplicate`) & Interactive Rule Flow Graph visualizer (`RuleVisualizerGraph.jsx`).
- **Day 19**: Data Retention Policy auto-purge, bulk submission deletion with audit logging, and `audit_logs` table.
- **Day 20**: OpenAPI Swagger metadata polish, Docker Compose verification, and cross-app navigation pass.
- **Day 21**: Automated 16-step E2E Python integration test suite & final demo walkthrough verification.

---

## 🌟 Key Features & Capabilities

### 1. 11 Typed Field Catalogue
Supports Short Text, Long Text (Textarea), Number, Email, Phone, Dropdown, Radio, Multi-Checkbox, Date, File Upload, and Rating Scale — driven by backend JSONB config rules.

### 2. Live Conditional Rule Engine & Flow Graph
- **Stateless Evaluator**: Evaluates show/hide/require/disable rules live in browser as respondents type.
- **Conflict Resolution**: `HIDE` overrides `SHOW`; hidden fields strip required constraints automatically.
- **Rule Flow Graph**: Visual node-diagram (`RuleVisualizerGraph.jsx`) representing trigger fields, operators, action badges, and target fields.

### 3. Recharts Visual Analytics
Per-question option distribution Pie & Bar charts, 30-day submission velocity trend lines, and completion time histograms (`FormAnalytics.jsx`).

### 4. Streaming CSV & JSON Data Exports
High-performance streaming generators (`GET /forms/{id}/export?format=csv|json`) capable of outputting large submission datasets with low memory footprints.

### 5. Advanced Server-Side Response Browser
Search and filter submissions by date range (`date_from` / `date_to`), field ID + field value, IP address, or full-text value search, complete with multi-select bulk deletion.

### 6. Data Governance & Audit Trail
- **Data Retention Policy**: Configurable auto-delete threshold (30 to 365 days) with manual purge trigger (`POST /admin/retention-policy/execute`).
- **Audit Logs Table**: Persistent PostgreSQL `audit_logs` table tracking administrative, bulk deletion, and retention policy events.

---

## 📡 REST API Quick Reference

Full Interactive Swagger Documentation: **`http://localhost:8000/docs`**

| Category | Method | Endpoint | Description |
|---|---|---|---|
| **Forms** | `POST` | `/api/v1/forms` | Create a new form |
| | `GET` | `/api/v1/forms` | List forms (paginated, search, status filter) |
| | `GET` | `/api/v1/forms/{id}` | Get form detail with fields and versions |
| | `POST` | `/api/v1/forms/{id}/publish` | Publish form & freeze version snapshot |
| | `POST` | `/api/v1/forms/{id}/duplicate` | Duplicate form structure |
| | `GET` | `/api/v1/forms/{id}/export` | Export submissions (`?format=csv` or `?format=json`) |
| **Fields** | `POST` | `/api/v1/forms/{id}/fields` | Add typed field |
| | `PUT` | `/api/v1/forms/{id}/fields/{field_id}` | Edit field label/config |
| | `DELETE` | `/api/v1/forms/{id}/fields/{field_id}` | Delete field |
| **Rules** | `POST` | `/api/v1/forms/{id}/conditions` | Create conditional rule |
| | `DELETE` | `/api/v1/forms/{id}/conditions/{rule_id}` | Delete conditional rule |
| **Public** | `GET` | `/api/v1/public/forms/{share_token}` | Retrieve unauthenticated form schema |
| | `POST` | `/api/v1/public/forms/{token}/evaluate` | Live conditional rule evaluation |
| | `POST` | `/api/v1/public/forms/{token}/submit` | Submit validated response |
| | `POST` | `/api/v1/public/uploads` | Upload attachment file |
| **Analytics**| `GET` | `/api/v1/dashboard/form-analytics/{id}` | Recharts telemetry distributions |
| **Admin** | `POST` | `/api/v1/forms/{id}/submissions/bulk-delete` | Bulk delete selected submissions |
| | `GET` | `/api/v1/admin/audit-logs` | Retrieve persistent system audit logs |
| | `POST` | `/api/v1/admin/retention-policy/execute` | Execute data retention purge |

---

## 🗄️ Database Schema

The database consists of **10 normalized PostgreSQL tables**:

1. **`forms`**: Form metadata, settings JSONB, share token, status (`draft`/`published`/`archived`).
2. **`form_versions`**: Frozen version snapshots (`schema_snapshot` JSONB).
3. **`fields`**: Form fields, type, label, order_index, config JSONB.
4. **`field_options`**: Dropdown, radio, and checkbox choices.
5. **`conditional_rules`**: Source field, target field, operator, comparison value, action.
6. **`submissions`**: Response entries (form_id, version_id, IP address, completion_time_seconds, submitted_at).
7. **`response_values`**: Individual response values (field_id, raw text/JSON value, file_path).
8. **`users`**: Platform user accounts and authentication credentials.
9. **`audit_logs`**: Persistent audit log table (action, target_type, actor_email, details JSONB).
10. **`alembic_version`**: Database schema migration tracking.

---

## 🛠️ Quickstart Installation Guide

### Option A — Docker Compose (Recommended)

```bash
# Clone repository
git clone https://github.com/Springboard-Internship-2026/Low-Code-Dynamic-Form-Workflow---Data-Collection-Platform_Jun_2026.git
cd Low-Code-Dynamic-Form-Workflow---Data-Collection-Platform_Jun_2026

# Build and start PostgreSQL, FastAPI, and Vite-Nginx containers
docker-compose up --build
```

- **Frontend App**: `http://localhost:5173` (or container port `3000`)
- **FastAPI Swagger Docs**: `http://localhost:8000/docs`

---

### Option B — Local Development Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
alembic upgrade head
python -m uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
# → Open http://localhost:5173
```

---

## 🧪 Testing & Verification

### Running Automated E2E Integration Test Suite
```bash
python scratch/test_e2e_full_lifecycle.py
```
*Executes 16 automated end-to-end integration test scenarios validating the full platform lifecycle.*

### Running Frontend Production Build Check
```bash
cd frontend
npm run build
```
*Compiles all 2,496 frontend modules cleanly with zero errors.*
