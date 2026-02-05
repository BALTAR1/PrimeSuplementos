// Importa los 'hooks' useState y useEffect desde React.
// useState se usa para manejar el estado dentro de los componentes (datos, carga, errores).
// useEffect permite ejecutar código con efectos secundarios (como llamadas a una API) cuando el componente se monta o actualiza.
import { useState, useEffect } from 'react';

// Define la URL base del servidor de la API desde las variables de entorno.
// Esto facilita cambiar entre desarrollo y producción sin modificar el código.
const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Función centralizada para realizar peticiones HTTP a la API.
 * Automáticamente incluye el token de autenticación si existe.
 * @param {string} endpoint - La ruta de la API a la que se quiere llamar (ej. '/productos').
 * @param {object} options - Opciones adicionales para la petición fetch (como method, body, etc.).
 * @returns {Promise<any>} - Una promesa que se resuelve con los datos de la respuesta en formato JSON.
 * @throws {Error} - Lanza un error si la respuesta de la red no es exitosa (ej. status 404, 500).
 */
async function fetchWithAuth(endpoint, options = {}) {
    // Obtiene el token de autenticación guardado en el localStorage del navegador.
    const token = localStorage.getItem('supabase_token');
    
    // Construye el objeto de configuración para la petición 'fetch'.
    const config = {
        ...options, // Copia todas las opciones pasadas a la función (como method, body).
        headers: {
            // Establece el tipo de contenido que se envía a la API como JSON.
            'Content-Type': 'application/json',
            // Si existe un token, añade el encabezado 'Authorization' con el formato 'Bearer'.
            // Esto es un estándar para enviar tokens de autenticación.
            ...(token && { Authorization: `Bearer ${token}` }),
            // Permite sobrescribir o añadir cabeceras personalizadas desde las 'options'.
            ...options.headers,
        },
    };

    // Realiza la petición HTTP usando la API 'fetch' del navegador.
    // Combina la URL base con el endpoint específico.
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Verifica si la respuesta de la petición fue exitosa (status en el rango 200-299).
    if (!response.ok) {
        // Si la respuesta no es 'ok', intenta leer el cuerpo del error como JSON.
        // Si falla (ej. el cuerpo está vacío), crea un objeto de error genérico.
        const error = await response.json().catch(() => ({ error: 'Error en la petición' }));
        // Lanza un nuevo error con el mensaje del servidor o un mensaje genérico.
        // Esto detiene la ejecución y permite que el bloque 'catch' que llamó a esta función lo maneje.
        throw new Error(error.error || error.message || 'Error en la petición');
    }

    // Si la respuesta es exitosa, convierte el cuerpo de la respuesta a JSON y lo retorna.
    return response.json();
}

/**
 * Hook personalizado de React para simplificar la obtención de datos (fetching).
 * Maneja automáticamente los estados de carga, error y los datos obtenidos.
 * @param {string} endpoint - El endpoint de la API del cual obtener los datos.
 * @param {Array} dependencies - Un array de dependencias para el hook useEffect. La petición se volverá a hacer si alguna de estas dependencias cambia.
 * @returns {{data: any, loading: boolean, error: string|null, refetch: function}} - Un objeto con el estado de la petición.
 */
export function useFetch(endpoint, dependencies = []) {
    // Define el estado para almacenar los datos recibidos de la API.
    const [data, setData] = useState(null);
    // Define el estado para saber si la petición está en curso.
    const [loading, setLoading] = useState(true);
    // Define el estado para almacenar cualquier error que ocurra.
    const [error, setError] = useState(null);

    // useEffect se ejecuta después de que el componente se renderiza.
    // El código dentro se ejecutará cuando el componente se monte y cada vez que una de las 'dependencies' cambie.
    useEffect(() => {
        // Variable de control para evitar actualizar el estado si el componente se desmonta mientras la petición está en curso.
        let isMounted = true;

        // Define una función asíncrona para realizar la petición.
        async function fetchData() {
            try {
                // Inicia el estado de carga y limpia cualquier error anterior.
                setLoading(true);
                setError(null);
                // Llama a la función de fetch para obtener los datos.
                const result = await fetchWithAuth(endpoint);
                // Si el componente sigue montado después de recibir la respuesta...
                if (isMounted) {
                    // ...actualiza el estado con los datos recibidos.
                    setData(result);
                }
            } catch (err) {
                // Si ocurre un error durante la petición y el componente sigue montado...
                if (isMounted) {
                    // ...actualiza el estado de error con el mensaje del error.
                    setError(err.message);
                }
            } finally {
                // Este bloque se ejecuta siempre, tanto si hubo éxito como si hubo error.
                // Si el componente sigue montado...
                if (isMounted) {
                    // ...desactiva el estado de carga.
                    setLoading(false);
                }
            }
        }

        // Llama a la función para que se ejecute.
        fetchData();

        // Esta es la función de "limpieza" de useEffect.
        // Se ejecuta cuando el componente se va a desmontar o antes de que el efecto se vuelva a ejecutar.
        return () => {
            // Marca el componente como desmontado para evitar actualizaciones de estado innecesarias.
            isMounted = false;
        };
    }, dependencies); // El array de dependencias. Si está vacío `[]`, el efecto se ejecuta solo una vez.

    // Retorna el estado actual de la petición para que el componente pueda usarlo.
    // Incluye una función 'refetch' que puede ser usada para volver a pedir los datos.
    return { data, loading, error, refetch: () => setData(null) };
}

/**
 * Objeto 'api' que exporta métodos simplificados para las operaciones HTTP comunes (GET, POST, PUT, DELETE).
 * Esto abstrae la lógica de 'fetchWithAuth' para que sea más fácil de usar en el resto de la aplicación.
 */
export const api = {
    // Define el método GET. Solo necesita el endpoint.
    get: (endpoint) => fetchWithAuth(endpoint, { method: 'GET' }),
    
    // Define el método POST. Recibe el endpoint y los datos a enviar.
    post: (endpoint, data) => fetchWithAuth(endpoint, {
        method: 'POST',
        // Convierte el objeto de datos de JavaScript a una cadena de texto en formato JSON.
        body: JSON.stringify(data),
    }),
    
    // Define el método PUT. Similar a POST, se usa para actualizar datos existentes.
    put: (endpoint, data) => fetchWithAuth(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    
    // Define el método DELETE. Solo necesita el endpoint del recurso a eliminar.
    delete: (endpoint) => fetchWithAuth(endpoint, { method: 'DELETE' }),
};