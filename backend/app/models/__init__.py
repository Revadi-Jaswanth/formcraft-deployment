"""
Import all models here so that Alembic's autogenerate can discover them
and SQLAlchemy's relationship resolution works correctly.
"""
from app.models.base import Base, TimestampMixin  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.form import Form, FormVersion  # noqa: F401
from app.models.field import Field, FieldOption  # noqa: F401
from app.models.condition import ConditionalRule  # noqa: F401
from app.models.submission import Submission, ResponseValue  # noqa: F401

__all__ = [
    "Base",
    "TimestampMixin",
    "User",
    "Form",
    "FormVersion",
    "Field",
    "FieldOption",
    "ConditionalRule",
    "Submission",
    "ResponseValue",
]
