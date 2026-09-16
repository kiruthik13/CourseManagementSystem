"""Django Admin for the enrollments app."""
from django.contrib import admin

from .models import Enrollment


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = [
        'student', 'course', 'status', 'completion_percentage', 'enrollment_date'
    ]
    list_filter = ['status', 'course__is_active']
    search_fields = [
        'student__email', 'student__first_name',
        'course__title', 'course__code',
    ]
    readonly_fields = ['enrollment_date', 'updated_at']
    autocomplete_fields = ['student', 'course']
    ordering = ['-enrollment_date']
    list_editable = ['status', 'completion_percentage']
