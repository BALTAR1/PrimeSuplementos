# Configuración Gunicorn para Ecommerce-Electro
import os

# Puerto dinámico para Render, Heroku, Railway, etc. o 8000 por defecto local
port = os.getenv("PORT", "8000")
bind = f"0.0.0.0:{port}"

# Número de workers: 2 x núcleos + 1 (ajustable por variable de entorno)
workers = int(os.getenv("WORKERS", "4"))
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Reinicio de workers para evitar fugas de memoria
max_requests = 1000
max_requests_jitter = 50
preload_app = True

# Recarga automática solo en desarrollo
if os.getenv("FLASK_ENV", "development") != "production":
    reload = True
    workers = 1
else:
    reload = False

# Logs a stdout/stderr (compatible con Render, Railway, Docker, etc.)
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Seguridad
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Directorio temporal para workers (Linux recomendado)
worker_tmp_dir = "/dev/shm"
# tmp_upload_dir = None  # No se usa por defecto