import os
# Importamos las librerías necesarias para interactuar con Supabase
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

#Obtenemos las variables de entorno para la conexión a Supabase
#usamos os para obtener las variables de entorno
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Creamos el cliente de Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)