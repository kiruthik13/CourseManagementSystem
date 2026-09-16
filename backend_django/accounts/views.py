"""
Views for the accounts app.

Auth endpoints    → /api/auth/
Student endpoints → /api/students/  (StudentViewSet registered in main router)
"""
import logging

from django.db import transaction
from rest_framework import generics, status, viewsets, filters
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User, StudentProfile
from .permissions import IsAdminRole, IsStudentRole
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    InstructorCreateSerializer,
    StudentCreateSerializer,
    UserSerializer,
    UserProfileUpdateSerializer,
    InstructorProfileSerializer,
    StudentProfileSerializer,
    StudentUpdateSerializer,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_tokens_for_user(user: User) -> dict:
    """Return access + refresh JWT tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def _user_response_data(user: User) -> dict:
    """Return the standard user block included in login/register responses."""
    return {
        'id': user.pk,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role,
    }


# ---------------------------------------------------------------------------
# Auth views
# ---------------------------------------------------------------------------

class RegisterView(APIView):
    """
    POST /api/auth/register/

    Public self-registration for students and instructors.
    Role 'admin' is always blocked — admins must be created via Django admin.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data.copy()
        # Force lowercase, allow student, instructor, and admin roles
        role = data.get('role', 'student').lower()
        if role not in ('student', 'instructor', 'admin'):
            role = 'student'
        data['role'] = role

        serializer = RegisterSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = _get_tokens_for_user(user)

        return Response(
            {
                'message': 'Registration successful.',
                'user': _user_response_data(user),
                'tokens': tokens,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    POST /api/auth/login/

    Returns JWT access + refresh tokens and basic user info.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        tokens = _get_tokens_for_user(user)

        return Response({
            'message': 'Login successful.',
            'access': tokens['access'],
            'refresh': tokens['refresh'],
            'user': _user_response_data(user),
        })


class LogoutView(APIView):
    """
    POST /api/auth/logout/

    Blacklists the submitted refresh token so it cannot be reused.
    Requires: { "refresh": "<refresh_token>" }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required.', 'field_errors': {}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError as exc:
            return Response(
                {'error': str(exc), 'field_errors': {}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        logger.info("User %s logged out and blacklisted refresh token.", request.user.email)
        return Response({'message': 'Logout successful. Refresh token has been invalidated.'})


class MeView(APIView):
    """
    GET /api/auth/me/

    Returns the current user's profile (including nested role-specific profile).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = UserSerializer(user).data

        # Attach role-specific profile when available
        if user.role == User.Role.INSTRUCTOR and hasattr(user, 'instructor_profile'):
            data['profile'] = InstructorProfileSerializer(user.instructor_profile).data
        elif user.role == User.Role.STUDENT and hasattr(user, 'student_profile'):
            data['profile'] = StudentProfileSerializer(user.student_profile).data

        return Response(data)


class ProfileUpdateView(APIView):
    """
    PUT/PATCH /api/auth/profile/

    Authenticated user updates their own basic info (name, phone).
    """

    permission_classes = [IsAuthenticated]

    def put(self, request):
        return self._update(request, partial=False)

    def patch(self, request):
        return self._update(request, partial=True)

    def _update(self, request, partial: bool):
        serializer = UserProfileUpdateSerializer(
            request.user, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            'message': 'Profile updated successfully.',
            'user': UserSerializer(request.user).data,
        })


# ---------------------------------------------------------------------------
# Admin-only creation views
# ---------------------------------------------------------------------------

class CreateInstructorView(APIView):
    """
    POST /api/auth/create-instructor/

    Admin creates a new instructor + InstructorProfile atomically.
    """

    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request):
        serializer = InstructorCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                'message': 'Instructor created successfully.',
                'user': UserSerializer(user).data,
                'profile': InstructorProfileSerializer(user.instructor_profile).data,
            },
            status=status.HTTP_201_CREATED,
        )


class CreateStudentView(APIView):
    """
    POST /api/auth/create-student/

    Admin creates a new student + StudentProfile (with auto-generated student_id) atomically.
    """

    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request):
        serializer = StudentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                'message': 'Student created successfully.',
                'user': UserSerializer(user).data,
                'profile': StudentProfileSerializer(user.student_profile).data,
            },
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Student management ViewSet  →  /api/students/
# ---------------------------------------------------------------------------

class StudentViewSet(viewsets.ViewSet):
    """
    Handles student-centric endpoints.

    GET  /api/students/               — Admin: list all students
    GET  /api/students/{id}/          — Admin: retrieve a student
    GET  /api/students/me/            — Student: own profile
    GET  /api/students/my-enrollments/ — Student: own enrollments
    """

    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Admin-only: paginated list of all students."""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only administrators can list all students.', 'field_errors': {}},
                status=status.HTTP_403_FORBIDDEN,
            )

        qs = (
            User.objects.filter(role=User.Role.STUDENT)
            .select_related('student_profile')
            .order_by('email')
        )

        # Manual pagination
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 10
        page = paginator.paginate_queryset(qs, request)

        results = []
        for user in page:
            user_data = UserSerializer(user).data
            if hasattr(user, 'student_profile'):
                user_data['profile'] = StudentProfileSerializer(user.student_profile).data
            results.append(user_data)

        return paginator.get_paginated_response(results)

    def retrieve(self, request, pk=None):
        """Admin: retrieve a specific student."""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only administrators can retrieve student records.', 'field_errors': {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            user = User.objects.select_related('student_profile').get(pk=pk, role=User.Role.STUDENT)
        except User.DoesNotExist:
            return Response(
                {'error': 'Student not found.', 'field_errors': {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        data = UserSerializer(user).data
        if hasattr(user, 'student_profile'):
            data['profile'] = StudentProfileSerializer(user.student_profile).data
        return Response(data)

    def create(self, request):
        """Admin: create a new student."""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only administrators can create student records.', 'field_errors': {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = StudentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user_data = UserSerializer(user).data
        if hasattr(user, 'student_profile'):
            user_data['profile'] = StudentProfileSerializer(user.student_profile).data
        return Response(
            {
                'message': 'Student created successfully.',
                'student': user_data,
            },
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, pk=None, **kwargs):
        """Admin: update a student record."""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only administrators can update student records.', 'field_errors': {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        partial = kwargs.get('partial', False)
        try:
            student = User.objects.select_related('student_profile').get(pk=pk, role=User.Role.STUDENT)
        except User.DoesNotExist:
            return Response(
                {'error': 'Student not found.', 'field_errors': {}},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = StudentUpdateSerializer(
            student, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        updated.refresh_from_db()
        if hasattr(updated, 'student_profile'):
            updated.student_profile.refresh_from_db()

        user_data = UserSerializer(updated).data
        if hasattr(updated, 'student_profile'):
            user_data['profile'] = StudentProfileSerializer(updated.student_profile).data
        return Response(
            {
                'message': 'Student updated successfully.',
                'student': user_data,
            },
            status=status.HTTP_200_OK,
        )

    def partial_update(self, request, pk=None):
        return self.update(request, pk=pk, partial=True)

    def destroy(self, request, pk=None):
        """Admin: delete a student record."""
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only administrators can delete student records.', 'field_errors': {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            student = User.objects.get(pk=pk, role=User.Role.STUDENT)
        except User.DoesNotExist:
            return Response(
                {'error': 'Student not found.', 'field_errors': {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        student.delete()
        return Response(
            {'message': 'Student deleted successfully.'},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """Student: view own profile and student ID."""
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can access this endpoint.', 'field_errors': {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        user = request.user
        data = UserSerializer(user).data
        if hasattr(user, 'student_profile'):
            data['profile'] = StudentProfileSerializer(user.student_profile).data
        return Response(data)

    @action(detail=False, methods=['get'], url_path='my-enrollments')
    def my_enrollments(self, request):
        """Student: view own enrollments."""
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can access this endpoint.', 'field_errors': {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Import here to avoid circular imports at module level
        from enrollments.models import Enrollment
        from enrollments.serializers import EnrollmentSerializer

        qs = (
            Enrollment.objects
            .filter(student=request.user)
            .select_related('course', 'course__instructor')
            .order_by('-enrollment_date')
        )
        serializer = EnrollmentSerializer(qs, many=True)
        return Response({'count': qs.count(), 'results': serializer.data})
