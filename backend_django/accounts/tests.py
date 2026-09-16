"""
Unit tests for accounts app (Authentication, User/Profile Models, Student ID Generation, Role Restrictions).
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User, StudentProfile, InstructorProfile, StudentIDCounter


class AccountsTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        # Admin user
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password='Password123!',
            first_name='Admin',
            last_name='User',
            role=User.Role.ADMIN,
        )

        # Instructor user
        self.instructor = User.objects.create_user(
            email='instructor@example.com',
            password='Password123!',
            first_name='John',
            last_name='Doe',
            role=User.Role.INSTRUCTOR,
        )
        InstructorProfile.objects.create(user=self.instructor, department='Computer Science')

        # Student user
        self.student = User.objects.create_user(
            email='student@example.com',
            password='Password123!',
            first_name='Jane',
            last_name='Smith',
            role=User.Role.STUDENT,
        )
        student_id = StudentIDCounter.generate_student_id()
        StudentProfile.objects.create(user=self.student, student_id=student_id)

    def test_student_registration_and_role_escalation_blocked(self):
        """Public registration should create a student and ignore role escalation attempts."""
        url = reverse('accounts:register')
        payload = {
            'email': 'NEWSTUDENT@EXAMPLE.COM',
            'password': 'Password123!',
            'confirm_password': 'Password123!',
            'first_name': 'New',
            'last_name': 'Student',
            'role': 'admin',  # Attempt privilege escalation
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)

        # Verify role is student, email normalized to lowercase
        user = User.objects.get(email='newstudent@example.com')
        self.assertEqual(user.role, User.Role.STUDENT)
        self.assertNotEqual(user.role, User.Role.ADMIN)
        self.assertTrue(StudentProfile.objects.filter(user=user).exists())

    def test_duplicate_email_registration_rejected(self):
        """Registration with existing email should fail with validation error."""
        url = reverse('accounts:register')
        payload = {
            'email': 'student@example.com',
            'password': 'Password123!',
            'confirm_password': 'Password123!',
            'first_name': 'Duplicate',
            'last_name': 'User',
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('field_errors', response.data)
        self.assertIn('email', response.data['field_errors'])

    def test_valid_and_invalid_login(self):
        """Test authentication with correct and incorrect credentials."""
        url = reverse('accounts:login')

        # Invalid login
        bad_response = self.client.post(url, {'email': 'student@example.com', 'password': 'WrongPassword'}, format='json')
        self.assertEqual(bad_response.status_code, status.HTTP_400_BAD_REQUEST)

        # Valid login
        good_response = self.client.post(url, {'email': 'student@example.com', 'password': 'Password123!'}, format='json')
        self.assertEqual(good_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', good_response.data)
        self.assertIn('refresh', good_response.data)

    def test_refresh_token_and_logout_blacklist(self):
        """Test token refresh, logout token blacklisting, and rejection of blacklisted token reuse."""
        login_url = reverse('accounts:login')
        login_resp = self.client.post(login_url, {'email': 'student@example.com', 'password': 'Password123!'}, format='json')
        refresh_token = login_resp.data['refresh']
        access_token = login_resp.data['access']

        # Refresh token endpoint works (returns a new rotated refresh token)
        refresh_url = reverse('accounts:token-refresh')
        ref_resp = self.client.post(refresh_url, {'refresh': refresh_token}, format='json')
        self.assertEqual(ref_resp.status_code, status.HTTP_200_OK)
        new_access = ref_resp.data['access']
        new_refresh = ref_resp.data['refresh']

        # Logout with active rotated refresh token
        logout_url = reverse('accounts:logout')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_access}')
        logout_resp = self.client.post(logout_url, {'refresh': new_refresh}, format='json')
        self.assertEqual(logout_resp.status_code, status.HTTP_200_OK)

        # Reuse of blacklisted refresh token must be rejected
        reuse_resp = self.client.post(refresh_url, {'refresh': new_refresh}, format='json')
        self.assertEqual(reuse_resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_creates_instructor_atomically(self):
        """Admin can create instructor + profile atomically via API."""
        url = reverse('accounts:create-instructor')
        self.client.force_authenticate(user=self.admin)
        payload = {
            'email': 'prof.smith@example.com',
            'password': 'Password123!',
            'first_name': 'Prof',
            'last_name': 'Smith',
            'department': 'Physics',
            'qualification': 'PhD',
            'experience_years': 10,
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='prof.smith@example.com')
        self.assertEqual(user.role, User.Role.INSTRUCTOR)
        self.assertEqual(user.instructor_profile.department, 'Physics')

    def test_student_id_uniqueness(self):
        """Student IDs must follow STU{year}{seq:04d} and be unique."""
        id1 = StudentIDCounter.generate_student_id()
        id2 = StudentIDCounter.generate_student_id()
        self.assertNotEqual(id1, id2)
        self.assertTrue(id1.startswith('STU'))
        self.assertTrue(id2.startswith('STU'))
