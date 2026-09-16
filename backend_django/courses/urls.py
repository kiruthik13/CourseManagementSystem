"""URL configuration for the courses app."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CourseViewSet

router = DefaultRouter()
router.register(r'', CourseViewSet, basename='course')

# Note: custom actions registered with @action are auto-discovered by the router.
# Resulting URLs:
#   GET    /api/courses/                     → list
#   POST   /api/courses/                     → create (admin)
#   GET    /api/courses/{id}/               → retrieve
#   PUT    /api/courses/{id}/               → update (admin/instructor)
#   PATCH  /api/courses/{id}/               → partial_update
#   DELETE /api/courses/{id}/               → destroy (admin)
#   GET    /api/courses/my-courses/          → my_courses (instructor)
#   GET    /api/courses/{id}/enrollments/   → course_enrollments
#   POST   /api/courses/{id}/enroll/        → enroll (student)

urlpatterns = [
    path('', include(router.urls)),
]
