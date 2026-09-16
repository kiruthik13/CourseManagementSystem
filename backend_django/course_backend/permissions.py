"""
Global permission utilities shared across the project.
Role-specific permission classes live in accounts/permissions.py.
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class ReadOnly(BasePermission):
    """Allow GET, HEAD, OPTIONS to any authenticated user."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.method in SAFE_METHODS
        )
