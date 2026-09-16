"""
Role-based and object-level permission classes for the Course Management System.

Classes:
  IsAdminRole        — request.user.role == 'admin'
  IsInstructorRole   — request.user.role == 'instructor'
  IsStudentRole      — request.user.role == 'student'
  IsAdminOrReadOnly  — safe methods for any authenticated user; write for admins
  IsInstructorOrAdmin — instructor or admin
  IsOwnerOrAdmin     — object owner or admin (has_object_permission)
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminRole(BasePermission):
    """Allow access only to users with role=admin."""

    message = "Only administrators can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsInstructorRole(BasePermission):
    """Allow access only to users with role=instructor."""

    message = "Only instructors can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'instructor'
        )


class IsStudentRole(BasePermission):
    """Allow access only to users with role=student."""

    message = "Only students can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'student'
        )


class IsAdminOrReadOnly(BasePermission):
    """
    Safe methods (GET/HEAD/OPTIONS) are allowed for any authenticated user.
    Mutating methods require role=admin.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role == 'admin'


class IsInstructorOrAdmin(BasePermission):
    """Allow access for instructors or admins."""

    message = "This action requires instructor or administrator privileges."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ('admin', 'instructor')
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission.

    Grants access when:
      - The requesting user is an admin, OR
      - obj.user == request.user, OR
      - obj.student == request.user (for Enrollment objects)
    """

    message = "You do not have permission to access this resource."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True

        # Profile objects (InstructorProfile / StudentProfile)
        if hasattr(obj, 'user'):
            return obj.user_id == request.user.id

        # Enrollment objects
        if hasattr(obj, 'student'):
            return obj.student_id == request.user.id

        # User objects
        if hasattr(obj, 'email'):
            return obj.id == request.user.id

        return False
