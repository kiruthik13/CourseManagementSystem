"""
Global exception handler for the Course Management System API.

All API errors are returned in a consistent JSON format:
    {
        "error": "Human-readable summary",
        "field_errors": { "field_name": ["error message"] }
    }
"""
import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    NotFound,
    MethodNotAllowed,
    ValidationError,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom DRF exception handler.

    Wraps all exceptions in the standard error envelope:
        { "error": "...", "field_errors": { ... } }
    """
    # Let DRF handle the exception first (sets response.status_code etc.)
    response = exception_handler(exc, context)

    # ----------------------------------------------------------------
    # Unhandled exception (500)
    # ----------------------------------------------------------------
    if response is None:
        logger.exception("Unhandled exception: %s", exc)
        return Response(
            {
                "error": "An unexpected server error occurred. Please try again later.",
                "field_errors": {},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # ----------------------------------------------------------------
    # Build the standardised payload
    # ----------------------------------------------------------------
    error_message = "An error occurred."
    field_errors: dict = {}

    if isinstance(exc, (NotAuthenticated, AuthenticationFailed)):
        error_message = "Authentication required. Please provide a valid Bearer token."

    elif isinstance(exc, PermissionDenied):
        error_message = "You do not have permission to perform this action."

    elif isinstance(exc, NotFound):
        error_message = "The requested resource was not found."

    elif isinstance(exc, MethodNotAllowed):
        error_message = f"Method '{exc.args[0]}' is not allowed on this endpoint."

    elif isinstance(exc, ValidationError):
        error_message = "Validation failed. Please correct the errors below."
        raw = response.data
        if isinstance(raw, dict):
            # Flatten DRF's nested error lists into a clean dict
            for key, value in raw.items():
                if isinstance(value, list):
                    field_errors[key] = [str(v) for v in value]
                elif isinstance(value, dict):
                    field_errors[key] = value
                else:
                    field_errors[key] = [str(value)]
        elif isinstance(raw, list):
            field_errors["non_field_errors"] = [str(v) for v in raw]
        else:
            field_errors["non_field_errors"] = [str(raw)]

    elif isinstance(exc, APIException):
        error_message = str(exc.detail) if hasattr(exc, 'detail') else str(exc)

    response.data = {
        "error": error_message,
        "field_errors": field_errors,
    }
    return response
