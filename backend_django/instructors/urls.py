"""URL configuration for the instructors app."""
from django.urls import path, include
from rest_framework.routers import SimpleRouter

from .views import InstructorViewSet

router = SimpleRouter()
router.register(r'', InstructorViewSet, basename='instructor')

# Resulting routes:
#   GET    /api/instructors/               → list
#   POST   /api/instructors/               → create
#   GET    /api/instructors/{id}/          → retrieve
#   PUT    /api/instructors/{id}/          → update
#   PATCH  /api/instructors/{id}/          → partial_update
#   DELETE /api/instructors/{id}/          → destroy
#   GET    /api/instructors/{id}/courses/  → instructor_courses
#   GET    /api/instructors/{id}/students/ → instructor_students

urlpatterns = [
    path('', include(router.urls)),
]
