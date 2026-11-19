from flask import Blueprint, request, jsonify
from supabase_client import supabase
from routes.admin import supabase_token_required

producto_imagenes_bp = Blueprint('producto_imagenes', __name__)

# =========================
# Endpoint: Agregar imagen a un producto
# =========================
@producto_imagenes_bp.route('/producto_imagenes', methods=['POST'])
@supabase_token_required
def agregar_imagen():
    data = request.get_json() or {}
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

    # orden: posición de la imagen (1, 2, 3...). Si no viene, 0.
    try:
        orden = int(data.get('orden', 0))
    except (ValueError, TypeError):
        return jsonify({'error': 'orden debe ser un número entero'}), 400

    # visible: por defecto True; solo es False si llega explícitamente en False
    visible = data.get('visible', True) is not False

    # descripcion es opcional
    imagen = {
        'producto_id': producto_id,
        'url': data['url'],
        'descripcion': data.get('descripcion', None),
        'orden': orden,
        'visible': visible
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
# Endpoint: Listar imágenes de un producto (ordenadas)
# =========================
@producto_imagenes_bp.route('/producto_imagenes/<int:producto_id>', methods=['GET'])
def listar_imagenes(producto_id):
    try:
        response = (
            supabase.table('producto_imagenes')
            .select('*')
            .eq('producto_id', producto_id)
            .order('orden')
            .order('imagen_id')
            .execute()
        )
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================
# Endpoint: Listar imágenes de varios productos (ordenadas)
# =========================
@producto_imagenes_bp.route('/producto_imagenes', methods=['GET'])
def listar_imagenes_por_productos():
    ids_param = request.args.get('producto_ids', '')
    producto_ids = []

    for producto_id in ids_param.split(','):
        producto_id = producto_id.strip()
        if not producto_id:
            continue
        try:
            producto_id = int(producto_id)
        except ValueError:
            return jsonify({'error': 'producto_ids debe contener IDs enteros separados por comas'}), 400
        if producto_id <= 0:
            return jsonify({'error': 'Los IDs de producto deben ser positivos'}), 400
        producto_ids.append(producto_id)

    if not producto_ids:
        return jsonify([]), 200

    try:
        response = (
            supabase.table('producto_imagenes')
            .select('*')
            .in_('producto_id', producto_ids)
            .order('orden')
            .order('imagen_id')
            .execute()
        )
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================
# Endpoint: Eliminar imagen por ID
# =========================
@producto_imagenes_bp.route('/producto_imagenes/<int:imagen_id>', methods=['DELETE'])
@supabase_token_required
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
@supabase_token_required
def actualizar_imagen(imagen_id):
    data = request.get_json() or {}
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

# =========================
# Endpoint: Reemplazar TODAS las imágenes adicionales de un producto
# (borra las que había por producto_id y inserta la lista nueva en un solo pedido;
#  evita duplicados porque no depende de los IDs de imágenes viejas)
# =========================
@producto_imagenes_bp.route('/producto/<int:producto_id>/imagenes', methods=['PUT'])
@supabase_token_required
def reemplazar_imagenes(producto_id):
    data = request.get_json() or {}
    imagenes = data.get('imagenes')

    if not isinstance(imagenes, list):
        return jsonify({'error': 'El campo imagenes debe ser una lista'}), 400

    filas = []
    for index, img in enumerate(imagenes):
        if not isinstance(img, dict):
            return jsonify({'error': 'Cada imagen debe ser un objeto'}), 400
        url = img.get('url')
        if not isinstance(url, str) or not url.strip():
            return jsonify({'error': 'Cada imagen necesita una url'}), 400
        try:
            orden = int(img.get('orden', index + 1))
        except (ValueError, TypeError):
            return jsonify({'error': 'orden debe ser un número entero'}), 400
        filas.append({
            'producto_id': producto_id,
            'url': url,
            'descripcion': img.get('descripcion') or f'Imagen {index + 2}',
            'orden': orden,
            'visible': img.get('visible', True) is not False
        })

    try:
        # 1) Borra todas las imágenes adicionales del producto
        supabase.table('producto_imagenes').delete().eq('producto_id', producto_id).execute()
        # 2) Inserta la lista nueva de una sola vez
        if filas:
            supabase.table('producto_imagenes').insert(filas).execute()
        return jsonify({'msg': 'Imágenes actualizadas', 'total': len(filas)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
