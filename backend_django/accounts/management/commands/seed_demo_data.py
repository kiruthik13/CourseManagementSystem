"""
Django management command to seed initial demo accounts and courses.

Usage:
  python manage.py seed_demo_data
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User, InstructorProfile, StudentProfile, StudentIDCounter
from courses.models import Course
from enrollments.models import Enrollment


class Command(BaseCommand):
    help = "Seed initial demo users (Admin, Instructor, Student) and sample courses."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data...")

        # 1. Create Admin
        admin, created_admin = User.objects.get_or_create(
            email='admin@example.com',
            defaults={
                'first_name': 'System',
                'last_name': 'Administrator',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created_admin:
            admin.set_password('Admin@12345')
            admin.save()
            self.stdout.write(self.style.SUCCESS("Created Admin: admin@example.com / Admin@12345"))
        else:
            self.stdout.write("Admin account already exists.")

        # 2. Create Instructor
        instructor, created_inst = User.objects.get_or_create(
            email='instructor@example.com',
            defaults={
                'first_name': 'Dr. Robert',
                'last_name': 'Miller',
                'role': User.Role.INSTRUCTOR,
            }
        )
        if created_inst:
            instructor.set_password('Instructor@12345')
            instructor.save()
            InstructorProfile.objects.create(
                user=instructor,
                department='Computer Science',
                qualification='Ph.D. in Computer Science',
                experience_years=10,
                bio='Specializes in distributed systems and software engineering.'
            )
            self.stdout.write(self.style.SUCCESS("Created Instructor: instructor@example.com / Instructor@12345"))
        else:
            self.stdout.write("Instructor account already exists.")

        # 3. Create Student
        student, created_stu = User.objects.get_or_create(
            email='student@example.com',
            defaults={
                'first_name': 'Alex',
                'last_name': 'Johnson',
                'role': User.Role.STUDENT,
            }
        )
        if created_stu:
            student.set_password('Student@12345')
            student.save()
            student_id = StudentIDCounter.generate_student_id()
            StudentProfile.objects.create(
                user=student,
                student_id=student_id,
                department='Computer Science',
                year_of_study=3
            )
            self.stdout.write(self.style.SUCCESS(f"Created Student: student@example.com / Student@12345 (ID: {student_id})"))
        else:
            self.stdout.write("Student account already exists.")

        # 4. Create Sample Courses
        c1, _ = Course.objects.get_or_create(
            code='CS101',
            defaults={
                'title': 'Introduction to Computer Science',
                'description': 'Core concepts of programming, algorithms, and computational thinking.',
                'credits': 4,
                'duration_weeks': 12,
                'instructor': instructor,
                'is_active': True,
            }
        )

        c2, _ = Course.objects.get_or_create(
            code='CS201',
            defaults={
                'title': 'Data Structures & Algorithms',
                'description': 'Arrays, linked lists, trees, graphs, sorting, and search algorithms.',
                'credits': 4,
                'duration_weeks': 14,
                'instructor': instructor,
                'is_active': True,
            }
        )

        # 5. Create Sample Enrollment
        Enrollment.objects.get_or_create(
            student=student,
            course=c1,
            defaults={
                'status': Enrollment.Status.ACTIVE,
                'completion_percentage': 45.0,
            }
        )

        self.stdout.write(self.style.SUCCESS("Successfully seeded demo users, courses, and enrollments!"))
