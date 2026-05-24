from typing import Any, Optional


class AppException(Exception):
    """Base class for all application-defined exceptions."""

    status_code: int = 500
    error_code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred."

    def __init__(
        self,
        message: Optional[str] = None,
        *,
        status_code: Optional[int] = None,
        error_code: Optional[str] = None,
        details: Optional[Any] = None,
    ) -> None:
        super().__init__(message or self.message)
        if message is not None:
            self.message = message
        if status_code is not None:
            self.status_code = status_code
        if error_code is not None:
            self.error_code = error_code
        self.details = details


class NotFoundError(AppException):
    status_code = 404
    error_code = "NOT_FOUND"
    message = "Resource not found."


class ConflictError(AppException):
    status_code = 409
    error_code = "CONFLICT"
    message = "Resource conflict."


class ValidationError(AppException):
    status_code = 422
    error_code = "VALIDATION_ERROR"
    message = "Validation failed."


class UnauthorizedError(AppException):
    status_code = 401
    error_code = "UNAUTHORIZED"
    message = "Authentication required."


class ForbiddenError(AppException):
    status_code = 403
    error_code = "FORBIDDEN"
    message = "Insufficient permissions."
