from flask import Blueprint, request, jsonify
from supabase_client import supabase
from routes.admin import supabase_token_required
from datetime import datetime

# Creamos el blueprint para las rutas de ofertas
oferta_bp = Blueprint('oferta', __name__)


# =========================
# Helper: adjuntar datos del producto (y su marca) a las ofertas
# =========================
def adjuntar_productos(ofertas):
    """
    Agrega la clave 'producto' a cada oferta.
    - Usa select('*') en productos para no depender de columnas que no existen
      (antes fallaba con: column productos.marca does not exist).
    - Resuelve el nombre de la marca desde la tabla 'marcas' usando marca_id.
    - Hace UNA sola consulta para todos los productos (en vez de una por oferta).
    """
    if not ofertas:
        return ofertas

    producto_ids = list({o['producto_id'] for o in ofertas if o.get('producto_id')})
    if not producto_ids:
        return ofertas

    productos_resp = supabase.table('productos').select('*').in_('producto_id', producto_ids).execute()
    productos = {p['producto_id']: p for p in (productos_resp.data or [])}

    # Mapa de marcas (si el producto tiene marca_id). Nunca debe romper el endpoint.
    marcas = {}
    try:
        marca_ids = list({p['marca_id'] for p in productos.values() if p.get('marca_id')})
        if marca_ids:
            # Primero probamos con marca_id; si tu PK se llama distinto, probamos con id
            for pk in ('marca_id', 'id'):
                try:
                    marcas_resp = supabase.table('marcas').select('*').in_(pk, marca_ids).execute()
                    for m in (marcas_resp.data or []):
                        marcas[m.get(pk)] = m.get('nombre')
                    break
                except Exception:
                    continue
    except Exception:
        marcas = {}

    for oferta in ofertas:
        p = productos.get(oferta.get('producto_id'))
        if not p:
            continue
        # 'marca' se mantiene como texto para que el front no tenga que cambiar
        marca = p.get('marca') or marcas.get(p.get('marca_id'))
        oferta['producto'] = {
            'producto_id': p.get('producto_id'),
            'nombre': p.get('nombre'),
            'marca': marca,
            'precio': p.get('precio'),
            'imagen_url': p.get('imagen_url'),
            'stock': p.get('stock'),
        }

    return ofertas


# =========================
# Endpoint: Obtener oferta por Id
# =========================
@oferta_bp.route('/oferta/<int:oferta_id>', methods=['GET'])
def obtener_oferta(oferta_id):
    try:
        response = supabase.table('ofertas').select('*').eq('oferta_id', oferta_id).execute()

        if response.data:
            oferta = adjuntar_productos([response.data[0]])[0]
            return jsonify(oferta), 200
        else:
            return jsonify({'error': 'Oferta no encontrada'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =========================
# Endpoint: Obtener todas las ofertas (con filtros)
# =========================
@oferta_bp.route('/ofertas', methods=['GET'])
def obtener_ofertas():
    try:
        query = supabase.table('ofertas').select('*')
        args = request.args

        # Filtros dinámicos
        if 'activo' in args:
            activo = args['activo'].lower() == 'true'
            query = query.eq('activo', activo)

        if 'producto_id' in args:
            query = query.eq('producto_id', args['producto_id'])

        if 'tipo_oferta' in args:
            query = query.eq('tipo_oferta', args['tipo_oferta'])

        # Filtro de ofertas vigentes
        if 'vigentes' in args and args['vigentes'].lower() == 'true':
            now = datetime.utcnow().isoformat()
            query = query.lte('fecha_inicio', now).gte('fecha_fin', now)

        # Paginación
        try:
            limit = int(args.get('limit', 50))
            offset = int(args.get('offset', 0))
            if limit < 1 or limit > 100:
                return jsonify({'error': 'El limit debe estar entre 1 y 100'}), 400
            if offset < 0:
                return jsonify({'error': 'El offset no puede ser negativo'}), 400
        except ValueError:
            return jsonify({'error': 'Limit y offset deben ser números enteros'}), 400

        query = query.range(offset, offset + limit - 1)

        # Ordenamiento
        order = args.get('order', 'desc')
        query = query.order('created_at', desc=(order == 'desc'))

        response = query.execute()
        ofertas = adjuntar_productos(response.data or [])

        return jsonify(ofertas), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =========================
# Endpoint: Crear oferta
# =========================
@oferta_bp.route('/oferta', methods=['POST'])
@supabase_token_required
def crear_oferta():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No se enviaron datos'}), 400

    required_fields = ['producto_id', 'descuento', 'activo']

    # Validar presencia de campos obligatorios
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'El campo {field} es obligatorio'}), 400

    # Validaciones específicas
    try:
        producto_id = int(data['producto_id'])
        if producto_id <= 0:
            return jsonify({'error': 'El producto_id debe ser válido'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'El producto_id debe ser un número entero'}), 400

    try:
        descuento = float(data['descuento'])
        if descuento <= 0 or descuento > 100:
            return jsonify({'error': 'El descuento debe estar entre 0 y 100'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'El descuento debe ser un número válido'}), 400

    if not isinstance(data['activo'], bool):
        return jsonify({'error': 'El campo activo debe ser booleano'}), 400

    # Validar que el producto exista
    try:
        producto_check = supabase.table('productos').select('producto_id').eq('producto_id', producto_id).execute()
        if not producto_check.data:
            return jsonify({'error': 'El producto no existe'}), 404
    except Exception as e:
        return jsonify({'error': f'Error al verificar producto: {str(e)}'}), 500

    try:
        oferta_data = {
            'producto_id': producto_id,
            'descuento': descuento,
            'fecha_inicio': data.get('fecha_inicio'),
            'fecha_fin': data.get('fecha_fin'),
            'activo': data['activo'],
            'tipo_oferta': data.get('tipo_oferta')
        }

        response = supabase.table('ofertas').insert(oferta_data).execute()

        if response.data:
            return jsonify(adjuntar_productos([response.data[0]])[0]), 201
        else:
            return jsonify({'error': 'Error al crear la oferta'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =========================
# Endpoint: Actualizar oferta
# =========================
@oferta_bp.route('/oferta/<int:oferta_id>', methods=['PUT'])
@supabase_token_required
def actualizar_oferta(oferta_id):
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No se enviaron datos para actualizar'}), 400

    # Eliminar campos que no deben actualizarse (incluye el 'producto' anidado que agrega el GET)
    data.pop('oferta_id', None)
    data.pop('created_at', None)
    data.pop('producto', None)

    # Validar descuento si viene
    if 'descuento' in data:
        try:
            descuento = float(data['descuento'])
            if descuento <= 0 or descuento > 100:
                return jsonify({'error': 'El descuento debe estar entre 0 y 100'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'El descuento debe ser un número válido'}), 400

    try:
        response = supabase.table('ofertas').update(data).eq('oferta_id', oferta_id).execute()

        if response.data:
            return jsonify(adjuntar_productos([response.data[0]])[0]), 200
        else:
            return jsonify({'error': 'Oferta no encontrada'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =========================
# Endpoint: Eliminar oferta
# =========================
@oferta_bp.route('/oferta/<int:oferta_id>', methods=['DELETE'])
@supabase_token_required
def eliminar_oferta(oferta_id):
    try:
        response = supabase.table('ofertas').delete().eq('oferta_id', oferta_id).execute()

        if response.data:
            return jsonify({'message': 'Oferta eliminada correctamente'}), 200
        else:
            return jsonify({'error': 'Oferta no encontrada'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =========================
# Endpoint: Obtener ofertas activas para un producto específico
# =========================
@oferta_bp.route('/producto/<int:producto_id>/ofertas', methods=['GET'])
def obtener_ofertas_producto(producto_id):
    try:
        now = datetime.utcnow().isoformat()

        response = supabase.table('ofertas').select('*').eq('producto_id', producto_id).eq('activo', True).lte('fecha_inicio', now).gte('fecha_fin', now).execute()

        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =========================
# Endpoint: Activar/Desactivar oferta
# =========================
@oferta_bp.route('/oferta/<int:oferta_id>/toggle', methods=['PATCH'])
@supabase_token_required
def toggle_oferta(oferta_id):
    try:
        # Obtener estado actual
        response = supabase.table('ofertas').select('activo').eq('oferta_id', oferta_id).execute()

        if not response.data:
            return jsonify({'error': 'Oferta no encontrada'}), 404

        nuevo_estado = not response.data[0]['activo']

        # Actualizar estado
        update_response = supabase.table('ofertas').update({'activo': nuevo_estado}).eq('oferta_id', oferta_id).execute()

        if update_response.data:
            return jsonify(update_response.data[0]), 200
        else:
            return jsonify({'error': 'Error al actualizar la oferta'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500
