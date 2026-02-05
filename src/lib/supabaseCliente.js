import { createClient } from '@supabase/supabase-js';

// Obtiene las variables de entorno del proyecto para la conexión
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Validación de variables de entorno
if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error('Variables de entorno de Supabase requeridas: PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY');
}

// Crea y exporta una instancia del cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		// Guarda la sesión del usuario en el navegador
		persistSession: true,
		// Refresca el token automáticamente cuando expira
		autoRefreshToken: true,
		// Detecta la sesión en la URL después de autenticación externa
		detectSessionInUrl: true,
	},
	global: {
		headers: {
			// Timeout más largo para consultas pesadas
			'x-client-info': 'supabase-js-web',
		},
	},
	db: {
		schema: 'public',
	},
	// Configuración de realtime y fetching
	realtime: {
		params: {
			eventsPerSecond: 2,
		},
	},
});