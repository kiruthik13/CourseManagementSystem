"""
Serializers for the accounts app.

Serializer hierarchy:
  UserSerializer              — read-only user representation (no password)
  RegisterSerializer          — public student self-registration
  LoginSerializer             — email + password → validated user object
  InstructorCreateSerializer  — admin creates instructor + profile atomically
  StudentCreateSerializer     — admin creates student + profile atomically
  InstructorProfileSerializer — read/update InstructorProfile
  StudentProfileSerializer    — read StudentProfile (student_id is read-only)
  UserProfileUpdateSerializer — authenticated user updates own basic fields
"""
from django.contrib.auth import authenticate
from django.db import transaction

from rest_framework import serializers

from .models import User, InstructorProfile, StudentProfile, StudentIDCounter


# ---------------------------------------------------------------------------
# Shared / read-only
# ---------------------------------------------------------------------------

class UserSerializer(serializers.ModelSerializer):
    """Read-only representation of a user. Never exposes password."""

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'is_active', 'date_joined', 'created_at',
        ]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

class RegisterSerializer(serializers.ModelSerializer):
    """
    Public self-registration for students and instructors.

    Accepts an optional 'role' field (student | instructor).
    Role 'admin' is blocked at the view level and will never reach here.
    The correct profile (StudentProfile or InstructorProfile) is created atomically.
    """

    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    role = serializers.ChoiceField(
        choices=['student', 'instructor', 'admin'],
        default='student',
        required=False,
    )

    class Meta:
        model = User
        fields = ['email', 'password', 'confirm_password', 'first_name', 'last_name', 'phone', 'role']

    def validate_email(self, value: str) -> str:
        normalised = value.lower()
        if User.objects.filter(email=normalised).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalised

    def validate(self, data: dict) -> dict:
        if data['password'] != data.pop('confirm_password'):
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return data

    @transaction.atomic
    def create(self, validated_data: dict) -> User:
        role = validated_data.pop('role', User.Role.STUDENT)
        is_admin = (role == User.Role.ADMIN)
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
            role=role,
            is_staff=is_admin,
            is_superuser=is_admin,
        )
        if role == User.Role.STUDENT:
            student_id = StudentIDCounter.generate_student_id()
            StudentProfile.objects.create(user=user, student_id=student_id)
        elif role == User.Role.INSTRUCTOR:
            InstructorProfile.objects.create(user=user)
        return user



class LoginSerializer(serializers.Serializer):
    """Validates email + password and returns the authenticated User."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data: dict) -> dict:
        email = data.get('email', '').lower()
        password = data.get('password')

        user = authenticate(
            request=self.context.get('request'),
            username=email,  # USERNAME_FIELD is email; Django authenticate uses 'username' kwarg
            password=password,
        )

        if not user:
            raise serializers.ValidationError(
                {"non_field_errors": ["Invalid email or password."]}
            )
        if not user.is_active:
            raise serializers.ValidationError(
                {"non_field_errors": ["This account has been deactivated."]}
            )

        data['user'] = user
        return data


# ---------------------------------------------------------------------------
# Admin-only creation serializers
# ---------------------------------------------------------------------------

class InstructorCreateSerializer(serializers.Serializer):
    """
    Admin creates a new instructor.

    Atomically creates User (role=instructor) + InstructorProfile.
    Transaction rolls back completely if profile creation fails.
    """

    # User fields
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')

    # InstructorProfile fields
    department = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')
    qualification = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')
    experience_years = serializers.IntegerField(min_value=0, required=False, default=0)
    bio = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_email(self, value: str) -> str:
        normalised = value.lower()
        if User.objects.filter(email=normalised).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalised

    @transaction.atomic
    def create(self, validated_data: dict) -> User:
        profile_data = {
            'department': validated_data.pop('department', ''),
            'qualification': validated_data.pop('qualification', ''),
            'experience_years': validated_data.pop('experience_years', 0),
            'bio': validated_data.pop('bio', ''),
        }
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=validated_data.get('phone', ''),
            role=User.Role.INSTRUCTOR,
        )
        # If this raises, the entire transaction rolls back (no orphan User)
        InstructorProfile.objects.create(user=user, **profile_data)
        return user


class StudentCreateSerializer(serializers.Serializer):
    """
    Admin creates a new student.

    Atomically creates User (role=student) + StudentProfile with auto-generated ID.
    """

    # User fields
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')

    # StudentProfile fields
    department = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')
    year_of_study = serializers.IntegerField(min_value=1, max_value=6, required=False, default=1)

    def validate_email(self, value: str) -> str:
        normalised = value.lower()
        if User.objects.filter(email=normalised).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalised

    @transaction.atomic
    def create(self, validated_data: dict) -> User:
        profile_data = {
            'department': validated_data.pop('department', ''),
            'year_of_study': validated_data.pop('year_of_study', 1),
        }
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=validated_data.get('phone', ''),
            role=User.Role.STUDENT,
        )
        student_id = StudentIDCounter.generate_student_id()
        StudentProfile.objects.create(user=user, student_id=student_id, **profile_data)
        return user


class StudentUpdateSerializer(serializers.Serializer):
    """
    Composite serializer for updating a User + StudentProfile in one request.
    Used by admin at PUT/PATCH /api/students/{id}/.
    """
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)

    department = serializers.CharField(max_length=200, required=False, allow_blank=True)
    year_of_study = serializers.IntegerField(min_value=1, max_value=6, required=False)

    def validate_email(self, value: str) -> str:
        normalised = value.lower()
        user = self.instance
        if user and User.objects.filter(email=normalised).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return normalised

    def update(self, instance: User, validated_data: dict) -> User:
        user_fields = ['first_name', 'last_name', 'email', 'phone', 'is_active']
        profile_fields = ['department', 'year_of_study']

        user_updates = {k: v for k, v in validated_data.items() if k in user_fields}
        if user_updates:
            for attr, value in user_updates.items():
                setattr(instance, attr, value)
            instance.save(update_fields=list(user_updates.keys()))

        profile_updates = {k: v for k, v in validated_data.items() if k in profile_fields}
        if profile_updates:
            StudentProfile.objects.filter(user=instance).update(**profile_updates)

        return instance


# ---------------------------------------------------------------------------
# Profile serializers
# ---------------------------------------------------------------------------

class InstructorProfileSerializer(serializers.ModelSerializer):
    """Full instructor profile read/update serializer."""

    user = UserSerializer(read_only=True)

    class Meta:
        model = InstructorProfile
        fields = [
            'id', 'user', 'department', 'qualification',
            'experience_years', 'bio', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class StudentProfileSerializer(serializers.ModelSerializer):
    """Full student profile serializer. student_id is always read-only."""

    user = UserSerializer(read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'user', 'student_id', 'department', 'year_of_study',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'student_id', 'created_at', 'updated_at']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Allows an authenticated user to update their own basic fields."""

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone']

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save(update_fields=list(validated_data.keys()))
        return instance
