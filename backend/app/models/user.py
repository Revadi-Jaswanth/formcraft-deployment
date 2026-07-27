"""
User model — supporting multi-tenant authenticated form ownership.
"""
from uuid import uuid4, UUID
from typing import Optional, List
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean
from sqlalchemy.dialects.postgresql import UUID as PGUUID

from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="USER", nullable=False)

    # Relationships
    forms: Mapped[List["Form"]] = relationship("Form", back_populates="owner")

    @property
    def name(self) -> Optional[str]:
        return self.full_name

    @name.setter
    def name(self, value: Optional[str]) -> None:
        self.full_name = value

    @property
    def password_hash(self) -> Optional[str]:
        return self.hashed_password

    @password_hash.setter
    def password_hash(self, value: Optional[str]) -> None:
        self.hashed_password = value

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
