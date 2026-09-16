"""
Enrollment model.

Constraints enforced:
  - UniqueConstraint(student, course) at both DB and serializer level
  - student must have role=student
  - inactive courses cannot receive new enrollments
  - completion_percentage between 0 and 100
"""
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class Enrollment(models.Model):
    """Records a student's enrollment in a course."""

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        COMPLETED = 'completed', 'Completed'
        DROPPED = 'dropped', 'Dropped'

    student = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='enrollments',
        limit_choices_to={'role': 'student'},
        verbose_name='Student',
    )
    course = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='enrollments',
        verbose_name='Course',
    )
    enrollment_date = models.DateTimeField(auto_now_add=True, verbose_name='Enrollment date')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
        verbose_name='Status',
    )
    completion_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='Completion (%)',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'enrollments'
        ordering = ['-enrollment_date']
        verbose_name = 'Enrollment'
        verbose_name_plural = 'Enrollments'
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'course'],
                name='unique_student_course_enrollment',
            )
        ]
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['course', 'status']),
        ]

    def __str__(self):
        return f"{self.student.email} → {self.course.code} [{self.status}]"
