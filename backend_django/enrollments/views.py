"""
EnrollmentViewSet — CRUD + my-enrollments action.

Permission matrix:
  Admin      → full CRUD on all enrollments
  Instructor → read enrollments for own courses only; can update status
  Student    → read/update own enrollments only; cannot delete others'
"""
import logging

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAdminRole
from .models import Enrollment
from .serializers import EnrollmentSerializer, EnrollmentUpdateSerializer

logger = logging.getLogger(__name__)


class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    /api/enrollments/

    Queryset is scoped per role BEFORE serialisation (constraint #15):
      Admin       → all enrollments
      Instructor  → enrollments in courses assigned to them only
      Student     → own enrollments only
    """

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'course', 'student']
    ordering_fields = ['enrollment_date', 'status', 'completion_percentage']
    ordering = ['-enrollment_date']

    # ----------------------------------------------------------------
    # Queryset scope
    # ----------------------------------------------------------------

    def get_queryset(self):
        user = self.request.user
        base_qs = (
            Enrollment.objects
            .select_related('student', 'course', 'course__instructor')
        )

        if user.role == 'admin':
            return base_qs.all()
        elif user.role == 'instructor':
            # Instructors only see enrollments in their own courses (constraint #18)
            return base_qs.filter(course__instructor=user)
        elif user.role == 'student':
            # Students only see their own enrollments (constraint #19)
            return base_qs.filter(student=user)
        return Enrollment.objects.none()

    # ----------------------------------------------------------------
    # Serializer selection
    # ----------------------------------------------------------------

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return EnrollmentUpdateSerializer
        return EnrollmentSerializer

    # ----------------------------------------------------------------
    # Per-action permissions
    # ----------------------------------------------------------------

    def get_permissions(self):
        if self.action == 'destroy':
            # Only admin and students (own) can delete — checked in destroy()
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    # ----------------------------------------------------------------
    # Create — students only, auto-assign student=request.user
    # ----------------------------------------------------------------

    def create(self, request, *args, **kwargs):
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can create enrollments.', 'field_errors': {}},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Force student to be the authenticated user; ignore client-submitted student
        data = request.data.copy()
        data['student'] = request.user.pk

        serializer = EnrollmentSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        enrollment = serializer.save()
        return Response(
            EnrollmentSerializer(enrollment).data,
            status=status.HTTP_201_CREATED,
        )

    # ----------------------------------------------------------------
    # Update — object-level check
    # ----------------------------------------------------------------

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        user = request.user

        # Object-level permission (constraint #16)
        if user.role == 'student' and instance.student_id != user.pk:
            return Response(
                {'error': 'You can only update your own enrollments.', 'field_errors': {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        if user.role == 'instructor' and instance.course.instructor_id != user.pk:
            return Response(
                {
                    'error': 'You can only update enrollments in courses assigned to you.',
                    'field_errors': {},
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = EnrollmentUpdateSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(EnrollmentSerializer(instance).data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    # ----------------------------------------------------------------
    # Destroy — admins or own-student only
    # ----------------------------------------------------------------

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user

        if user.role == 'instructor':
            return Response(
                {'error': 'Instructors cannot delete enrollments.', 'field_errors': {}},
                status=status.HTTP_403_FORBIDDEN,
            )
        if user.role == 'student' and instance.student_id != user.pk:
            return Response(
                {'error': 'You can only delete your own enrollments.', 'field_errors': {}},
                status=status.HTTP_403_FORBIDDEN,
            )

        instance.delete()
        return Response(
            {'message': 'Enrollment deleted successfully.'},
            status=status.HTTP_200_OK,
        )

    # ----------------------------------------------------------------
    # Custom action: my-enrollments (student shortcut)
    # ----------------------------------------------------------------

    @action(detail=False, methods=['get'], url_path='my-enrollments')
    def my_enrollments(self, request):
        """
        GET /api/enrollments/my-enrollments/

        Student: returns own enrollments with full course details.
        """
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can access this endpoint.', 'field_errors': {}},
                status=status.HTTP_403_FORBIDDEN,
            )

        qs = (
            Enrollment.objects
            .filter(student=request.user)
            .select_related('course', 'course__instructor')
            .order_by('-enrollment_date')
        )
        serializer = EnrollmentSerializer(qs, many=True)
        return Response({'count': qs.count(), 'results': serializer.data})
