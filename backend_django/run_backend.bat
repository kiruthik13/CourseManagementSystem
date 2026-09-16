@echo off
echo Starting Django MySQL Backend Server on http://127.0.0.1:8000/ ...
"C:\Program Files\PostgreSQL\18\pgAdmin 4\python\python.exe" manage.py migrate
"C:\Program Files\PostgreSQL\18\pgAdmin 4\python\python.exe" manage.py runserver 127.0.0.1:8000
