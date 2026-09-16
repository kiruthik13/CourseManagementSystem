"""Django Admin configuration for the courses app."""
from django.contrib import admin

from .models import Course


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['code', 'title', 'credits', 'duration_weeks', 'instructor', 'is_active', 'created_at']
    list_filter = ['is_active', 'credits']
    search_fields = ['title', 'code', 'description', 'instructor__email']
    readonly_fields = ['created_at', 'updated_at']
    autocomplete_fields = ['instructor']
    ordering = ['-created_at']
    list_editable = ['is_active']
