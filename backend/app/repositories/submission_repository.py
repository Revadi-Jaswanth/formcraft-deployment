"""
SubmissionRepository — queries for submissions and response_values.

Day 16 update: list_for_form() now accepts rich filter parameters:
  - date_from / date_to  → filter by submitted_at range
  - field_id + field_value → filter by a specific field's response value
  - ip_address           → exact-match IP filter
  - search               → full-text search across all response_values for the submission
  - order_by / order_dir → sortable columns
"""
from typing import List, Optional, Tuple
from uuid import UUID
from datetime import datetime

from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, func, exists, and_, cast
from sqlalchemy import String as SAString

from app.models.submission import Submission, ResponseValue
from app.repositories.base import BaseRepository


class SubmissionRepository(BaseRepository[Submission]):
    def __init__(self, db: Session) -> None:
        super().__init__(Submission, db)

    def get_with_responses(self, submission_id: UUID) -> Optional[Submission]:
        stmt = (
            select(Submission)
            .where(Submission.id == submission_id)
            .options(selectinload(Submission.response_values))
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list_for_form(
        self,
        form_id: UUID,
        skip: int = 0,
        limit: int = 50,
        # ── Day 16 filters ────────────────────────────────────────────
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        field_id: Optional[UUID] = None,
        field_value: Optional[str] = None,
        ip_address: Optional[str] = None,
        search: Optional[str] = None,
        order_by: str = "submitted_at",
        order_dir: str = "desc",
    ) -> Tuple[List[Submission], int]:
        """
        Return (items, total) for a form's submissions with optional filtering.

        Filter logic:
          date_from / date_to  — inclusive range on submitted_at
          field_id + field_value — finds submissions where the given field
                                   contains field_value (case-insensitive LIKE)
          field_id alone        — finds submissions that have any response for
                                   that field
          ip_address            — exact match on ip_address column
          search                — case-insensitive substring match across ALL
                                   response_values.value for the submission
          order_by / order_dir  — one of {submitted_at, ip_address,
                                   completion_time_seconds}; asc or desc
        """
        base_q = self.db.query(Submission).filter(Submission.form_id == form_id)

        # ── Date range ────────────────────────────────────────────────
        if date_from is not None:
            base_q = base_q.filter(Submission.submitted_at >= date_from)
        if date_to is not None:
            base_q = base_q.filter(Submission.submitted_at <= date_to)

        # ── IP address ────────────────────────────────────────────────
        if ip_address:
            base_q = base_q.filter(Submission.ip_address == ip_address)

        # ── Field-value filter ────────────────────────────────────────
        # Subquery: does a ResponseValue row exist that matches the criteria?
        if field_id is not None:
            rv_conditions = [ResponseValue.field_id == field_id]
            if field_value:
                rv_conditions.append(
                    ResponseValue.value.ilike(f"%{field_value}%")
                )
            rv_exists = exists().where(
                and_(
                    ResponseValue.submission_id == Submission.id,
                    *rv_conditions,
                )
            )
            base_q = base_q.filter(rv_exists)

        # ── Full-text search across all response values ───────────────
        if search:
            search_exists = exists().where(
                and_(
                    ResponseValue.submission_id == Submission.id,
                    ResponseValue.value.ilike(f"%{search}%"),
                )
            )
            base_q = base_q.filter(search_exists)

        # ── Count after filters (before pagination) ───────────────────
        total = base_q.count()

        # ── Ordering ──────────────────────────────────────────────────
        _SORTABLE = {"submitted_at", "ip_address", "completion_time_seconds"}
        sort_col_name = order_by if order_by in _SORTABLE else "submitted_at"
        sort_col = getattr(Submission, sort_col_name)
        sort_expr = sort_col.asc() if order_dir == "asc" else sort_col.desc()

        items = (
            base_q
            .options(selectinload(Submission.response_values))
            .order_by(sort_expr)
            .offset(skip)
            .limit(limit)
            .all()
        )
        return items, total

    def create_submission(
        self, sub_data: dict, responses: List[dict]
    ) -> Submission:
        submission = Submission(**sub_data)
        self.db.add(submission)
        self.db.flush()

        for r in responses:
            rv = ResponseValue(submission_id=submission.id, **r)
            self.db.add(rv)

        self.db.commit()
        self.db.refresh(submission)
        return submission
