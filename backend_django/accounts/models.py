"""
Custom User model and profile models.

Design decisions:
  - AbstractUser base (retains Django admin, sessions, permissions).
  - username field removed; email is the unique identifier.
  - Role choices are fixed: admin | instructor | student.
  - InstructorProfile and StudentProfile hang off User via OneToOneField.
  - StudentIDCounter provides collision-safe, year-scoped student IDs.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models, transaction
from django.utils import timezone

from .managers import CustomUserManager


# ---------------------------------------------------------------------------
# Custom User Model
# ---------------------------------------------------------------------------

class User(AbstractUser):
    """
    Custom User model.

    - Removes the default username field.
    - Uses email as the login identifier (USERNAME_FIELD).
    - Adds a role field that gates access throughout the API.
    - Passwords are always stored via set_password() — never plain text.
    """

    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        INSTRUCTOR = 'instructor', 'Instructor'
        STUDENT = 'student', 'Student'

    # Remove username — use email instead
    username = None  # type: ignore[assignment]

    email = models.EmailField(
        unique=True,
        db_index=True,
        verbose_name='Email address',
    )
    first_name = models.CharField(max_length=150, blank=False, verbose_name='First name')
    last_name = models.CharField(max_length=150, blank=False, verbose_name='Last name')
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
        db_index=True,
        verbose_name='Role',
    )
    phone = models.CharField(max_length=30, blank=True, verbose_name='Phone number')

    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created at')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = CustomUserManager()  # type: ignore[assignment]

    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def save(self, *args, **kwargs):
        # Always normalise email to lowercase before saving
        if self.email:
            self.email = self.email.lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_admin(self) -> bool:
        return self.role == self.Role.ADMIN

    @property
    def is_instructor(self) -> bool:
        return self.role == self.Role.INSTRUCTOR

    @property
    def is_student(self) -> bool:
        return self.role == self.Role.STUDENT


# ---------------------------------------------------------------------------
# Student ID Counter — collision-safe, year-scoped sequence
# ---------------------------------------------------------------------------

class StudentIDCounter(models.Model):
    """
    Thread-safe counter used to generate student IDs of the form STU{year}{seq:04d}.

    Strategy:
      1. Each calendar year gets exactly one counter row.
      2. Incrementing uses a SQL-level atomic UPDATE (F expression) so that
         two concurrent transactions never receive the same number.
      3. get_or_create handles the very-first creation safely (Django retries
         on IntegrityError caused by the unique constraint on year).
      4. This method MUST be called inside a transaction.atomic() block so that
         if user/profile creation fails afterwards the counter increment rolls back.

    Example output: STU2026001, STU2026002, …
    """

    year = models.IntegerField(unique=True, verbose_name='Year')
    last_sequence = models.IntegerField(default=0, verbose_name='Last sequence number')

    class Meta:
        db_table = 'student_id_counters'
        verbose_name = 'Student ID Counter'

    def __str__(self):
        return f"Counter({self.year}: {self.last_sequence})"

    @classmethod
    def generate_student_id(cls) -> str:
        """
        Generate the next student ID atomically.

        Must be called within a transaction.atomic() block.
        Uses an atomic SQL UPDATE with an F expression to prevent race conditions.
        """
        year = timezone.now().year

        # Ensure the counter row exists (safe even with concurrent callers)
        counter, _ = cls.objects.get_or_create(
            year=year,
            defaults={'last_sequence': 0},
        )

        # Atomic increment at the database level — never relies on Python count
        cls.objects.filter(pk=counter.pk).update(
            last_sequence=models.F('last_sequence') + 1
        )

        # Read the committed value back
        counter.refresh_from_db(fields=['last_sequence'])
        return f"STU{year}{counter.last_sequence:04d}"


# ---------------------------------------------------------------------------
# InstructorProfile
# ---------------------------------------------------------------------------

class InstructorProfile(models.Model):
    """Extended profile for users with role=instructor."""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='instructor_profile',
        verbose_name='User',
    )
    department = models.CharField(max_length=200, blank=True, verbose_name='Department')
    qualification = models.CharField(max_length=200, blank=True, verbose_name='Qualification')
    experience_years = models.PositiveIntegerField(default=0, verbose_name='Years of experience')
    bio = models.TextField(blank=True, verbose_name='Bio')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'instructor_profiles'
        verbose_name = 'Instructor Profile'
        verbose_name_plural = 'Instructor Profiles'

    def __str__(self):
        return f"InstructorProfile({self.user.email})"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.user_id and self.user.role != User.Role.INSTRUCTOR:
            raise ValidationError(
                "Only users with role=instructor can have an InstructorProfile."
            )


# ---------------------------------------------------------------------------
# StudentProfile
# ---------------------------------------------------------------------------

class StudentProfile(models.Model):
    """Extended profile for users with role=student."""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='student_profile',
        verbose_name='User',
    )
    student_id = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        verbose_name='Student ID',
        help_text='Auto-generated. Format: STU{year}{sequence:04d}',
    )
    department = models.CharField(max_length=200, blank=True, verbose_name='Department')
    year_of_study = models.PositiveSmallIntegerField(
        default=1,
        verbose_name='Year of study',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_profiles'
        verbose_name = 'Student Profile'
        verbose_name_plural = 'Student Profiles'

    def __str__(self):
        return f"StudentProfile({self.student_id} — {self.user.email})"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.user_id and self.user.role != User.Role.STUDENT:
            raise ValidationError(
                "Only users with role=student can have a StudentProfile."
            )
