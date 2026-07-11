"""
SubmissionRepository — queries for submissions and response_values.
"""
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, func

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
        self, form_id: UUID, skip: int = 0, limit: int = 50
    ) -> Tuple[List[Submission], int]:
        base_q = self.db.query(Submission).filter(Submission.form_id == form_id)
        total = base_q.count()
        items = (
            base_q
            .options(selectinload(Submission.response_values))
            .order_by(Submission.submitted_at.desc())
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
