"""Serializers for the enrollments app."""
from rest_framework import serializers

from .models import Enrollment


class EnrollmentSerializer(serializers.ModelSerializer):
    """Full enrollment serializer — for list/retrieve/create."""

    student_email = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    course_code = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'id',
            'student', 'student_email', 'student_name',
            'course', 'course_title', 'course_code',
            'enrollment_date', 'status', 'completion_percentage',
            'updated_at',
        ]
        read_only_fields = ['id', 'enrollment_date', 'updated_at']

    def get_student_email(self, obj: Enrollment) -> str:
        return obj.student.email

    def get_student_name(self, obj: Enrollment) -> str:
        return obj.student.full_name

    def get_course_title(self, obj: Enrollment) -> str:
        return obj.course.title

    def get_course_code(self, obj: Enrollment) -> str:
        return obj.course.code

    def validate_student(self, value):
        if value.role != 'student':
            raise serializers.ValidationError(
                "The student field must reference a user with role=student."
            )
        return value

    def validate(self, data: dict) -> dict:
        student = data.get('student')
        course = data.get('course')

        # Inactive course guard (constraint #22)
        if course and not course.is_active:
            raise serializers.ValidationError(
                {'course': 'Cannot enroll in an inactive course.'}
            )

        # Duplicate enrollment guard at serializer level (constraint #21)
        if student and course:
            qs = Enrollment.objects.filter(student=student, course=course)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {'non_field_errors': ['This student is already enrolled in this course.']}
                )

        return data


class EnrollmentUpdateSerializer(serializers.ModelSerializer):
    """
    Restricted serializer for updating status and completion.
    Students and instructors can only modify these two fields.
    """

    class Meta:
        model = Enrollment
        fields = ['status', 'completion_percentage']

    def validate_completion_percentage(self, value) -> int:
        if not 0 <= float(value) <= 100:
            raise serializers.ValidationError(
                "Completion percentage must be between 0 and 100."
            )
        return value

    def validate(self, data: dict) -> dict:
        # Determine effective status and completion after potential update
        status = data.get('status', self.instance.status if self.instance else None)
        completion = float(
            data.get('completion_percentage',
                      self.instance.completion_percentage if self.instance else 0)
        )

        if status == 'completed' and completion < 100:
            raise serializers.ValidationError(
                {
                    'completion_percentage':
                        'Completion percentage must be 100 when status is "completed".'
                }
            )
        return data
