"""
InstructorViewSet — admin-only instructor management.

GET    /api/instructors/               → list all instructors (admin)
POST   /api/instructors/               → create instructor (admin, same as auth/create-instructor)
GET    /api/instructors/{id}/          → retrieve instructor (admin or own)
PUT    /api/instructors/{id}/          → update instructor (admin)
PATCH  /api/instructors/{id}/          → partial update (admin)
DELETE /api/instructors/{id}/          → delete instructor (admin)
GET    /api/instructors/{id}/courses/  → instructor's courses (admin / own instructor)
GET    /api/instructors/{id}/students/ → students in instructor's courses (admin)
"""
import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.models import User, InstructorProfile
from accounts.permissions import IsAdminRole
from accounts.serializers import (
    InstructorCreateSerializer,
    UserSerializer,
    InstructorProfileSerializer,
    StudentProfileSerializer,
)
from courses.models import Course
from courses.serializers import CourseListSerializer
from .serializers import InstructorDetailSerializer, InstructorUpdateSerializer

logger = logging.getLogger(__name__)


class InstructorViewSet(viewsets.ViewSet):
    """
    Instructor management.
    All endpoints require authentication.
    Most require admin role; exceptions are noted per-action.
    """

    permission_classes = [IsAuthenticated, IsAdminRole]

    def _get_instructor_or_404(self, pk) -> tuple[User | None, Response | None]:
        """Return (instructor, None) or (None, error_response)."""
        try:
            return (
                User.objects
                .select_related('instructor_profile')
                .get(pk=pk, role=User.Role.INSTRUCTOR),
                None,
            )
        except User.DoesNotExist:
            return None, Response(
                {'error': 'Instructor not found.', 'field_errors': {}},
                status=status.HTTP_404_NOT_FOUND,
            )

    # ----------------------------------------------------------------
    # list
    # ----------------------------------------------------------------

    def list(self, request):
        qs = (
            User.objects
            .filter(role=User.Role.INSTRUCTOR)
            .select_related('instructor_profile')
            .order_by('email')
        )

        paginator = PageNumberPagination()
        paginator.page_size = 10
        page = paginator.paginate_queryset(qs, request)

        results = []
        for instructor in page:
            data = InstructorDetailSerializer(instructor).data
            results.append(data)

        return paginator.get_paginated_response(results)

    # ----------------------------------------------------------------
    # create (same atomicity as /api/auth/create-instructor/)
    # ----------------------------------------------------------------

    def create(self, request):
        serializer = InstructorCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                'message': 'Instructor created successfully.',
                'instructor': InstructorDetailSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )

    # ----------------------------------------------------------------
    # retrieve
    # ----------------------------------------------------------------

    def retrieve(self, request, pk=None):
        instructor, err = self._get_instructor_or_404(pk)
        if err:
            return err
        # Allow instructor to view own profile
        if request.user.role == 'instructor' and request.user.pk != instructor.pk:
            return Response(
                {'error': 'You can only view your own profile.', 'field_errors': {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(InstructorDetailSerializer(instructor).data)

    # ----------------------------------------------------------------
    # update / partial_update
    # ----------------------------------------------------------------

    def update(self, request, pk=None, **kwargs):
        partial = kwargs.get('partial', False)
        instructor, err = self._get_instructor_or_404(pk)
        if err:
            return err

        serializer = InstructorUpdateSerializer(
            instructor, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        updated.refresh_from_db()
        if hasattr(updated, 'instructor_profile'):
            updated.instructor_profile.refresh_from_db()
        return Response(InstructorDetailSerializer(updated).data)

    def partial_update(self, request, pk=None):
        return self.update(request, pk=pk, partial=True)

    # ----------------------------------------------------------------
    # destroy
    # ----------------------------------------------------------------

    def destroy(self, request, pk=None):
        instructor, err = self._get_instructor_or_404(pk)
        if err:
            return err
        instructor.delete()
        return Response(
            {'message': 'Instructor deleted successfully.'},
            status=status.HTTP_200_OK,
        )

    # ----------------------------------------------------------------
    # Custom actions
    # ----------------------------------------------------------------

    @action(detail=True, methods=['get'], url_path='courses')
    def instructor_courses(self, request, pk=None):
        """
        GET /api/instructors/{id}/courses/

        Admin or the instructor themselves.
        """
        # Allow instructor to view own courses
        if request.user.role == 'instructor':
            if str(request.user.pk) != str(pk):
                return Response(
                    {'error': 'You can only view your own courses.', 'field_errors': {}},
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            # Non-admin, non-instructor — blocked by class-level permission usually
            # This path is only reached if somehow a student reaches this
            if request.user.role not in ('admin', 'instructor'):
                return Response(
                    {'error': 'Permission denied.', 'field_errors': {}},
                    status=status.HTTP_403_FORBIDDEN,
                )

        instructor, err = self._get_instructor_or_404(pk)
        if err:
            return err

        courses = (
            Course.objects
            .filter(instructor=instructor)
            .select_related('instructor')
            .prefetch_related('enrollments')
        )
        serializer = CourseListSerializer(courses, many=True)
        return Response({'count': courses.count(), 'results': serializer.data})

    @action(detail=True, methods=['get'], url_path='students')
    def instructor_students(self, request, pk=None):
        """
        GET /api/instructors/{id}/students/

        Admin only: list all distinct students enrolled in this instructor's courses.
        """
        instructor, err = self._get_instructor_or_404(pk)
        if err:
            return err

        from enrollments.models import Enrollment

        enrollments = (
            Enrollment.objects
            .filter(course__instructor=instructor)
            .select_related('student', 'student__student_profile')
            .order_by('student__email')
        )

        # Deduplicate students
        seen: set[int] = set()
        students = []
        for enrollment in enrollments:
            if enrollment.student_id not in seen:
                seen.add(enrollment.student_id)
                student_data = UserSerializer(enrollment.student).data
                if hasattr(enrollment.student, 'student_profile'):
                    student_data['profile'] = StudentProfileSerializer(
                        enrollment.student.student_profile
                    ).data
                students.append(student_data)

        return Response({'count': len(students), 'results': students})
