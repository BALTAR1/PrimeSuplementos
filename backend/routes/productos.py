#Con esto importamos lo necesario para crear rutas en Flask
from flask import Blueprint, request, jsonify
from supabase_client import supabase
# Importamos el decorador para proteger las rutas
from routes.admin import supabase_token_required

# Creamos el blueprint para las rutas de productos
producto_bp = Blueprint('producto', __name__)

# =========================
# Endpoint: Obtener producto por Id
# =========================
@producto_bp.route('/producto/<int:producto_id>', methods=['GET'])
def obtener_productos(producto_id):
    try:
        #Obtenemos el producto por su id con todos sus campos
        response = supabase.table('productos').select('*').eq('producto_id', producto_id).execute()
        if response.data:
            return jsonify(response.data[0]), 200
        else:
            return jsonify({'error': 'Producto no encontrado'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# =========================
# Endpoint: Actualizar producto por Id
# =========================
@producto_bp.route('/producto/<int:producto_id>', methods=['PUT'])
def actualizar_producto(producto_id):
    data = request.get_json()
    
    # Validar que se envió data
    if not data:
        return jsonify({'error': 'No se enviaron datos para actualizar'}), 400
    
    # Opcional: eliminar campos que no deben actualizarse
    data.pop('producto_id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)
    
    try:
        response = supabase.table('productos').update(data).eq('producto_id', producto_id).execute()
        if response.data:
            return jsonify(response.data[0]), 200
        else:
            return jsonify({'error': 'Producto no encontrado'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# =========================
# Endpoint: Eliminar producto por Id (hard delete)
# =========================
@producto_bp.route('/producto/<int:producto_id>', methods=['DELETE'])
def eliminar_producto(producto_id):
    try: 
        # Hard delete: elimina completamente el producto y sus imágenes asociadas
        # Intentamos eliminar las imágenes asociadas (si la tabla existe)
        try:
            supabase.table('producto_imagenes').delete().eq('producto_id', producto_id).execute()
        except Exception as img_error:
            # Si falla por tabla no existente, continuamos
            print(f'Advertencia al eliminar imágenes: {img_error}')
        
        # Luego eliminamos el producto
        response = supabase.table('productos').delete().eq('producto_id', producto_id).execute()
        if response.data:
            return jsonify({'message': 'Producto eliminado correctamente'}), 200
        else:
            return jsonify({'error': 'Producto no encontrado'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================
# Endpoint: Crear producto
# =========================
@producto_bp.route('/producto', methods=['POST'])
def crear_producto():
    data = request.get_json()

    required_fields = [
        'nombre',
        'descripcion',
        'precio',
        'stock',
        'imagen_url'
    ]

    # Validar presencia de campos obligatorios
    for i in required_fields:
        if i not in data:
            return jsonify({'error': f'El campo {i} es obligatorio'}), 400

    # Validaciones específicas
    if not isinstance(data['nombre'], str) or not data['nombre'].strip():
        return jsonify({'error': 'El nombre debe ser un texto no vacío'}), 400
    if not isinstance(data['descripcion'], str) or not data['descripcion'].strip():
        return jsonify({'error': 'La descripción debe ser un texto no vacío'}), 400
    try:
        precio = float(data['precio'])
    except (ValueError, TypeError):
        return jsonify({'error': 'El precio debe ser un número válido'}), 400
    try:
        stock = int(data['stock'])
    except (ValueError, TypeError):
        return jsonify({'error': 'El stock debe ser un número entero válido'}), 400
    if not isinstance(data['imagen_url'], str) or not data['imagen_url'].strip():
        return jsonify({'error': 'La imagen_url es obligatoria'}), 400

    # Construir objeto solo con los campos reales
    producto = {
        'nombre': data['nombre'],
        'descripcion': data['descripcion'],
        'precio': precio,
        'stock': stock,
        'imagen_url': data['imagen_url']
    }
    if data.get('categoria_id'):
        producto['categoria_id'] = data['categoria_id']
    if data.get('marca_id'):
        producto['marca_id'] = data['marca_id']

    try:
        response = supabase.table('productos').insert(producto).execute()
        if response.data:
            # Retorna el producto creado con su ID
            return jsonify(response.data[0]), 201
        else:
            return jsonify({'error': 'Error al crear el producto'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# =========================
# Endpoint: Filtrar productos
# =========================
@producto_bp.route('/productos', methods=['GET'])
def filtrar_productos():
    try:
        query = supabase.table('productos').select('*')
        args = request.args

        # Filtros dinámicos
        if 'nombre' in args:
            query = query.ilike('nombre', f"%{args['nombre']}%")
        if 'categoria_id' in args:
            query = query.eq('categoria_id', args['categoria_id'])
        if 'precio_min' in args:
            query = query.gte('precio', args['precio_min'])
        if 'precio_max' in args:
            query = query.lte('precio', args['precio_max'])
        if 'es_destacado' in args:
            query = query.eq('es_destacado', args['es_destacado'].lower() == 'true')

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
        if 'sort_by' in args:
            order = args.get('order', 'asc')
            query = query.order(args['sort_by'], desc=(order == 'desc'))

        response = query.execute()

        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =========================
# Endpoint: Obtener productos destacados
# =========================
@producto_bp.route('/productos/destacados', methods=['GET'])
def obtener_productos_destacados():
    try:
        query = supabase.table('productos').select('*').eq('es_destacado', True).eq('activo', True)
        
        # Limitar a 8 productos destacados
        limit = int(request.args.get('limit', 8))
        query = query.limit(limit)
        
        response = query.execute()
        return jsonify(response.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500