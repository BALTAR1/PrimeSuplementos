// Importa el hook useState de React para manejar estados locales en el componente
import { useState } from "react";
// Importa la instancia de Supabase configurada para el proyecto
import { supabase } from "../../lib/supabaseCliente.js";

// Middleware para incluir el token JWT en las peticiones al backend
function withAuthHeaders(fetchFunction) {
  // Retorna una función que agrega el header Authorization si existe el token
  return async (url, options = {}) => {
    // Obtiene el token JWT guardado en localStorage
    const token = localStorage.getItem("supabase_token");
    // Si existe el token, lo agrega al header Authorization
    if (token) {
      options.headers = {
        ...(options.headers || {}), // Mantiene otros headers existentes
        Authorization: `Bearer ${token}`, // Agrega el token JWT
      };
    }
    // Ejecuta la función fetch original con los headers modificados
    return fetchFunction(url, options);
  };
}

// Crea una versión de fetch que incluye el token JWT automáticamente
const fetchWithAuth = withAuthHeaders(fetch);

// Componente principal de formulario de login y registro
export default function LoginForm() {

	// Estado para alternar entre login y registro ("login" | "register")
	const [mode, setMode] = useState("login");
	// Estado para el email del usuario
	const [email, setEmail] = useState("");
	// Estado para la contraseña del usuario
	const [password, setPassword] = useState("");
	// Estado para mostrar si está cargando (deshabilita el botón)
	const [loading, setLoading] = useState(false);
	// Estado para mostrar mensajes de error o éxito
	const [mensaje, setMensaje] = useState("");

	// Función que maneja el envío del formulario
	async function handleSubmit(e) {
    // Previene el comportamiento por defecto del formulario (evita recarga)
		e.preventDefault();
    // Limpia estados y muestra loading
		setLoading(true);
		setMensaje("");
		try {
			if (mode === "login") {
				// Inicia sesión con Supabase usando email y password
				const { data, error } = await supabase.auth.signInWithPassword({ email, password });
				
				if (error) {
					throw error; // Lanza el error para ser capturado abajo
				}
				
				// Si el login fue exitoso, guarda el token JWT en localStorage
				if (data && data.session && data.session.access_token) {
					localStorage.setItem("supabase_token", data.session.access_token);
				}
				// Redirige al usuario al dashboard
				window.location.href = "/dashboard";
			} else {
				// Registra un nuevo usuario en Supabase
				const { error } = await supabase.auth.signUp({ email, password });
				if (error) {
					throw error;
				}
				setMensaje("Revisa tu correo para verificar la cuenta.");
			}
		} catch (err) {
			// Captura y muestra cualquier error ocurrido en login o registro
			setMensaje(err.message || "Ocurrió un error");
		} finally {
			// Finaliza el proceso y quita el estado de loading
			setLoading(false);
		}
	}

	// Renderiza el formulario de login/registro
	return (
		<div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm bg-white/70 shadow-xl rounded-2xl px-3 py-4 sm:px-5 sm:py-6 mx-auto backdrop-blur-md border border-[#e0f2fe]/60">
			<form onSubmit={handleSubmit} className="w-full space-y-4 sm:space-y-6">
				{/* Campo de email */}
				<div className="relative">
					<span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7be3f7]">
						<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l9 6 9-6" /><rect x="3" y="6" width="18" height="12" rx="2" strokeWidth="1.5" /></svg>
					</span>
					<input
						className="w-full border border-[#b6f0fa] rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#7be3f7] bg-[#fafdff] text-gray-900 placeholder-gray-400 text-base transition shadow-sm"
						type="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)} // Actualiza el estado email
						placeholder="Correo electrónico"
						autoComplete="username"
					/>
				</div>
				{/* Campo de contraseña */}
				<div className="relative">
					<span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#f7b6d2]">
						<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="6" y="10" width="12" height="8" rx="2" strokeWidth="1.5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14v2" /><circle cx="12" cy="13" r="1" /></svg>
					</span>
					<input
						className="w-full border border-[#f7b6d2] rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#f7b6d2] bg-[#fdf6fa] text-gray-900 placeholder-gray-400 text-base transition shadow-sm"
						type="password"
						minLength={6}
						required
						value={password}
						onChange={(e) => setPassword(e.target.value)} // Actualiza el estado password
						placeholder="Contraseña"
						autoComplete="current-password"
					/>
				</div>
				{/* Mensaje de error o éxito */}
				{mensaje && <p className="text-sm text-red-600 text-center font-medium px-2">{mensaje}</p>}
				{/* Botón principal: login o registro */}
							<button
								type="submit"
								disabled={loading}
								className="w-full btn-responsive rounded-lg bg-[#2563eb] text-white font-bold text-base shadow-md hover:scale-105 hover:shadow-xl transition disabled:opacity-60 tracking-widest touch-target py-2.5"
							>
								{loading ? "Procesando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
							</button>
				{/* Enlace de recuperación de contraseña */}
							<div className="text-center mt-2">
								<a href="#" className="text-sm text-[#2563eb] hover:underline font-medium touch-target px-2 py-1 transition-colors">¿Olvidaste tu contraseña?</a>
							</div>
				
				{/* Botón para cambiar entre login y registro */}
				<div className="text-center mt-4 pt-4 border-t border-gray-200">
					<button
						type="button"
						onClick={() => setMode(mode === "login" ? "register" : "login")}
						className="text-sm text-[#5c4033] hover:text-orange-600 font-medium transition-colors"
					>
						{mode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
					</button>
				</div>
					
			</form>
		</div>
	);
}
