from flask import Blueprint, request, jsonify
from functools import wraps
import requests
import os

admin_bp = Blueprint('admin', __name__)

# Decorador para proteger rutas solo para el admin autenticado con Supabase Auth
def supabase_token_required(f):
    # wraps para preservar la informacion de la funcion original
    @wraps(f)
    # kwargs y args para aceptar cualquier numero de argumentos
    def decorated(*args, **kwargs):
        token = None
        #si el token esta en los headers, lo obtenemos
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split(' ')
            # Bearer para autenticacion con token JWT
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
        if not token:
            return jsonify({'error': 'Token requerido'}), 401

        # Verificamos el token con Supabase Auth
        supabase_url = os.getenv('SUPABASE_URL')
        
        headers = {'Authorization': f'Bearer {token}', 'apikey': os.getenv('SUPABASE_KEY')}
        try:
            # Llamada a la API de Supabase para verificar el token
            user_response = requests.get(f'{supabase_url}/auth/v1/user', headers=headers)
            
            if user_response.status_code != 200:
                return jsonify({'error': 'Token inválido o expirado'}), 401

            # Verificamos si el usuario es admin (aquí asumimos que el admin es el primer usuario creado)
            user = user_response.json()
            
            admin_email = os.getenv('ADMIN_EMAIL')
            
            if not admin_email or user.get('email') != admin_email:
                return jsonify({'error': 'No autorizado'}), 403

        except requests.exceptions.RequestException as e:
            return jsonify({'error': 'Error al verificar el token', 'details': str(e)}), 500

        # Si todo está bien, llamamos a la función original 
        return f(*args, **kwargs)
    return decorated