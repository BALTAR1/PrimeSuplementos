from flask import Blueprint, jsonify, request
from supabase_client import supabase

producto_sabores_bp = Blueprint('producto_sabores', __name__)


@producto_sabores_bp.route('/producto/<int:producto_id>/sabores', methods=['GET'])
def listar_sabores(producto_id):
    try:
        response = (
            supabase.table('producto_sabores')
            .select('sabor_id, producto_id, nombre')
            .eq('producto_id', producto_id)
            .order('nombre')
            .execute()
        )
        return jsonify(response.data), 200
    except Exception as error:
        return jsonify({'error': str(error)}), 500


@producto_sabores_bp.route('/producto/<int:producto_id>/sabores', methods=['PUT'])
def reemplazar_sabores(producto_id):
    data = request.get_json() or {}
    nombres = data.get('sabores', [])

    if not isinstance(nombres, list):
        return jsonify({'error': 'sabores debe ser una lista'}), 400

    sabores = []
    vistos = set()
    for nombre in nombres:
        nombre_normalizado = str(nombre).strip()
        clave = nombre_normalizado.casefold()
        if not nombre_normalizado or clave in vistos:
            continue
        vistos.add(clave)
        sabores.append({'producto_id': producto_id, 'nombre': nombre_normalizado})

    try:
        supabase.table('producto_sabores').delete().eq('producto_id', producto_id).execute()
        if sabores:
            response = supabase.table('producto_sabores').insert(sabores).execute()
            return jsonify(response.data), 200
        return jsonify([]), 200
    except Exception as error:
        return jsonify({'error': str(error)}), 500
