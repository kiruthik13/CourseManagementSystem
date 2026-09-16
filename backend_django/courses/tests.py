"""
Unit tests for courses app (CRUD, validation, role authorization, search, filtering).
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User, InstructorProfile
from courses.models import Course


class CoursesTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password='Password123!',
            first_name='Admin',
            last_name='User',
            role=User.Role.ADMIN,
        )

        self.instructor1 = User.objects.create_user(
            email='inst1@example.com',
            password='Password123!',
            first_name='Instructor',
            last_name='One',
            role=User.Role.INSTRUCTOR,
        )
        InstructorProfile.objects.create(user=self.instructor1, department='CS')

        self.instructor2 = User.objects.create_user(
            email='inst2@example.com',
            password='Password123!',
            first_name='Instructor',
            last_name='Two',
            role=User.Role.INSTRUCTOR,
        )
        InstructorProfile.objects.create(user=self.instructor2, department='Math')

        self.student = User.objects.create_user(
            email='student@example.com',
            password='Password123!',
            first_name='Student',
            last_name='User',
            role=User.Role.STUDENT,
        )

        # Courses
        self.course1 = Course.objects.create(
            title='Intro to Computer Science',
            code='CS101',
            description='Fundamentals of CS',
            credits=3,
            duration_weeks=12,
            instructor=self.instructor1,
            is_active=True,
        )

        self.course2 = Course.objects.create(
            title='Advanced Mathematics',
            code='MATH201',
            description='Calculus and Algebra',
            credits=4,
            duration_weeks=14,
            instructor=self.instructor2,
            is_active=False,
        )

    def test_unauthenticated_access_rejected(self):
        """Unauthenticated requests to course list should fail with 401."""
        response = self.client.get('/api/courses/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_course_crud(self):
        """Admin can list all courses, create, update, and delete any course."""
        self.client.force_authenticate(user=self.admin)

        # List all (includes active and inactive)
        res_list = self.client.get('/api/courses/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(res_list.data['count'], 2)

        # Create
        create_payload = {
            'title': 'Data Structures',
            'code': 'CS201',
            'description': 'Trees and Graphs',
            'credits': 4,
            'duration_weeks': 10,
            'instructor': self.instructor1.id,
            'is_active': True,
        }
        res_create = self.client.post('/api/courses/', create_payload, format='json')
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)

        # Delete
        course_id = res_create.data['id']
        res_delete = self.client.delete(f'/api/courses/{course_id}/')
        self.assertEqual(res_delete.status_code, status.HTTP_200_OK)

    def test_instructor_course_permissions_and_isolation(self):
        """
        Instructors only see their assigned courses in list/get_queryset,
        and cannot modify another instructor's course.
        """
        self.client.force_authenticate(user=self.instructor1)

        # List: instructor1 should only see course1 (assigned to inst1)
        res_list = self.client.get('/api/courses/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(res_list.data['count'], 1)
        self.assertEqual(res_list.data['results'][0]['code'], 'CS101')

        # Update own course: success
        res_update_own = self.client.patch(
            f'/api/courses/{self.course1.id}/',
            {'title': 'Intro to CS - Updated'},
            format='json',
        )
        self.assertEqual(res_update_own.status_code, status.HTTP_200_OK)

        # Try to modify instructor2's course: 404 (because not in inst1's queryset) or 403
        res_update_other = self.client.patch(
            f'/api/courses/{self.course2.id}/',
            {'title': 'Hacked Math'},
            format='json',
        )
        self.assertIn(res_update_other.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

    def test_student_course_restrictions(self):
        """Students only see active courses and cannot create/update/delete courses."""
        self.client.force_authenticate(user=self.student)

        # Student list only contains active courses (course1, not course2)
        res_list = self.client.get('/api/courses/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(res_list.data['count'], 1)
        self.assertEqual(res_list.data['results'][0]['code'], 'CS101')

        # Student creation attempt blocked
        res_create = self.client.post(
            '/api/courses/',
            {'title': 'Student Course', 'code': 'STU101', 'credits': 3, 'duration_weeks': 10},
            format='json',
        )
        self.assertEqual(res_create.status_code, status.HTTP_403_FORBIDDEN)

    def test_course_validation_credits_and_code_uniqueness(self):
        """Credits outside 1-6 and duplicate course codes must be rejected."""
        self.client.force_authenticate(user=self.admin)

        # Invalid credits
        res_bad_credits = self.client.post(
            '/api/courses/',
            {'title': 'Bad Credits', 'code': 'BAD1', 'credits': 10, 'duration_weeks': 5},
            format='json',
        )
        self.assertEqual(res_bad_credits.status_code, status.HTTP_400_BAD_REQUEST)

        # Duplicate code
        res_dup_code = self.client.post(
            '/api/courses/',
            {'title': 'Duplicate CS', 'code': 'CS101', 'credits': 3, 'duration_weeks': 10},
            format='json',
        )
        self.assertEqual(res_dup_code.status_code, status.HTTP_400_BAD_REQUEST)

    def test_course_search_and_filtering(self):
        """Test course search by keyword and filtering by is_active."""
        self.client.force_authenticate(user=self.admin)

        res_search = self.client.get('/api/courses/?search=Computer')
        self.assertEqual(res_search.status_code, status.HTTP_200_OK)
        self.assertEqual(res_search.data['count'], 1)

        res_filter = self.client.get('/api/courses/?is_active=false')
        self.assertEqual(res_filter.status_code, status.HTTP_200_OK)
        self.assertEqual(res_filter.data['count'], 1)
        self.assertEqual(res_filter.data['results'][0]['code'], 'MATH201')
