from flask import Flask, jsonify
# Blueprints para las diferentes rutas, su funcion es organizar el codigo en modulos
from routes.admin import admin_bp
from routes.productos import producto_bp
from routes.categoria import categoria_bp
from routes.producto_imagenes import producto_imagenes_bp
from routes.combos import combo_bp
from routes.ofertas import oferta_bp
from routes.banners import banner_bp
# Importar CORS para manejar las politicas de seguridad
from flask_cors import CORS
# Importar os para manejar variables de entorno
import os
# Importar dotenv para cargar variables de entorno desde un archivo .env
from dotenv import load_dotenv
# Cargar variables de entorno desde .env
load_dotenv()  

app = Flask(__name__)

# Configurar la llave secreta de Flask desde una variable de entorno
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'supersecretkey')

# Registrar los blueprints (sin prefijos para que las rutas funcionen correctamente)
app.register_blueprint(admin_bp)
app.register_blueprint(producto_bp)
app.register_blueprint(categoria_bp)
app.register_blueprint(producto_imagenes_bp)
app.register_blueprint(combo_bp)
app.register_blueprint(oferta_bp)
app.register_blueprint(banner_bp)

# Configurar CORS para permitir solicitudes desde el frontend
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

#Ruta raiz para verificar que el servidor este corriendo
@app.route('/')
def home():
    return "API de E-commerce Electro está corriendo"

#Ruta para diagnosticar CORS
@app.route('/test-cors')
def test_cors():
    return "CORS está funcionando"

# Manejador global para peticiones OPTIONS (CORS preflight)
@app.before_request
def handle_preflight():
    from flask import request
    if request.method == "OPTIONS":
        from flask import make_response
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
        return response

# =========================
# Manejo de errores global
# =========================
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Recurso no encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Error interno del servidor'}), 500

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Método no permitido'}), 405

if __name__ == '__main__':
    app.run(debug=True)