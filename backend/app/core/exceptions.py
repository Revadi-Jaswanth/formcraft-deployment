from fastapi import HTTPException, status


class FormCraftException(Exception):
    """Base application exception."""

    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class NotFoundException(FormCraftException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            detail=f"{resource} not found.",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class ConflictException(FormCraftException):
    def __init__(self, detail: str):
        super().__init__(detail=detail, status_code=status.HTTP_409_CONFLICT)


class ForbiddenException(FormCraftException):
    def __init__(self, detail: str = "Operation not permitted."):
        super().__init__(detail=detail, status_code=status.HTTP_403_FORBIDDEN)


class ValidationException(FormCraftException):
    def __init__(self, detail: str):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )


def raise_not_found(resource: str = "Resource") -> None:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} not found.",
    )


def raise_bad_request(detail: str) -> None:
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def raise_conflict(detail: str) -> None:
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)
