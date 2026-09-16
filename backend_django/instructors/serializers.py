"""Serializers for the instructors app."""
from rest_framework import serializers

from accounts.models import User, InstructorProfile
from accounts.serializers import UserSerializer, InstructorProfileSerializer


class InstructorDetailSerializer(serializers.ModelSerializer):
    """Full instructor detail including profile."""

    profile = InstructorProfileSerializer(source='instructor_profile', read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'is_active', 'date_joined', 'profile',
        ]
        read_only_fields = ['id', 'email', 'role', 'date_joined']


class InstructorUpdateSerializer(serializers.Serializer):
    """
    Composite serializer for updating a User + InstructorProfile in one request.
    Used by admin at PUT/PATCH /api/instructors/{id}/.
    """

    # User fields
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)

    # InstructorProfile fields
    department = serializers.CharField(max_length=200, required=False, allow_blank=True)
    qualification = serializers.CharField(max_length=200, required=False, allow_blank=True)
    experience_years = serializers.IntegerField(min_value=0, required=False)
    bio = serializers.CharField(required=False, allow_blank=True)

    def update(self, instance: User, validated_data: dict) -> User:
        user_fields = ['first_name', 'last_name', 'phone']
        profile_fields = ['department', 'qualification', 'experience_years', 'bio']

        # Update User
        user_updates = {k: v for k, v in validated_data.items() if k in user_fields}
        if user_updates:
            for attr, value in user_updates.items():
                setattr(instance, attr, value)
            instance.save(update_fields=list(user_updates.keys()))

        # Update InstructorProfile
        profile_updates = {k: v for k, v in validated_data.items() if k in profile_fields}
        if profile_updates:
            InstructorProfile.objects.filter(user=instance).update(**profile_updates)

        return instance
