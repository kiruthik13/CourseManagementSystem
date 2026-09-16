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

        # 1. Create Admins
        for email, passw in [('admin@cms.com', 'Admin@1234'), ('admin@example.com', 'Admin@12345')]:
            admin, created_admin = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': 'System',
                    'last_name': 'Administrator',
                    'role': User.Role.ADMIN,
                    'is_staff': True,
                    'is_superuser': True,
                }
            )
            if created_admin:
                admin.set_password(passw)
                admin.save()
                self.stdout.write(self.style.SUCCESS(f"Created Admin: {email} / {passw}"))
            else:
                self.stdout.write(f"Admin account {email} already exists.")

        # 2. Create Instructors
        for email, passw, fname, lname in [
            ('instructor1@cms.com', 'Instructor@1234', 'John', 'Doe'),
            ('instructor@example.com', 'Instructor@12345', 'Dr. Robert', 'Miller')
        ]:
            instructor, created_inst = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': fname,
                    'last_name': lname,
                    'role': User.Role.INSTRUCTOR,
                }
            )
            if created_inst:
                instructor.set_password(passw)
                instructor.save()
                InstructorProfile.objects.create(
                    user=instructor,
                    department='Computer Science',
                    qualification='Ph.D. in Computer Science',
                    experience_years=10,
                    bio='Specializes in distributed systems and software engineering.'
                )
                self.stdout.write(self.style.SUCCESS(f"Created Instructor: {email} / {passw}"))
            else:
                self.stdout.write(f"Instructor account {email} already exists.")

        # 3. Create Students
        for email, passw, fname, lname in [
            ('student1@cms.com', 'Student@1234', 'Jane', 'Smith'),
            ('student@example.com', 'Student@12345', 'Alex', 'Johnson')
        ]:
            student, created_stu = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': fname,
                    'last_name': lname,
                    'role': User.Role.STUDENT,
                }
            )
            if created_stu:
                student.set_password(passw)
                student.save()
                student_id = StudentIDCounter.generate_student_id()
                StudentProfile.objects.create(
                    user=student,
                    student_id=student_id,
                    department='Computer Science',
                    year_of_study=3
                )
                self.stdout.write(self.style.SUCCESS(f"Created Student: {email} / {passw} (ID: {student_id})"))
            else:
                self.stdout.write(f"Student account {email} already exists.")

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
