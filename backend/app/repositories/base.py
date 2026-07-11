"""
Generic base repository — provides standard CRUD for any SQLAlchemy model.
"""
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """
    Provides get / get_all / count / create / update / delete / save
    for any model.  Subclasses override or extend these methods.
    """

    def __init__(self, model: Type[ModelType], db: Session) -> None:
        self.model = model
        self.db = db

    # ── Read ──────────────────────────────────────────────────────────────────

    def get(self, id: UUID) -> Optional[ModelType]:
        return self.db.get(self.model, id)

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        **filters: Any,
    ) -> List[ModelType]:
        query = self.db.query(self.model)
        for attr, value in filters.items():
            query = query.filter(getattr(self.model, attr) == value)
        return query.offset(skip).limit(limit).all()

    def count(self, **filters: Any) -> int:
        query = self.db.query(self.model)
        for attr, value in filters.items():
            query = query.filter(getattr(self.model, attr) == value)
        return query.count()

    # ── Write ─────────────────────────────────────────────────────────────────

    def create(self, data: Dict[str, Any]) -> ModelType:
        instance = self.model(**data)
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def update(self, instance: ModelType, data: Dict[str, Any]) -> ModelType:
        for key, value in data.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def save(self, instance: ModelType) -> ModelType:
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def delete(self, id: UUID) -> bool:
        instance = self.get(id)
        if instance is None:
            return False
        self.db.delete(instance)
        self.db.commit()
        return True

    def flush(self, instance: ModelType) -> ModelType:
        self.db.add(instance)
        self.db.flush()
        return instance
