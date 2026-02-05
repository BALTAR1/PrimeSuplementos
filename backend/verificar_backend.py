#!/usr/bin/env python3
"""
Script rápido para verificar que el backend está funcionando correctamente.
Ejecutar desde el directorio backend: python verificar_backend.py
"""

import sys
import os

# Colores para la terminal
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_success(msg):
    print(f"{GREEN}✅ {msg}{RESET}")

def print_error(msg):
    print(f"{RED}❌ {msg}{RESET}")

def print_warning(msg):
    print(f"{YELLOW}⚠️  {msg}{RESET}")

def print_info(msg):
    print(f"{BLUE}ℹ️  {msg}{RESET}")

def verificar_variables_entorno():
    """Verifica que las variables de entorno estén configuradas"""
    print_info("Verificando variables de entorno...")
    
    from dotenv import load_dotenv
    load_dotenv()
    
    variables_requeridas = {
        'SUPABASE_URL': os.getenv('SUPABASE_URL'),
        'SUPABASE_KEY': os.getenv('SUPABASE_KEY'),
        'FLASK_SECRET_KEY': os.getenv('FLASK_SECRET_KEY'),
        'ADMIN_EMAIL': os.getenv('ADMIN_EMAIL')
    }
    
    todas_configuradas = True
    for nombre, valor in variables_requeridas.items():
        if not valor:
            print_error(f"{nombre} no está configurada")
            todas_configuradas = False
        else:
            print_success(f"{nombre} está configurada")
    
    return todas_configuradas

def verificar_dependencias():
    """Verifica que todas las dependencias estén instaladas"""
    print_info("\nVerificando dependencias...")
    
    dependencias = [
        'flask',
        'flask_cors',
        'supabase',
        'dotenv',
        'gunicorn',
        'requests'
    ]
    
    todas_instaladas = True
    for dep in dependencias:
        try:
            __import__(dep)
            print_success(f"{dep} está instalado")
        except ImportError:
            print_error(f"{dep} NO está instalado")
            todas_instaladas = False
    
    return todas_instaladas

def verificar_conexion_supabase():
    """Verifica la conexión a Supabase"""
    print_info("\nVerificando conexión a Supabase...")
    
    try:
        from supabase_client import supabase
        print_success("Cliente de Supabase creado correctamente")
        
        # Intentar una consulta simple
        try:
            response = supabase.table('categorias').select('categoria_id').limit(1).execute()
            print_success("Conexión a Supabase exitosa")
            print_info(f"   Tabla 'categorias' accesible")
            return True
        except Exception as e:
            print_error(f"Error al consultar Supabase: {str(e)}")
            print_warning("   Verifica que las tablas existan en tu base de datos")
            return False
            
    except Exception as e:
        print_error(f"Error al crear cliente de Supabase: {str(e)}")
        return False

def verificar_estructura_archivos():
    """Verifica que todos los archivos necesarios existan"""
    print_info("\nVerificando estructura de archivos...")
    
    archivos_requeridos = [
        'main.py',
        'supabase_client.py',
        'requirements.txt',
        '.env',
        'routes/admin.py',
        'routes/productos.py',
        'routes/categoria.py',
        'routes/producto_imagenes.py'
    ]
    
    todos_existen = True
    for archivo in archivos_requeridos:
        if os.path.exists(archivo):
            print_success(f"{archivo} existe")
        else:
            print_error(f"{archivo} NO existe")
            todos_existen = False
    
    return todos_existen

def verificar_importaciones():
    """Verifica que las importaciones funcionen correctamente"""
    print_info("\nVerificando importaciones de módulos...")
    
    try:
        from routes.admin import admin_bp
        print_success("routes.admin importado correctamente")
    except Exception as e:
        print_error(f"Error al importar routes.admin: {str(e)}")
        return False
    
    try:
        from routes.productos import producto_bp
        print_success("routes.productos importado correctamente")
    except Exception as e:
        print_error(f"Error al importar routes.productos: {str(e)}")
        return False
    
    try:
        from routes.categoria import categoria_bp
        print_success("routes.categoria importado correctamente")
    except Exception as e:
        print_error(f"Error al importar routes.categoria: {str(e)}")
        return False
    
    try:
        from routes.producto_imagenes import producto_imagenes_bp
        print_success("routes.producto_imagenes importado correctamente")
    except Exception as e:
        print_error(f"Error al importar routes.producto_imagenes: {str(e)}")
        return False
    
    return True

def main():
    print(f"\n{BLUE}{'='*50}")
    print("🔍 VERIFICACIÓN DEL BACKEND")
    print(f"{'='*50}{RESET}\n")
    
    # Lista de verificaciones
    verificaciones = [
        ("Variables de entorno", verificar_variables_entorno),
        ("Dependencias", verificar_dependencias),
        ("Estructura de archivos", verificar_estructura_archivos),
        ("Importaciones", verificar_importaciones),
        ("Conexión a Supabase", verificar_conexion_supabase)
    ]
    
    resultados = []
    for nombre, funcion in verificaciones:
        try:
            resultado = funcion()
            resultados.append((nombre, resultado))
        except Exception as e:
            print_error(f"Error en verificación de {nombre}: {str(e)}")
            resultados.append((nombre, False))
    
    # Resumen
    print(f"\n{BLUE}{'='*50}")
    print("📊 RESUMEN")
    print(f"{'='*50}{RESET}\n")
    
    total = len(resultados)
    exitosas = sum(1 for _, resultado in resultados if resultado)
    
    for nombre, resultado in resultados:
        if resultado:
            print_success(f"{nombre}: OK")
        else:
            print_error(f"{nombre}: FALLO")
    
    print(f"\n{BLUE}Total: {exitosas}/{total} verificaciones exitosas{RESET}\n")
    
    if exitosas == total:
        print_success("¡Todo está listo! Puedes iniciar el servidor con: python main.py")
        return 0
    else:
        print_warning("Hay algunos problemas que necesitas solucionar antes de iniciar el servidor")
        return 1

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}⚠️  Verificación interrumpida por el usuario{RESET}")
        sys.exit(1)
    except Exception as e:
        print_error(f"\nError inesperado: {str(e)}")
        sys.exit(1)
