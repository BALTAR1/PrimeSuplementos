from flask import Blueprint, request, jsonify
from functools import wraps
import hashlib
import os
import threading
import time

import requests

admin_bp = Blueprint('admin', __name__)

# Sesión HTTP compartida: reutiliza la conexión con Supabase en vez de abrir una nueva
# (con su handshake TLS) en cada pedido protegido.
_session = requests.Session()

# Caché de tokens ya verificados como admin.
# Clave: hash SHA-256 del token (nunca se guarda el token en claro). Valor: momento de expiración.
_tokens_verificados = {}
_cache_lock = threading.Lock()
CACHE_SEGUNDOS = 60   # cuánto tiempo se confía en un token ya verificado
CACHE_MAX_ENTRADAS = 100


def _clave_token(token):
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


def _token_en_cache(clave):
    """True si el token fue verificado como admin hace menos de CACHE_SEGUNDOS."""
    ahora = time.time()
    with _cache_lock:
        expira = _tokens_verificados.get(clave)
        if expira and expira > ahora:
            return True
        _tokens_verificados.pop(clave, None)
    return False


def _guardar_en_cache(clave):
    ahora = time.time()
    with _cache_lock:
        # Si se llena, primero se descartan las entradas vencidas y, si sigue lleno, se vacía
        if len(_tokens_verificados) >= CACHE_MAX_ENTRADAS:
            for k in [k for k, exp in _tokens_verificados.items() if exp <= ahora]:
                del _tokens_verificados[k]
            if len(_tokens_verificados) >= CACHE_MAX_ENTRADAS:
                _tokens_verificados.clear()
        _tokens_verificados[clave] = ahora + CACHE_SEGUNDOS


def _emails_admin():
    """Emails con permiso de administrador.

    Se leen de dos variables de entorno (se pueden usar las dos a la vez):
      - ADMIN_EMAIL  : un solo email
      - ADMIN_EMAILS : varios emails separados por coma
    """
    crudo = f"{os.getenv('ADMIN_EMAILS') or ''},{os.getenv('ADMIN_EMAIL') or ''}"
    return {e.strip().lower() for e in crudo.split(',') if e.strip()}


# Decorador para proteger rutas solo para los admins autenticados con Supabase Auth
def supabase_token_required(f):
    # wraps para preservar la informacion de la funcion original
    @wraps(f)
    # kwargs y args para aceptar cualquier numero de argumentos
    def decorated(*args, **kwargs):
        token = None
        # si el token esta en los headers, lo obtenemos
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split(' ')
            # Bearer para autenticacion con token JWT
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
        if not token:
            return jsonify({'error': 'Token requerido'}), 401

        # Si este token ya fue verificado como admin hace poco, no se vuelve a consultar a Supabase
        clave = _clave_token(token)
        if _token_en_cache(clave):
            return f(*args, **kwargs)

        # Verificamos el token con Supabase Auth
        supabase_url = os.getenv('SUPABASE_URL')

        headers = {'Authorization': f'Bearer {token}', 'apikey': os.getenv('SUPABASE_KEY')}
        try:
            # Llamada a la API de Supabase para verificar el token (con timeout)
            user_response = _session.get(f'{supabase_url}/auth/v1/user', headers=headers, timeout=5)

            if user_response.status_code != 200:
                return jsonify({'error': 'Token inválido o expirado'}), 401

            # Solo los usuarios cuyo email está en la lista de admins tienen permiso
            user = user_response.json()

            admin_emails = _emails_admin()
            user_email = (user.get('email') or '').strip().lower()

            if not admin_emails or user_email not in admin_emails:
                return jsonify({'error': 'No autorizado'}), 403

        except requests.exceptions.RequestException as e:
            return jsonify({'error': 'Error al verificar el token', 'details': str(e)}), 500

        # Solo se guarda en caché después de confirmar que es admin
        _guardar_en_cache(clave)

        # Si todo está bien, llamamos a la función original
        return f(*args, **kwargs)
    return decorated
