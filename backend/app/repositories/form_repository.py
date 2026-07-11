"""
FormRepository — all database queries specific to forms and form_versions.
"""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy import func, select

from app.models.form import Form, FormVersion
from app.models.submission import Submission
from app.models.field import Field
from app.repositories.base import BaseRepository


class FormRepository(BaseRepository[Form]):
    def __init__(self, db: Session) -> None:
        super().__init__(Form, db)

    # ── Custom reads ──────────────────────────────────────────────────────────

    def get_with_details(self, form_id: UUID) -> Optional[Form]:
        """Eagerly load fields (with options), conditions, and versions."""
        stmt = (
            select(Form)
            .where(Form.id == form_id, Form.is_deleted == False)
            .options(
                selectinload(Form.fields).selectinload(Field.options),
                selectinload(Form.conditions),
                selectinload(Form.versions),
            )
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_with_fields(self, form_id: UUID) -> Optional[Form]:
        """Eagerly load fields and conditions (no versions)."""
        stmt = (
            select(Form)
            .where(Form.id == form_id, Form.is_deleted == False)
            .options(
                selectinload(Form.fields).selectinload(Field.options),
                selectinload(Form.conditions),
            )
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_share_token(self, token: str) -> Optional[Form]:
        """Used by the public endpoints."""
        stmt = (
            select(Form)
            .where(Form.share_token == token, Form.is_deleted == False)
            .options(
                selectinload(Form.fields).selectinload(Field.options),
                selectinload(Form.conditions),
                selectinload(Form.versions),
            )
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list_forms(
        self,
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[Form], int]:
        """Return paginated forms + total count (for the admin dashboard)."""
        base_q = self.db.query(Form).filter(Form.is_deleted == False)
        if status:
            base_q = base_q.filter(Form.status == status)
        if search:
            base_q = base_q.filter(Form.title.ilike(f"%{search}%"))
        total = base_q.count()
        items = (
            base_q
            .order_by(Form.updated_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return items, total

    def count_fields(self, form_id: UUID) -> int:
        return self.db.query(func.count(Field.id)).filter(Field.form_id == form_id).scalar() or 0

    def count_submissions(self, form_id: UUID) -> int:
        return (
            self.db.query(func.count(Submission.id))
            .filter(Submission.form_id == form_id)
            .scalar()
            or 0
        )

    # ── Version helpers ───────────────────────────────────────────────────────

    def get_active_version(self, form_id: UUID) -> Optional[FormVersion]:
        return (
            self.db.query(FormVersion)
            .filter(FormVersion.form_id == form_id, FormVersion.is_active == True)
            .order_by(FormVersion.version_number.desc())
            .first()
        )

    def deactivate_all_versions(self, form_id: UUID) -> None:
        (
            self.db.query(FormVersion)
            .filter(FormVersion.form_id == form_id)
            .update({"is_active": False})
        )
        self.db.flush()

    def create_version(self, version: FormVersion) -> FormVersion:
        self.db.add(version)
        self.db.flush()
        return version
