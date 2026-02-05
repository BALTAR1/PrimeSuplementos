from flask import Blueprint, request, jsonify
from supabase_client import supabase

producto_imagenes_bp = Blueprint('producto_imagenes', __name__)

# =========================
# Endpoint: Agregar imagen a un producto
# =========================
@producto_imagenes_bp.route('/producto_imagenes', methods=['POST'])
def agregar_imagen():
    data = request.get_json()
    required_fields = ['producto_id', 'url']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'El campo {field} es obligatorio'}), 400
    try:
        producto_id = int(data['producto_id'])
        if producto_id <= 0:
            return jsonify({'error': 'producto_id inválido'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'producto_id inválido'}), 400
    if not isinstance(data['url'], str) or not data['url'].strip():
        return jsonify({'error': 'La url es obligatoria'}), 400
    # descripcion es opcional
    imagen = {
        'producto_id': producto_id,
        'url': data['url'],
        'descripcion': data.get('descripcion', None)
    }
    try:
        response = supabase.table('producto_imagenes').insert(imagen).execute()
        if response.data:
            return jsonify({'msg': 'Imagen agregada exitosamente'}), 201
        else:
            return jsonify({'error': 'Error al agregar la imagen'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================
# Endpoint: Listar imágenes de un producto
# =========================
@producto_imagenes_bp.route('/producto_imagenes/<int:producto_id>', methods=['GET'])
def listar_imagenes(producto_id):
    try:
        response = supabase.table('producto_imagenes').select('*').eq('producto_id', producto_id).execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================
# Endpoint: Eliminar imagen por ID
# =========================
@producto_imagenes_bp.route('/producto_imagenes/<int:imagen_id>', methods=['DELETE'])
def eliminar_imagen(imagen_id):
    try:
        response = supabase.table('producto_imagenes').delete().eq('imagen_id', imagen_id).execute()
        if response.data:
            return jsonify({'msg': 'Imagen eliminada exitosamente'}), 200
        else:
            return jsonify({'error': 'Imagen no encontrada'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================
# Endpoint: Actualizar descripción de imagen (opcional)
# =========================
@producto_imagenes_bp.route('/producto_imagenes/<int:imagen_id>', methods=['PUT'])
def actualizar_imagen(imagen_id):
    data = request.get_json()
    if 'descripcion' not in data:
        return jsonify({'error': 'El campo descripcion es obligatorio'}), 400
    try:
        response = supabase.table('producto_imagenes').update({'descripcion': data['descripcion']}).eq('imagen_id', imagen_id).execute()
        if response.data:
            return jsonify({'msg': 'Descripción actualizada'}), 200
        else:
            return jsonify({'error': 'Imagen no encontrada'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
