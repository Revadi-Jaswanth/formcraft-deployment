# FormCraft — Low-Code Dynamic Form Workflow & Data Collection Platform

> **Production-Grade Enterprise Form Engine** — Built with FastAPI, SQLAlchemy, PostgreSQL, Alembic, React 19, Vite, TailwindCSS, Zod, and React Hook Form.

---

## 🚀 Overview

FormCraft is an enterprise-grade low-code platform for designing, deploying, and collecting data from complex dynamic forms. It features a visual drag-and-drop form builder, advanced conditional logic engine (IF/THEN rules), configuration-driven server & client validation, instant file uploads, frozen version snapshots, idempotency protection, and responsive respondent rendering.

---

## 🏗️ Architecture & Technology Stack

```
Low code dynamic form/
├── backend/                  # FastAPI + SQLAlchemy Clean Architecture
│   ├── app/
│   │   ├── api/v1/           # REST Route Controllers (Admin & Public APIs)
│   │   ├── core/             # Configuration, Database connection, Security
│   │   ├── models/           # SQLAlchemy ORM Models (9 Relational Tables)
│   │   ├── repositories/     # Repository Data Access Layer
│   │   ├── schemas/          # Pydantic v2 Schemas & DTOs
│   │   └── services/         # Business Logic (RuleEngine, ValidationEngine, SubmissionService)
│   ├── alembic/              # Database Schema Migrations
│   ├── tests/                # Pytest Test Suite (35 Unit & Pipeline Tests)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # React 19 + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── form-builder/ # RuleBuilder, RuleCard, RuleFlow, FieldList, LogicBadge
│   │   │   ├── public/       # FormRenderer, FormSkeleton & Modular Field Components
│   │   │   │   └── fields/   # TextField, NumberField, EmailField, PhoneField, TextareaField,
│   │   │   │                 # DropdownField, CheckboxField, RadioField, DateField, RatingField, FileUploadField, FieldFactory
│   │   │   └── ui/           # Badges, Modals, Spinners
│   │   ├── hooks/            # TanStack React Query Hooks
│   │   ├── lib/              # buildZodSchema, mapBackendErrors, validators, fieldTypes
│   │   ├── pages/            # Dashboard, FormBuilder, PublicForm
│   │   ├── services/         # Axios API Client
│   │   └── tests/            # Vitest Component Test Suite (7 Component Tests)
│   ├── vitest.config.js
│   ├── package.json
│   └── vite.config.js
└── docker-compose.yml
```

---

## 🌟 Key Features

### 1. Form Schema Engine & Field Library
- Supports 11 field types: **Short Text**, **Long Text**, **Number**, **Email**, **Phone**, **Dropdown**, **Checkboxes**, **Radio Buttons**, **Date/DateTime**, **File Upload**, and **Rating Scale**.
- Per-field JSONB configurations: min/max length, numeric range, integer constraint, date range, selection bounds, rating scale, allowed file types, and file size limits.

### 2. Form Versioning & Snapshots
- Publishing a form freezes its schema into an immutable `FormVersion` snapshot (`version_number` v1, v2...).
- Historical submissions remain linked to the exact version snapshot active at submission time for data integrity.

### 3. Conditional Rule Engine (Backend & Frontend)
- Pure, deterministic, stateless rule evaluation engine supporting 10 comparison operators (`equals`, `not_equals`, `contains`, `not_contains`, `greater_than`, `less_than`, `is_empty`, `is_not_empty`, `in`, `not_in`).
- Supports 4 conditional actions: `show`, `hide`, `require`, and `disable`.
- Conflict resolution: **HIDE** always overrides SHOW; hidden fields clear required state.
- Logic groups: AND semantics within groups, OR semantics across groups.

### 4. Enterprise Visual Rule Builder UI
- **Rule Builder**: Form for configuring trigger fields, operators, comparison values, actions, and target fields.
- **Rule Cards**: Readable IF/THEN sentences with inline edit and optimistic delete.
- **Rule Flow Diagram**: Visual tree showing source-to-target rule branches.
- **Field Badges**: `⚡ N` badges on field cards with tooltips showing active rules.

### 5. Config-Driven Validation Engine (Server & Client)
- **Backend**: `ValidationEngine` evaluates rules & returns structured error objects containing `field_id`, `field_name`, `error_code`, and `message`.
- **Client**: `buildZodSchema` dynamically generates Zod validation schemas matching backend field configurations.
- **Error Mapping**: `mapBackendErrors` maps HTTP 422 errors directly to React Hook Form inline field errors (red border, alert icon, helper text).

### 6. Dynamic Public Form Renderer
- Renders form schemas dynamically using `FieldFactory` component registry (zero hardcoded forms).
- Live rule evaluation: updates visibility, required flags, and Zod schemas on blur/change without page reloads.
- Accessible: complete ARIA attributes (`aria-required`, `aria-invalid`, `aria-describedby`), keyboard navigation, focus management.

### 7. File Upload & Safe Downloads
- Multipart file upload with client & server size/extension validation.
- Files stored under `/uploads` with UUID filenames.
- Path traversal protection on `GET /public/uploads/{file_name}` with correct MIME headers & `Content-Disposition`.

### 8. Submission Pipeline & Idempotency
- Atomic single DB transaction with automatic rollback on error.
- Idempotency key protection via `Idempotency-Key` header (prevents duplicate submission records).
- Confirmation screen displaying submission ID, timestamp, summary stats, copy ID button, and navigation controls.

---

## 📡 REST API Reference

Interactive Swagger Documentation: **`http://localhost:8000/docs`**

### Admin Forms API (`/api/v1/forms`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/forms` | Create a new form |
| `GET` | `/api/v1/forms` | List forms (paginated, search, status filter) |
| `GET` | `/api/v1/forms/{id}` | Get form with fields, rules, and versions |
| `PUT` | `/api/v1/forms/{id}` | Update form title, description, or settings |
| `DELETE` | `/api/v1/forms/{id}` | Soft-delete form |
| `POST` | `/api/v1/forms/{id}/publish` | Publish form & freeze version snapshot |
| `POST` | `/api/v1/forms/{id}/archive` | Archive form |
| `POST` | `/api/v1/forms/{id}/restore` | Restore archived form to draft |
| `POST` | `/api/v1/forms/{id}/duplicate` | Duplicate form structure |
| `GET` | `/api/v1/forms/{id}/versions` | Get version history |
| `GET` | `/api/v1/forms/{id}/share-link` | Generate public share link |

### Form Fields API (`/api/v1/forms/{form_id}/fields`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/forms/{form_id}/fields` | List fields ordered by index |
| `POST` | `/api/v1/forms/{form_id}/fields` | Add field with configuration & options |
| `PUT` | `/api/v1/forms/{form_id}/fields/{field_id}` | Update field label, config, or options |
| `DELETE` | `/api/v1/forms/{form_id}/fields/{field_id}` | Delete field |
| `PUT` | `/api/v1/forms/{form_id}/fields/reorder` | Reorder field display sequence |

### Conditional Rules API (`/api/v1/forms/{form_id}/conditions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/forms/{form_id}/conditions` | List conditional rules |
| `POST` | `/api/v1/forms/{form_id}/conditions` | Create conditional rule |
| `PUT` | `/api/v1/forms/{form_id}/conditions/{rule_id}` | Update rule operator, value, or action |
| `DELETE` | `/api/v1/forms/{form_id}/conditions/{rule_id}` | Delete conditional rule |

### Respondent Public API (`/api/v1/public`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/public/forms/{token}` | Retrieve public form schema |
| `GET` | `/api/v1/public/forms/{token}/status` | Check if form is open for responses |
| `POST` | `/api/v1/public/forms/{token}/evaluate` | Live rule evaluation endpoint |
| `POST` | `/api/v1/public/forms/{token}/submit` | Submit response with Idempotency-Key |
| `POST` | `/api/v1/public/uploads` | Upload attachment file |
| `GET` | `/api/v1/public/uploads/{file_name}` | Download uploaded file safely |

---

## 🗄️ Database Schema

The database consists of 9 normalized PostgreSQL tables managed via Alembic migrations:

1. **`forms`**: Main form metadata, title, settings JSONB, share_token, status (`draft`, `published`, `archived`), soft delete flag.
2. **`form_versions`**: Immutable schema snapshots (`schema_snapshot` JSONB), version_number, is_active flag.
3. **`fields`**: Form fields, field_type, label, description, placeholder, is_required, order_index, config JSONB.
4. **`field_options`**: Dropdown, checkbox, and radio option choices (label, value, order_index).
5. **`conditional_rules`**: Source field, target field, operator, comparison value, action, logic_group.
6. **`submissions`**: Submission records referencing form_id & form_version_id, session_id, ip_address, completion_time_seconds, submitted_at timestamp.
7. **`response_values`**: Submitted field values (field_id, raw value, file_path, submission_id).
8. **`users`**: User account table for admin access.
9. **`alembic_version`**: Migration tracking version table.

---

## 🚀 Installation & Setup

### Option A — Docker Compose (Recommended)

```bash
# Clone or navigate to the project root
cd "Low code dynamic form"

# Build and start PostgreSQL, Backend, and Frontend containers
docker compose up --build
```
- **Admin Dashboard**: `http://localhost:5173` (or port 3000 in container)
- **FastAPI Documentation**: `http://localhost:8000/docs`

---

### Option B — Local Development Setup

#### Backend Setup
```bash
cd backend

# Create virtual environment (optional)
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install Python dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start Uvicorn backend server
python -m uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup
```bash
cd frontend

# Install Node dependencies
npm install --legacy-peer-deps

# Start Vite development server
npm run dev
# → Open http://localhost:5173
```

---

## 🧪 Testing Suite

### Running Backend Unit & Integration Tests (Pytest)
```bash
cd backend
python -m pytest tests/ -v
```
*Executes 35 automated tests covering RuleEngine operators, conflict resolution, logic groups, ValidationEngine type checks, file constraints, submission pipeline, hidden field stripping, and idempotency protection.*

### Running Frontend Component Tests (Vitest)
```bash
cd frontend
npx vitest run
```
*Executes 7 Vitest tests covering FieldFactory type resolution, TextField ARIA attributes, DropdownField, CheckboxField, RatingField, FormRenderer conditional visibility, and FileUploadField drag & drop.*

### Verifying Production Build
```bash
cd frontend
npm run build
```

---

## 🔒 Security Audit & Hardening

- **SQL Injection**: Handled safely via SQLAlchemy ORM parameterized queries.
- **Path Traversal**: File downloads in `GET /public/uploads/{file_name}` sanitize file paths using `os.path.basename` and resolve absolute path within `UPLOAD_DIR`.
- **XSS Protection**: React automatic string escaping on all rendered labels & values.
- **Idempotency**: Requests with matching `Idempotency-Key` headers return original responses without duplicate DB writes.
- **Hidden Field Stripping**: Server-side rule evaluation strips responses for hidden fields prior to validation and database insertion.

---

## 🔮 Future Scope & Roadmap

1. **Role-Based Access Control (RBAC)**: Fine-grained permissions (Admin, Editor, Viewer).
2. **Multi-page Form Wizard**: Stepped form wizard with section progress indicators.
3. **Analytics & CSV/XLSX Export**: Response visualization charts and bulk export functionality.
4. **Third-Party Webhooks & Integrations**: Zapier, Slack, and email notifications on submission.
