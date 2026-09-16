"""Serializers for the courses app."""
from rest_framework import serializers

from accounts.models import User
from .models import Course


class CourseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""

    instructor_name = serializers.SerializerMethodField()
    active_enrollment_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'code', 'credits', 'duration_weeks',
            'instructor', 'instructor_name', 'is_active', 'active_enrollment_count',
        ]

    def get_instructor_name(self, obj: Course) -> str | None:
        if obj.instructor:
            return obj.instructor.full_name
        return None

    def get_active_enrollment_count(self, obj: Course) -> int:
        # Uses prefetch_related cache when available
        return sum(1 for e in obj.enrollments.all() if e.status == 'active')


class CourseSerializer(serializers.ModelSerializer):
    """Full course serializer for create/retrieve/update."""

    instructor_name = serializers.SerializerMethodField()
    active_enrollment_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'code', 'description', 'credits',
            'duration_weeks', 'instructor', 'instructor_name',
            'is_active', 'active_enrollment_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_instructor_name(self, obj: Course) -> str | None:
        if obj.instructor:
            return obj.instructor.full_name
        return None

    def get_active_enrollment_count(self, obj: Course) -> int:
        return sum(1 for e in obj.enrollments.all() if e.status == 'active')

    def validate_instructor(self, value: User | None) -> User | None:
        if value is not None and value.role != 'instructor':
            raise serializers.ValidationError(
                "The assigned user must have role=instructor."
            )
        return value

    def validate_credits(self, value: int) -> int:
        if not 1 <= value <= 6:
            raise serializers.ValidationError("Credits must be between 1 and 6.")
        return value

    def validate_duration_weeks(self, value: int) -> int:
        if value < 1:
            raise serializers.ValidationError("Duration must be at least 1 week.")
        return value

    def validate_code(self, value: str) -> str:
        """Ensure course code is unique (excluding the current instance on update)."""
        qs = Course.objects.filter(code=value.upper())
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                f"A course with code '{value}' already exists."
            )
        return value.upper()

    def validate(self, data: dict) -> dict:
        return data
