# EduFlow — Multi-Role Course Management System

A secure, tested, production-grade Course Management System built with **Django 5.x REST Framework**, **PostgreSQL**, **JWT Authentication (SimpleJWT with token blacklisting)**, and a modern **React (Vite)** frontend.

## 🌐 Live Deployment

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | [https://course-management-system-xi-ten.vercel.app](https://course-management-system-xi-ten.vercel.app) |
| **Backend API (Render)** | [https://coursemanagementsystem-ihix.onrender.com/api](https://coursemanagementsystem-ihix.onrender.com/api) |

### 🔑 Demo Login Credentials
| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@cms.com | Admin@1234 |
| **Instructor** | instructor1@cms.com | Instructor@1234 |
| **Student** | student1@cms.com | Student@1234 |

---

## 🏛️ System Architecture

```text
CourseManagementSystem/
├── backend_django/            # Django REST API Backend
│   ├── accounts/              # Custom User, Profiles, Student ID Generator, Auth Views
│   ├── courses/               # Course Management, Search, Filtering, Pagination
│   ├── enrollments/           # Course Enrollments, Progress, Constraints
│   ├── instructors/           # Admin-facing Faculty Instructor Directory
│   ├── course_backend/        # Global Settings, URLs, Exception Handler, Permissions
│   ├── requirements.txt       # Backend Python dependencies
│   └── manage.py              # Django management CLI
├── frontend/                  # React + Vite Frontend Application
│   ├── src/
│   │   ├── api/               # Axios API Clients & Interceptors (JWT Refresh)
│   │   ├── components/        # Reusable UI Components & Guards
│   │   ├── context/           # AuthContext (User Session, JWT state)
│   │   ├── pages/             # Role-specific Pages (Admin, Instructor, Student)
│   │   └── styles/            # Core CSS Design System
│   ├── package.json           # Frontend Node dependencies & scripts
│   ├── vite.config.js         # Vite configuration with API proxying
│   └── index.html             # Vite SPA entry point
├── docker-compose.yml         # Multi-container Docker configuration (PostgreSQL + Django + Vite)
├── Course_Management_System.postman_collection.json # Postman v2.1 API Collection
└── README.md                  # Project Documentation
```

---

## 🔐 Role Authorization & Permission Matrix

| Endpoint / Resource | Admin | Instructor | Student | Public |
| :--- | :---: | :---: | :---: | :---: |
| `POST /api/auth/register/` | ❌ (Blocked) | ❌ (Blocked) | ❌ (Forced Student) | ✅ (Always Student) |
| `POST /api/auth/login/` | ✅ | ✅ | ✅ | ✅ |
| `POST /api/auth/logout/` | ✅ | ✅ | ✅ | ❌ |
| `POST /api/auth/create-instructor/` | ✅ | ❌ | ❌ | ❌ |
| `POST /api/auth/create-student/` | ✅ | ❌ | ❌ | ❌ |
| `GET /api/courses/` | ✅ (All) | ✅ (Assigned) | ✅ (Active only) | ❌ |
| `POST /api/courses/` | ✅ | ❌ | ❌ | ❌ |
| `PUT/PATCH /api/courses/{id}/` | ✅ | ✅ (Own course) | ❌ | ❌ |
| `DELETE /api/courses/{id}/` | ✅ | ❌ | ❌ | ❌ |
| `POST /api/courses/{id}/enroll/` | ❌ | ❌ | ✅ (Active courses) | ❌ |
| `GET /api/enrollments/` | ✅ (All) | ✅ (Assigned courses) | ✅ (Own only) | ❌ |
| `GET /api/students/` | ✅ | ❌ | ❌ | ❌ |
| `GET /api/instructors/` | ✅ | ❌ | ❌ | ❌ |

---

## 🪪 Collision-Safe Student ID Generation Strategy

Student IDs are auto-generated in the format **`STU{YYYY}{SEQ:04d}`** (e.g. `STU2026001`, `STU2026002`).

### Concurrency & Database Safety Strategy:
1. **Year-scoped Sequence Counter**: Managed by `StudentIDCounter(year, last_sequence)`.
2. **Atomic SQL Update**: Incremented using an in-database atomic `models.F('last_sequence') + 1` SQL UPDATE query.
3. **Atomic User & Profile Creation**: Executed inside `@transaction.atomic`. If profile or student ID creation fails, user creation is completely rolled back.
4. **Unique DB Index**: Enforced via a `unique=True` database constraint on `StudentProfile.student_id`.

---

## 🔑 JWT Authentication & Logout Blacklist

- **Access Token**: Short-lived (60 mins) Bearer token attached to Axios headers via request interceptors.
- **Refresh Token**: Long-lived (7 days) token stored in `localStorage`.
- **Automatic Refresh & Rotation**: When access token expires (401), the Axios response interceptor uses `POST /api/auth/refresh/` to obtain fresh access and rotated refresh tokens.
- **Blacklisting**: `POST /api/auth/logout/` sends the refresh token to `rest_framework_simplejwt.token_blacklist`, preventing any future token reuse.

---

## 🚀 Setup & Installation (Windows PowerShell)

### Prerequisites:
- Python 3.12 or 3.13
- Node.js 18+ & npm
- PostgreSQL 16 (or Docker Desktop)

### 1. Backend Setup:
```powershell
# Navigate to backend directory
cd backend_django

# Create and activate virtual environment using uv or venv
uv venv .venv
.\.venv\Scripts\activate

# Install requirements
uv pip install -r requirements.txt

# Configure environment variables (.env)
Copy-Item .env.example .env

# Verify and run migrations
python manage.py check
python manage.py migrate

# Create initial Superuser (Admin)
python manage.py createsuperuser

# Run Django development server
python manage.py runserver 8000
```

### 2. Frontend Setup:
```powershell
# Navigate to frontend directory
cd ../frontend

# Install node dependencies
npm install --legacy-peer-deps

# Build production bundle
npm run build

# Start Vite development server
npm run dev
```

---

## 🧪 Running Automated Unit Tests

The backend test suite includes 19 comprehensive unit tests covering Authentication, Role Permissions, Course CRUD, Enrollments, and Student ID generation.

```powershell
cd backend_django
.\.venv\Scripts\python.exe manage.py test
```

---

## 🐳 Docker Deployment

To launch the full PostgreSQL + Django REST + React stack via Docker Compose:

```powershell
docker-compose up --build -d
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000/api/`
- **Swagger Documentation**: `http://localhost:8000/api/docs/`
- **PostgreSQL Database**: `localhost:5432` (`course_management_db`)

---

## 📄 Postman Collection

Import `Course_Management_System.postman_collection.json` into Postman to test all endpoints across Authentication, Admin, Instructor, Student, Courses, Enrollments, and Negative Security Scenarios.
