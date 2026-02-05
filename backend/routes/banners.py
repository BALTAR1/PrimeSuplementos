from flask import Blueprint, request, jsonify
from supabase_client import supabase
from routes.admin import supabase_token_required
import uuid
import os

banner_bp = Blueprint('banner', __name__)

# =========================
# Endpoint: Obtener todos los banners activos (público)
# =========================
@banner_bp.route('/banners', methods=['GET'])
def obtener_banners():
    try:
        response = supabase.table('banners') \
            .select('*') \
            .eq('activo', True) \
            .order('orden', desc=False) \
            .execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================
# Endpoint: Obtener todos los banners (admin)
# =========================
@banner_bp.route('/banners/admin', methods=['GET'])
@supabase_token_required
def obtener_banners_admin():
    try:
        response = supabase.table('banners') \
            .select('*') \
            .order('orden', desc=False) \
            .execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================
# Endpoint: Obtener banner por ID
# =========================
@banner_bp.route('/banner/<int:banner_id>', methods=['GET'])
@supabase_token_required
def obtener_banner(banner_id):
    try:
        response = supabase.table('banners') \
            .select('*') \
            .eq('banner_id', banner_id) \
            .execute()
        if response.data:
            return jsonify(response.data[0]), 200
        else:
            return jsonify({'error': 'Banner no encontrado'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================
# Endpoint: Crear banner
# =========================
@banner_bp.route('/banner', methods=['POST'])
@supabase_token_required
def crear_banner():
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        if not data.get('imagen_url'):
            return jsonify({'error': 'La URL de la imagen es requerida'}), 400
        
        # Preparar datos para insertar
        banner_data = {
            'titulo': data.get('titulo', ''),
            'descripcion': data.get('descripcion', ''),
            'imagen_url': data['imagen_url'],
            'orden': data.get('orden', 0),
            'activo': data.get('activo', True)
        }
        
        response = supabase.table('banners').insert(banner_data).execute()
        return jsonify(response.data[0]), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================
# Endpoint: Actualizar banner
# =========================
@banner_bp.route('/banner/<int:banner_id>', methods=['PUT'])
@supabase_token_required
def actualizar_banner(banner_id):
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No se enviaron datos para actualizar'}), 400
        
        # Remover campos que no deben actualizarse
        data.pop('banner_id', None)
        data.pop('created_at', None)
        
        response = supabase.table('banners') \
            .update(data) \
            .eq('banner_id', banner_id) \
            .execute()
        
        if response.data:
            return jsonify(response.data[0]), 200
        else:
            return jsonify({'error': 'Banner no encontrado'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================
# Endpoint: Eliminar banner
# =========================
@banner_bp.route('/banner/<int:banner_id>', methods=['DELETE'])
@supabase_token_required
def eliminar_banner(banner_id):
    try:
        # Primero obtener la URL de la imagen para eliminarla del storage
        banner_response = supabase.table('banners') \
            .select('imagen_url') \
            .eq('banner_id', banner_id) \
            .execute()
        
        if not banner_response.data:
            return jsonify({'error': 'Banner no encontrado'}), 404
        
        # Eliminar del storage si existe
        imagen_url = banner_response.data[0].get('imagen_url', '')
        if imagen_url and 'banners/' in imagen_url:
            # Extraer el path del archivo
            file_path = imagen_url.split('banners/')[-1].split('?')[0]
            try:
                supabase.storage.from_('banners').remove([file_path])
            except:
                pass  # Si falla, continuar con la eliminación del registro
        
        # Eliminar el registro
        response = supabase.table('banners') \
            .delete() \
            .eq('banner_id', banner_id) \
            .execute()
        
        return jsonify({'message': 'Banner eliminado exitosamente'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================
# Endpoint: Subir imagen de banner
# =========================
@banner_bp.route('/banner/upload', methods=['POST'])
@supabase_token_required
def subir_imagen_banner():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No se envió ningún archivo'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No se seleccionó ningún archivo'}), 400
        
        # Validar tipo de archivo
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_ext not in allowed_extensions:
            return jsonify({'error': 'Tipo de archivo no permitido'}), 400
        
        # Generar nombre único
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        
        # Subir a Supabase Storage
        file_bytes = file.read()
        
        try:
            response = supabase.storage.from_('banners').upload(
                unique_filename,
                file_bytes,
                {
                    'content-type': file.content_type,
                    'upsert': 'false'
                }
            )
        except Exception as storage_error:
            raise storage_error
        
        # Obtener URL pública
        public_url = supabase.storage.from_('banners').get_public_url(unique_filename)
        
        return jsonify({
            'url': public_url,
            'filename': unique_filename
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================
# Endpoint: Actualizar orden de banners
# =========================
@banner_bp.route('/banners/reordenar', methods=['PUT'])
@supabase_token_required
def reordenar_banners():
    try:
        data = request.get_json()
        banners = data.get('banners', [])
        
        if not banners:
            return jsonify({'error': 'No se enviaron banners para reordenar'}), 400
        
        # Actualizar el orden de cada banner
        for banner in banners:
            banner_id = banner.get('banner_id')
            orden = banner.get('orden')
            
            if banner_id is not None and orden is not None:
                supabase.table('banners') \
                    .update({'orden': orden}) \
                    .eq('banner_id', banner_id) \
                    .execute()
        
        return jsonify({'message': 'Orden actualizado exitosamente'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
