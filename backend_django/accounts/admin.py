"""Django Admin configuration for accounts app."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, InstructorProfile, StudentProfile, StudentIDCounter


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for email-based User model."""

    ordering = ['-date_joined']
    list_display = ['email', 'first_name', 'last_name', 'role', 'is_active', 'is_staff', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    readonly_fields = ['date_joined', 'last_login', 'created_at']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal Info'), {'fields': ('first_name', 'last_name', 'phone', 'role')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Dates'), {'fields': ('last_login', 'date_joined', 'created_at')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )

    # Override because username field is removed
    filter_horizontal = ('groups', 'user_permissions')


@admin.register(InstructorProfile)
class InstructorProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'department', 'qualification', 'experience_years', 'created_at']
    list_filter = ['department']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'department']
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['user']
    ordering = ['user__email']


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ['student_id', 'user', 'department', 'year_of_study', 'created_at']
    list_filter = ['year_of_study', 'department']
    search_fields = ['student_id', 'user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['student_id', 'created_at', 'updated_at']
    autocomplete_fields = ['user']
    ordering = ['student_id']


@admin.register(StudentIDCounter)
class StudentIDCounterAdmin(admin.ModelAdmin):
    list_display = ['year', 'last_sequence']
    readonly_fields = ['year', 'last_sequence']
    ordering = ['-year']
