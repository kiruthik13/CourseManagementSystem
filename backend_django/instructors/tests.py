"""
Unit tests for instructors app (Admin management, retrieve profile, list students).
"""
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User, InstructorProfile


class InstructorsTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password='Password123!',
            first_name='Admin',
            last_name='User',
            role=User.Role.ADMIN,
        )

        self.instructor = User.objects.create_user(
            email='instructor@example.com',
            password='Password123!',
            first_name='Jane',
            last_name='Prof',
            role=User.Role.INSTRUCTOR,
        )
        InstructorProfile.objects.create(
            user=self.instructor,
            department='Physics',
            qualification='PhD',
        )

        self.student = User.objects.create_user(
            email='student@example.com',
            password='Password123!',
            first_name='Student',
            last_name='User',
            role=User.Role.STUDENT,
        )

    def test_admin_can_list_and_manage_instructors(self):
        """Admin can list and view instructors."""
        self.client.force_authenticate(user=self.admin)
        res_list = self.client.get('/api/instructors/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(res_list.data['count'], 1)

    def test_non_admin_cannot_list_instructors(self):
        """Student or instructor cannot list all instructors via admin endpoints."""
        self.client.force_authenticate(user=self.student)
        res_stu = self.client.get('/api/instructors/')
        self.assertEqual(res_stu.status_code, status.HTTP_403_FORBIDDEN)
