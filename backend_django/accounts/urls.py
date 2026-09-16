"""URL configuration for the accounts app (mounted at /api/auth/)."""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    ProfileUpdateView,
    CreateInstructorView,
    CreateStudentView,
)

app_name = 'accounts'

urlpatterns = [
    # Public auth
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # Authenticated user
    path('me/', MeView.as_view(), name='me'),
    path('profile/', ProfileUpdateView.as_view(), name='profile-update'),

    # Admin-only creation
    path('create-instructor/', CreateInstructorView.as_view(), name='create-instructor'),
    path('create-student/', CreateStudentView.as_view(), name='create-student'),
]
