"""
Root URL configuration for the Course Management System.

API layout:
  /api/auth/          → accounts.urls (register, login, logout, me, profile, create-*)
  /api/courses/       → courses.urls  (CourseViewSet)
  /api/enrollments/   → enrollments.urls (EnrollmentViewSet)
  /api/instructors/   → instructors.urls (InstructorViewSet)
  /api/students/      → StudentViewSet (in accounts)
  /api/health/        → health check
  /api/schema/        → OpenAPI schema (drf-spectacular)
  /api/docs/          → Swagger UI
  /api/redoc/         → ReDoc
  /admin/             → Django admin
"""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

from accounts.views import StudentViewSet

# ----------------------------------------------------------------
# Router for ViewSets registered at /api/
# ----------------------------------------------------------------
router = DefaultRouter()
router.register(r'courses', __import__('courses.views', fromlist=['CourseViewSet']).CourseViewSet, basename='course')
router.register(r'enrollments', __import__('enrollments.views', fromlist=['EnrollmentViewSet']).EnrollmentViewSet, basename='enrollment')
router.register(r'students', StudentViewSet, basename='student')


# ----------------------------------------------------------------
# Health check view
# ----------------------------------------------------------------
def health_check(request):
    """GET /api/health/ — simple liveness check."""
    return JsonResponse({
        'status': 'ok',
        'service': 'Course Management System API',
        'version': '1.0.0',
    })


# ----------------------------------------------------------------
# URL patterns
# ----------------------------------------------------------------
urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),

    # Auth endpoints
    path('api/auth/', include('accounts.urls')),

    # Instructor management (separate app, not in router to keep admin-only)
    path('api/instructors/', include('instructors.urls')),

    # All router-registered ViewSets
    path('api/', include(router.urls)),

    # Health check
    path('api/health/', health_check, name='health-check'),

    # OpenAPI / Swagger / ReDoc
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
