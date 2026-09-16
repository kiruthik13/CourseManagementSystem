"""
Course model.

Rules enforced at the model layer:
  - credits between 1 and 6
  - duration_weeks >= 1
  - instructor FK limited to role=instructor users
  - inactive courses cannot accept new enrollments (enforced in enrollment serializer)
"""
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class Course(models.Model):
    """A course offering managed by an optional instructor."""

    title = models.CharField(max_length=300, verbose_name='Title')
    code = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Course code',
    )
    description = models.TextField(blank=True, verbose_name='Description')
    credits = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(6)],
        verbose_name='Credits',
        help_text='Must be between 1 and 6.',
    )
    duration_weeks = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Duration (weeks)',
    )
    instructor = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_courses',
        limit_choices_to={'role': 'instructor'},
        verbose_name='Instructor',
    )
    is_active = models.BooleanField(default=True, db_index=True, verbose_name='Is active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses'
        ordering = ['-created_at']
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'
        indexes = [
            models.Index(fields=['is_active', 'instructor']),
            models.Index(fields=['code']),
        ]

    def __str__(self):
        return f"{self.code} — {self.title}"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.instructor and self.instructor.role != 'instructor':
            raise ValidationError(
                {'instructor': 'The assigned user must have role=instructor.'}
            )
