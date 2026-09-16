"""Course Management System — Django project package."""
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass
