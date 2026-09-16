"""
Unit tests for enrollments app (Creation, duplicate check, inactive course check, role isolation, completion validation).
"""
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User, StudentProfile, InstructorProfile, StudentIDCounter
from courses.models import Course
from enrollments.models import Enrollment


class EnrollmentsTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        # Admin
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password='Password123!',
            first_name='Admin',
            last_name='User',
            role=User.Role.ADMIN,
        )

        # Instructor
        self.instructor = User.objects.create_user(
            email='inst@example.com',
            password='Password123!',
            first_name='Inst',
            last_name='Teacher',
            role=User.Role.INSTRUCTOR,
        )
        InstructorProfile.objects.create(user=self.instructor, department='CS')

        # Students
        self.student1 = User.objects.create_user(
            email='stu1@example.com',
            password='Password123!',
            first_name='Alice',
            last_name='Student',
            role=User.Role.STUDENT,
        )
        StudentProfile.objects.create(user=self.student1, student_id=StudentIDCounter.generate_student_id())

        self.student2 = User.objects.create_user(
            email='stu2@example.com',
            password='Password123!',
            first_name='Bob',
            last_name='Student',
            role=User.Role.STUDENT,
        )
        StudentProfile.objects.create(user=self.student2, student_id=StudentIDCounter.generate_student_id())

        # Courses
        self.active_course = Course.objects.create(
            title='Active Python Course',
            code='PY101',
            credits=3,
            duration_weeks=8,
            instructor=self.instructor,
            is_active=True,
        )

        self.inactive_course = Course.objects.create(
            title='Legacy Fortran Course',
            code='FOR101',
            credits=3,
            duration_weeks=8,
            instructor=self.instructor,
            is_active=False,
        )

    def test_student_self_enrollment_success(self):
        """Student can self-enroll in active courses."""
        self.client.force_authenticate(user=self.student1)
        res = self.client.post(f'/api/courses/{self.active_course.id}/enroll/')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Enrollment.objects.filter(student=self.student1, course=self.active_course).exists())

    def test_duplicate_enrollment_rejected(self):
        """Student cannot enroll in the same course twice."""
        Enrollment.objects.create(student=self.student1, course=self.active_course)
        self.client.force_authenticate(user=self.student1)
        res = self.client.post(f'/api/courses/{self.active_course.id}/enroll/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_enrollment_in_inactive_course_rejected(self):
        """Enrollment in inactive courses must be rejected (404 via course action or 400 via enrollment serializer)."""
        self.client.force_authenticate(user=self.student1)
        res_action = self.client.post(f'/api/courses/{self.inactive_course.id}/enroll/')
        self.assertIn(res_action.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_400_BAD_REQUEST])

        # Direct enrollment creation attempt via POST /api/enrollments/
        res_direct = self.client.post('/api/enrollments/', {'course': self.inactive_course.id}, format='json')
        self.assertEqual(res_direct.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_enrollment_isolation(self):
        """Students can only view their own enrollments, not other students'."""
        e1 = Enrollment.objects.create(student=self.student1, course=self.active_course)

        # student2 listing enrollments
        self.client.force_authenticate(user=self.student2)
        res_list = self.client.get('/api/enrollments/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertEqual(res_list.data['count'], 0)

        # student2 attempting to modify student1's enrollment
        res_update = self.client.patch(
            f'/api/enrollments/{e1.id}/',
            {'status': 'completed', 'completion_percentage': 100},
            format='json',
        )
        self.assertIn(res_update.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

    def test_completion_percentage_validation(self):
        """Status 'completed' requires completion_percentage=100."""
        e1 = Enrollment.objects.create(student=self.student1, course=self.active_course)
        self.client.force_authenticate(user=self.admin)

        # Invalid completion < 100 for status 'completed'
        res_bad = self.client.patch(
            f'/api/enrollments/{e1.id}/',
            {'status': 'completed', 'completion_percentage': 50},
            format='json',
        )
        self.assertEqual(res_bad.status_code, status.HTTP_400_BAD_REQUEST)

        # Valid completion
        res_good = self.client.patch(
            f'/api/enrollments/{e1.id}/',
            {'status': 'completed', 'completion_percentage': 100},
            format='json',
        )
        self.assertEqual(res_good.status_code, status.HTTP_200_OK)
