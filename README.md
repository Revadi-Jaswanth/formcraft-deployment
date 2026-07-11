# FormCraft — Low-Code Dynamic Form Platform

> **Milestone 1** — Form Schema Engine, Field Type Library, CRUD APIs, Versioning, Conditional Logic, Shareable Links

---

## 🏗️ Architecture

```
Low code dynamic form/
├── backend/                  # FastAPI + PostgreSQL
│   ├── app/
│   │   ├── core/             # Config, database, security, exceptions
│   │   ├── models/           # SQLAlchemy ORM models (7 tables)
│   │   ├── schemas/          # Pydantic v2 schemas
│   │   ├── repositories/     # Data access layer
│   │   ├── services/         # Business logic
│   │   └── api/v1/           # REST route handlers
│   ├── alembic/              # DB migrations
│   └── Dockerfile
├── frontend/                 # React 19 + Vite + TailwindCSS
│   └── src/
│       ├── components/       # UI, form-builder, public, layout
│       ├── pages/            # Dashboard, FormBuilder, PublicForm
│       ├── hooks/            # React Query hooks
│       ├── services/         # Axios API client
│       └── lib/              # Field type catalog
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Option A — Docker Compose (recommended)

```bash
# Clone / enter project directory
cd "Low code dynamic form"

# Start all services
docker compose up --build

# API: http://localhost:8000/docs
# App: http://localhost:3000
```

### Option B — Local Development

**Backend:**
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start PostgreSQL (or adjust DATABASE_URL in .env)
# Copy and edit env
cp .env.example .env

# Run migrations
alembic upgrade head

# Start API server
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:5173
```

---

## 📡 REST API

Interactive docs: **http://localhost:8000/docs**

### Forms
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/forms` | Create form |
| `GET` | `/api/v1/forms` | List forms (paginated, search, filter) |
| `GET` | `/api/v1/forms/{id}` | Get form with fields/conditions/versions |
| `PUT` | `/api/v1/forms/{id}` | Update form |
| `DELETE` | `/api/v1/forms/{id}` | Soft-delete |
| `POST` | `/api/v1/forms/{id}/publish` | Publish (generates version snapshot + share token) |
| `POST` | `/api/v1/forms/{id}/archive` | Archive |
| `POST` | `/api/v1/forms/{id}/restore` | Restore to draft |
| `POST` | `/api/v1/forms/{id}/duplicate` | Duplicate form |
| `GET` | `/api/v1/forms/{id}/versions` | Version history |

### Fields
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/forms/{id}/fields` | List fields |
| `POST` | `/api/v1/forms/{id}/fields` | Add field |
| `PUT` | `/api/v1/forms/{id}/fields/{fid}` | Update field |
| `DELETE` | `/api/v1/forms/{id}/fields/{fid}` | Delete field |
| `PUT` | `/api/v1/forms/{id}/fields/reorder` | Reorder fields |

### Conditions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/forms/{id}/conditions` | List rules |
| `POST` | `/api/v1/forms/{id}/conditions` | Add rule |
| `PUT` | `/api/v1/forms/{id}/conditions/{cid}` | Update rule |
| `DELETE` | `/api/v1/forms/{id}/conditions/{cid}` | Delete rule |

### Public (Respondent)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/public/forms/{token}` | Get public form schema |
| `GET` | `/api/v1/public/forms/{token}/status` | Check if form is open |
| `POST` | `/api/v1/public/forms/{token}/submit` | Submit a response |

---

## 🧩 Field Types

| Type | Config Options |
|------|---------------|
| `text` | min_length, max_length |
| `textarea` | min_length, max_length, rows |
| `number` | min_value, max_value, integer_only, decimal_places |
| `email` | — |
| `phone` | format_validation |
| `dropdown` | allow_other, searchable, multiple |
| `multi_checkbox` | min_selections, max_selections |
| `date` | min_date, max_date, include_time |
| `file_upload` | allowed_types, max_size_mb, multiple, max_files |
| `rating` | scale (2–10), icon, low_label, high_label |

---

## 🔄 Form Versioning

1. Create a **draft** form and add fields
2. **Publish** → generates a frozen `schema_snapshot` (FormVersion v1) + unique `share_token`
3. Edit fields → **Re-publish** → creates FormVersion v2
4. All historical submissions are linked to the version they were submitted against
5. The share URL (`/f/{token}`) always resolves to the **latest active version**

---

## 🗄️ Database Schema

```
users ──────────────────────────────────────┐
                                            │ (created_by, nullable)
forms ──────────────────────────────────────┘
  │
  ├── form_versions  (schema_snapshot JSONB)
  ├── fields
  │     └── field_options
  ├── conditional_rules  (source_field → target_field)
  └── submissions
        └── response_values
```

---

## 🔐 Authentication

- **Milestone 1**: Open admin routes in `ENVIRONMENT=development`
- Set `ENVIRONMENT=production` to enable `X-Api-Key` header enforcement
- **Milestone 2**: Full JWT auth (infrastructure already wired in `security.py`)
