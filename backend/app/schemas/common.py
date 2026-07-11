"""
Shared Pydantic schemas: pagination, generic message response, error envelope.
"""
from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    pages: int


class MessageResponse(BaseModel):
    message: str


class ErrorDetail(BaseModel):
    detail: str
    error_code: Optional[str] = None
