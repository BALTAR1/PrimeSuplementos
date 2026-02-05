#!/usr/bin/env python3
"""
Script de prueba para los endpoints del backend
Ejecutar con: python test_api.py
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:5000"
TOKEN = ""  # Agregar token de autenticación si es necesario

# Headers
headers = {
    "Content-Type": "application/json"
}

if TOKEN:
    headers["Authorization"] = f"Bearer {TOKEN}"

def print_response(response, title=""):
    """Imprime la respuesta de forma bonita"""
    print(f"\n{'=' * 60}")
    print(f"🔍 {title}")
    print(f"{'=' * 60}")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except:
        print(f"Response: {response.text}")
    print(f"{'=' * 60}\n")

def test_categorias():
    """Prueba endpoints de categorías"""
    print("\n" + "🔷" * 30)
    print("TESTING CATEGORÍAS")
    print("🔷" * 30)
    
    # 1. Crear categoría
    categoria_data = {
        "nombre": f"Categoría Test {datetime.now().strftime('%H%M%S')}",
        "descripcion": "Categoría de prueba creada automáticamente",
        "activo": True
    }
    response = requests.post(f"{BASE_URL}/categorias", json=categoria_data, headers=headers)
    print_response(response, "POST /categorias - Crear categoría")
    
    if response.status_code == 201:
        categoria_id = response.json().get('categoria_id')
        
        # 2. Obtener categoría por ID
        response = requests.get(f"{BASE_URL}/categorias/{categoria_id}", headers=headers)
        print_response(response, f"GET /categorias/{categoria_id} - Obtener categoría")
        
        # 3. Actualizar categoría
        update_data = {
            "descripcion": "Descripción actualizada",
            "activo": False
        }
        response = requests.put(f"{BASE_URL}/categorias/{categoria_id}", json=update_data, headers=headers)
        print_response(response, f"PUT /categorias/{categoria_id} - Actualizar categoría")
    
    # 4. Listar todas las categorías
    response = requests.get(f"{BASE_URL}/categorias", headers=headers)
    print_response(response, "GET /categorias - Listar todas")

def test_productos():
    """Prueba endpoints de productos"""
    print("\n" + "📦" * 30)
    print("TESTING PRODUCTOS")
    print("📦" * 30)
    
    # 1. Crear producto
    producto_data = {
        "nombre": f"Producto Test {datetime.now().strftime('%H%M%S')}",
        "marca": "Marca Test",
        "modelo": "Modelo-001",
        "descripcion": "Producto de prueba con marca y modelo",
        "precio": 299.99,
        "sku": f"TEST-SKU-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "stock": 50,
        "categoria_id": 1,  # Asegúrate de que existe una categoría con ID 1
        "imagen_url": "https://via.placeholder.com/300",
        "peso_kg": 1.5,
        "activo": True
    }
    response = requests.post(f"{BASE_URL}/producto", json=producto_data, headers=headers)
    print_response(response, "POST /producto - Crear producto")
    
    if response.status_code == 201:
        producto_id = response.json().get('producto_id')
        
        # 2. Obtener producto por ID
        response = requests.get(f"{BASE_URL}/producto/{producto_id}", headers=headers)
        print_response(response, f"GET /producto/{producto_id} - Obtener producto")
        
        # 3. Actualizar producto
        update_data = {
            "precio": 349.99,
            "stock": 45,
            "descripcion": "Descripción actualizada del producto"
        }
        response = requests.put(f"{BASE_URL}/producto/{producto_id}", json=update_data, headers=headers)
        print_response(response, f"PUT /producto/{producto_id} - Actualizar producto")
        
        # 4. Agregar imágenes al producto
        test_imagenes(producto_id)
    
    # 5. Listar productos
    response = requests.get(f"{BASE_URL}/productos", headers=headers)
    print_response(response, "GET /productos - Listar todos")
    
    # 6. Filtrar por marca
    response = requests.get(f"{BASE_URL}/productos?marca=Test", headers=headers)
    print_response(response, "GET /productos?marca=Test - Filtrar por marca")
    
    # 7. Filtrar por modelo
    response = requests.get(f"{BASE_URL}/productos?modelo=001", headers=headers)
    print_response(response, "GET /productos?modelo=001 - Filtrar por modelo")

def test_imagenes(producto_id):
    """Prueba endpoints de imágenes de productos"""
    print("\n" + "🖼️ " * 30)
    print(f"TESTING IMÁGENES DEL PRODUCTO {producto_id}")
    print("🖼️ " * 30)
    
    # 1. Agregar primera imagen
    imagen_data_1 = {
        "url": "https://via.placeholder.com/300/FF0000/FFFFFF?text=Imagen+1",
        "descripcion": "Vista frontal"
    }
    response = requests.post(f"{BASE_URL}/producto/{producto_id}/imagenes", json=imagen_data_1, headers=headers)
    print_response(response, f"POST /producto/{producto_id}/imagenes - Agregar imagen 1")
    
    imagen_id_1 = None
    if response.status_code == 201:
        imagen_id_1 = response.json().get('imagen_id')
    
    # 2. Agregar segunda imagen
    imagen_data_2 = {
        "url": "https://via.placeholder.com/300/00FF00/FFFFFF?text=Imagen+2",
        "descripcion": "Vista lateral"
    }
    response = requests.post(f"{BASE_URL}/producto/{producto_id}/imagenes", json=imagen_data_2, headers=headers)
    print_response(response, f"POST /producto/{producto_id}/imagenes - Agregar imagen 2")
    
    # 3. Obtener todas las imágenes del producto
    response = requests.get(f"{BASE_URL}/producto/{producto_id}/imagenes", headers=headers)
    print_response(response, f"GET /producto/{producto_id}/imagenes - Listar imágenes")
    
    # 4. Actualizar imagen
    if imagen_id_1:
        update_data = {
            "descripcion": "Vista frontal actualizada",
            "url": "https://via.placeholder.com/300/0000FF/FFFFFF?text=Actualizada"
        }
        response = requests.put(f"{BASE_URL}/producto/imagenes/{imagen_id_1}", json=update_data, headers=headers)
        print_response(response, f"PUT /producto/imagenes/{imagen_id_1} - Actualizar imagen")

def test_filtros_avanzados():
    """Prueba filtros avanzados de productos"""
    print("\n" + "🔍" * 30)
    print("TESTING FILTROS AVANZADOS")
    print("🔍" * 30)
    
    # Filtro por rango de precios
    response = requests.get(f"{BASE_URL}/productos?precio_min=100&precio_max=500", headers=headers)
    print_response(response, "GET /productos?precio_min=100&precio_max=500")
    
    # Filtro por categoría
    response = requests.get(f"{BASE_URL}/productos?categoria_id=1", headers=headers)
    print_response(response, "GET /productos?categoria_id=1")
    
    # Paginación
    response = requests.get(f"{BASE_URL}/productos?limit=5&offset=0", headers=headers)
    print_response(response, "GET /productos?limit=5&offset=0 - Primera página")
    
    # Ordenamiento
    response = requests.get(f"{BASE_URL}/productos?sort_by=precio&order=desc", headers=headers)
    print_response(response, "GET /productos?sort_by=precio&order=desc")

def test_validaciones():
    """Prueba validaciones de datos"""
    print("\n" + "⚠️ " * 30)
    print("TESTING VALIDACIONES")
    print("⚠️ " * 30)
    
    # Producto sin marca (debe fallar)
    producto_invalido = {
        "nombre": "Producto sin marca",
        "descripcion": "Este producto no tiene marca",
        "precio": 100,
        "sku": "SKU-SIN-MARCA",
        "stock": 10,
        "categoria_id": 1,
        "imagen_url": "https://via.placeholder.com/300",
        "activo": True
    }
    response = requests.post(f"{BASE_URL}/producto", json=producto_invalido, headers=headers)
    print_response(response, "POST /producto - Producto sin marca (debe fallar)")
    
    # Producto con precio negativo (debe fallar)
    producto_precio_invalido = {
        "nombre": "Producto con precio negativo",
        "marca": "Test",
        "descripcion": "Este producto tiene precio negativo",
        "precio": -100,
        "sku": "SKU-PRECIO-NEG",
        "stock": 10,
        "categoria_id": 1,
        "imagen_url": "https://via.placeholder.com/300",
        "activo": True
    }
    response = requests.post(f"{BASE_URL}/producto", json=producto_precio_invalido, headers=headers)
    print_response(response, "POST /producto - Precio negativo (debe fallar)")

def main():
    """Función principal"""
    print("\n")
    print("=" * 80)
    print("🚀 INICIANDO PRUEBAS DE API - MUNDO PANIAL")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    try:
        # Verificar que el servidor está corriendo
        response = requests.get(BASE_URL)
        if response.status_code != 200:
            print("❌ El servidor no está respondiendo correctamente")
            return
        
        print("✅ Servidor está corriendo\n")
        
        # Ejecutar pruebas
        test_categorias()
        test_productos()
        test_filtros_avanzados()
        test_validaciones()
        
        print("\n")
        print("=" * 80)
        print("✅ TODAS LAS PRUEBAS COMPLETADAS")
        print("=" * 80)
        
    except requests.exceptions.ConnectionError:
        print(f"\n❌ ERROR: No se pudo conectar al servidor en {BASE_URL}")
        print("Asegúrate de que el servidor Flask está corriendo.")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")

if __name__ == "__main__":
    main()
