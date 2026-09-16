"""
CourseViewSet — full CRUD + custom actions.

Permission matrix:
  Admin      → full CRUD, view all enrollments
  Instructor → list/retrieve own courses, update ONLY own courses
  Student    → list/retrieve active courses, enroll, no write access
"""
import logging

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAdminRole, IsInstructorOrAdmin
from .models import Course
from .serializers import CourseListSerializer, CourseSerializer

logger = logging.getLogger(__name__)


class CourseViewSet(viewsets.ModelViewSet):
    """
    /api/courses/

    Queryset is scoped per role BEFORE any serialisation:
      - Admin    → all courses
      - Instructor → only courses assigned to request.user
      - Student  → only active courses
    """

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'instructor']
    search_fields = ['title', 'code', 'description']
    ordering_fields = ['title', 'created_at', 'credits', 'duration_weeks']
    ordering = ['-created_at']

    # ----------------------------------------------------------------
    # Queryset — enforced BEFORE object-level checks (constraint #15)
    # ----------------------------------------------------------------

    def get_queryset(self):
        user = self.request.user
        base_qs = (
            Course.objects
            .select_related('instructor')
            .prefetch_related('enrollments')
        )

        if user.role == 'admin':
            return base_qs.all()
        elif user.role == 'instructor':
            # Instructors only see their assigned courses
            return base_qs.filter(instructor=user)
        elif user.role == 'student':
            # Students only see active courses
            return base_qs.filter(is_active=True)
        return Course.objects.none()

    # ----------------------------------------------------------------
    # Serializers
    # ----------------------------------------------------------------

    def get_serializer_class(self):
        if self.action == 'list':
            return CourseListSerializer
        return CourseSerializer

    # ----------------------------------------------------------------
    # Per-action permissions
    # ----------------------------------------------------------------

    def get_permissions(self):
        if self.action == 'create':
            return [IsAdminRole()]
        if self.action == 'destroy':
            return [IsAdminRole()]
        if self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), IsInstructorOrAdmin()]
        return [IsAuthenticated()]

    # ----------------------------------------------------------------
    # Object-level permission (constraint #16)
    # ----------------------------------------------------------------

    def _check_object_write_permission(self, request, obj: Course):
        """
        Instructors may only modify courses they own.
        Admins have unrestricted access.
        Returns None if allowed, Response if forbidden.
        """
        if request.user.role == 'admin':
            return None
        if request.user.role == 'instructor':
            if obj.instructor_id != request.user.pk:
                return Response(
                    {
                        'error': 'You can only modify courses assigned to you.',
                        'field_errors': {},
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        return None

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        denial = self._check_object_write_permission(request, instance)
        if denial:
            return denial

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(
            {'message': f"Course '{instance.code}' deleted successfully."},
            status=status.HTTP_200_OK,
        )

    # ----------------------------------------------------------------
    # Custom actions
    # ----------------------------------------------------------------

    @action(detail=False, methods=['get'], url_path='my-courses')
    def my_courses(self, request):
        """
        GET /api/courses/my-courses/

        Instructor: returns their own assigned courses.
        """
        if request.user.role != 'instructor':
            return Response(
                {'error': 'Only instructors can access this endpoint.', 'field_errors': {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        courses = (
            Course.objects
            .filter(instructor=request.user)
            .select_related('instructor')
            .prefetch_related('enrollments')
        )
        serializer = CourseListSerializer(courses, many=True)
        return Response({'count': courses.count(), 'results': serializer.data})

    @action(detail=True, methods=['get'], url_path='enrollments')
    def course_enrollments(self, request, pk=None):
        """
        GET /api/courses/{id}/enrollments/

        Admin: all enrollments.
        Instructor: only for own courses.
        Student: forbidden.
        """
        course = self.get_object()
        user = request.user

        if user.role == 'student':
            return Response(
                {'error': 'Students cannot view course enrollments.', 'field_errors': {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        if user.role == 'instructor' and course.instructor_id != user.pk:
            return Response(
                {
                    'error': 'You can only view enrollments for courses assigned to you.',
                    'field_errors': {},
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Lazy import to avoid circular imports at module level
        from enrollments.models import Enrollment
        from enrollments.serializers import EnrollmentSerializer

        enrollments = (
            Enrollment.objects
            .filter(course=course)
            .select_related('student', 'course')
            .order_by('-enrollment_date')
        )
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response({'count': enrollments.count(), 'results': serializer.data})

    @action(detail=True, methods=['post'], url_path='enroll')
    def enroll(self, request, pk=None):
        """
        POST /api/courses/{id}/enroll/

        Student self-enrollment.
        """
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can enroll in courses.', 'field_errors': {}},
                status=status.HTTP_403_FORBIDDEN,
            )

        course = self.get_object()

        if not course.is_active:
            return Response(
                {'error': 'Cannot enroll in an inactive course.', 'field_errors': {}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from enrollments.models import Enrollment

        if Enrollment.objects.filter(student=request.user, course=course).exists():
            return Response(
                {
                    'error': 'You are already enrolled in this course.',
                    'field_errors': {'course': ['Duplicate enrollment.']},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        enrollment = Enrollment.objects.create(
            student=request.user,
            course=course,
            status=Enrollment.Status.ACTIVE,
        )

        from enrollments.serializers import EnrollmentSerializer
        serializer = EnrollmentSerializer(enrollment)
        return Response(
            {'message': 'Successfully enrolled.', 'enrollment': serializer.data},
            status=status.HTTP_201_CREATED,
        )
