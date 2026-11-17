from flask import Blueprint, request, jsonify
from supabase_client import supabase
from routes.admin import supabase_token_required
from datetime import datetime

# Creamos el blueprint para las rutas de combos
combo_bp = Blueprint('combo', __name__)


# =========================
# Helpers internos
# =========================
def obtener_producto(producto_id):
    """Trae el producto con el nombre de su marca.
    La tabla productos solo tiene marca_id, asi que se une con marcas."""
    resp = (supabase.table('productos')
            .select('producto_id, nombre, precio, imagen_url, stock, marcas(nombre)')
            .eq('producto_id', producto_id)
            .limit(1)
            .execute())
    if not resp.data:
        return None
    producto = resp.data[0]
    marca = producto.pop('marcas', None)
    producto['marca'] = marca['nombre'] if marca else None
    return producto


def limpiar_vacios(data, campos=('fecha_inicio', 'fecha_fin', 'imagen_url')):
    """Convierte '' en None para que Postgres no rechace fechas vacias."""
    for campo in campos:
        if campo in data and data[campo] == '':
            data[campo] = None
    return data


def productos_de_combo(combo_id):
    """Devuelve la lista [{cantidad, producto}] de un combo."""
    relaciones = (supabase.table('combo_productos')
                  .select('cantidad, producto_id')
                  .eq('combo_id', combo_id)
                  .execute())
    resultado = []
    for cp in relaciones.data or []:
        producto = obtener_producto(cp['producto_id'])
        if producto:
            resultado.append({
                'cantidad': cp['cantidad'],
                'producto': producto
            })
    return resultado


# =========================
# Endpoint: Obtener combo por Id con sus productos
# =========================
@combo_bp.route('/combo/<int:combo_id>', methods=['GET'])
def obtener_combo(combo_id):
    try:
        # Obtenemos el combo
        response = supabase.table('combos').select('*').eq('combo_id', combo_id).execute()
        if not response.data:
            return jsonify({'error': 'Combo no encontrado'}), 404

        combo = response.data[0]
        combo['productos'] = productos_de_combo(combo_id)

        return jsonify(combo), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =========================
# Endpoint: Obtener todos los combos (con filtros)
# =========================
@combo_bp.route('/combos', methods=['GET'])
def obtener_combos():
    try:
        query = supabase.table('combos').select('*')
        args = request.args

        # Filtros dinámicos
        if 'activo' in args:
            activo = args['activo'].lower() == 'true'
            query = query.eq('activo', activo)

        if 'nombre' in args:
            query = query.ilike('nombre', f"%{args['nombre']}%")

        # Filtro de fecha (combos vigentes)
        if 'vigentes' in args and args['vigentes'].lower() == 'true':
            now = datetime.utcnow().isoformat()
            query = query.lte('fecha_inicio', now).gte('fecha_fin', now)

        # Paginación
        try:
            limit = int(args.get('limit', 20))
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

        # Si se solicita con productos, agregamos los productos a cada combo
        if 'con_productos' in args and args['con_productos'].lower() == 'true':
            for combo in response.data:
                combo['productos'] = productos_de_combo(combo['combo_id'])

        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =========================
# Endpoint: Crear combo
# =========================
@combo_bp.route('/combo', methods=['POST'])
@supabase_token_required
def crear_combo():
    data = limpiar_vacios(request.get_json() or {})

    required_fields = ['nombre', 'descripcion', 'precio_combo', 'activo']

    # Validar presencia de campos obligatorios
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'El campo {field} es obligatorio'}), 400

    # Validaciones específicas
    if not isinstance(data['nombre'], str) or not data['nombre'].strip():
        return jsonify({'error': 'El nombre debe ser un texto no vacío'}), 400

    if not isinstance(data['descripcion'], str):
        return jsonify({'error': 'La descripción debe ser un texto'}), 400

    try:
        precio_combo = float(data['precio_combo'])
        if precio_combo <= 0:
            return jsonify({'error': 'El precio del combo debe ser mayor a 0'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'El precio debe ser un número válido'}), 400

    if not isinstance(data['activo'], bool):
        return jsonify({'error': 'El campo activo debe ser booleano'}), 400

    # Extraer productos del combo
    productos_combo = data.pop('productos', [])

    try:
        # Crear el combo
        combo_data = {
            'nombre': data['nombre'],
            'descripcion': data['descripcion'],
            'precio_combo': data['precio_combo'],
            'imagen_url': data.get('imagen_url'),
            'activo': data['activo'],
            'fecha_inicio': data.get('fecha_inicio'),
            'fecha_fin': data.get('fecha_fin')
        }

        response = supabase.table('combos').insert(combo_data).execute()

        if not response.data:
            return jsonify({'error': 'Error al crear el combo'}), 500

        combo_creado = response.data[0]
        combo_id = combo_creado['combo_id']

        # Agregar productos al combo
        if productos_combo:
            productos_insertados = []
            for producto in productos_combo:
                if 'producto_id' not in producto or 'cantidad' not in producto:
                    continue

                producto_data = {
                    'combo_id': combo_id,
                    'producto_id': producto['producto_id'],
                    'cantidad': producto['cantidad']
                }
                productos_insertados.append(producto_data)

            if productos_insertados:
                supabase.table('combo_productos').insert(productos_insertados).execute()

        # Retornar el combo completo con sus productos
        combo_completo = obtener_combo(combo_id)
        return combo_completo

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =========================
# Endpoint: Actualizar combo
# =========================
@combo_bp.route('/combo/<int:combo_id>', methods=['PUT'])
@supabase_token_required
def actualizar_combo(combo_id):
    data = limpiar_vacios(request.get_json() or {})

    if not data:
        return jsonify({'error': 'No se enviaron datos para actualizar'}), 400

    # Extraer productos del combo si vienen
    productos_combo = data.pop('productos', None)

    # Eliminar campos que no deben actualizarse
    data.pop('combo_id', None)
    data.pop('created_at', None)

    try:
        # Actualizar el combo
        if data:
            response = supabase.table('combos').update(data).eq('combo_id', combo_id).execute()
            if not response.data:
                return jsonify({'error': 'Combo no encontrado'}), 404

        # Si se enviaron productos, actualizar la relación
        if productos_combo is not None:
            # Eliminar productos existentes del combo
            supabase.table('combo_productos').delete().eq('combo_id', combo_id).execute()

            # Insertar nuevos productos
            if productos_combo:
                productos_insertados = []
                for producto in productos_combo:
                    if 'producto_id' not in producto or 'cantidad' not in producto:
                        continue

                    producto_data = {
                        'combo_id': combo_id,
                        'producto_id': producto['producto_id'],
                        'cantidad': producto['cantidad']
                    }
                    productos_insertados.append(producto_data)

                if productos_insertados:
                    supabase.table('combo_productos').insert(productos_insertados).execute()

        # Retornar el combo actualizado con sus productos
        combo_completo = obtener_combo(combo_id)
        return combo_completo

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =========================
# Endpoint: Eliminar combo
# =========================
@combo_bp.route('/combo/<int:combo_id>', methods=['DELETE'])
@supabase_token_required
def eliminar_combo(combo_id):
    try:
        # Primero eliminamos los productos del combo (por cascade debería hacerlo automático)
        supabase.table('combo_productos').delete().eq('combo_id', combo_id).execute()

        # Luego eliminamos el combo
        response = supabase.table('combos').delete().eq('combo_id', combo_id).execute()

        if response.data:
            return jsonify({'message': 'Combo eliminado correctamente'}), 200
        else:
            return jsonify({'error': 'Combo no encontrado'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =========================
# Endpoint: Agregar producto a combo
# =========================
@combo_bp.route('/combo/<int:combo_id>/producto', methods=['POST'])
@supabase_token_required
def agregar_producto_a_combo(combo_id):
    data = request.get_json()

    if 'producto_id' not in data or 'cantidad' not in data:
        return jsonify({'error': 'Se requiere producto_id y cantidad'}), 400

    try:
        producto_data = {
            'combo_id': combo_id,
            'producto_id': data['producto_id'],
            'cantidad': data['cantidad']
        }

        response = supabase.table('combo_productos').insert(producto_data).execute()

        if response.data:
            return jsonify(response.data[0]), 201
        else:
            return jsonify({'error': 'Error al agregar producto al combo'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =========================
# Endpoint: Eliminar producto de combo
# =========================
@combo_bp.route('/combo/<int:combo_id>/producto/<int:producto_id>', methods=['DELETE'])
@supabase_token_required
def eliminar_producto_de_combo(combo_id, producto_id):
    try:
        response = supabase.table('combo_productos').delete().eq('combo_id', combo_id).eq('producto_id', producto_id).execute()

        if response.data:
            return jsonify({'message': 'Producto eliminado del combo correctamente'}), 200
        else:
            return jsonify({'error': 'Relación no encontrada'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
