// Importa los hooks de React para manejar estado y efectos secundarios
import { useState, useEffect } from 'react';
// Importa el componente visual para mostrar cada combo
import ComboCard from './ComboCard.jsx';
// Importa el componente de paginación reutilizable
import Pagination from '../productos/Pagination.jsx';
// Importa el servicio que obtiene combos públicos desde la API
import { combosPublicosService } from '../../services/productosPublicos.js';

/**
 * Componente principal del catálogo de combos
 * Gestiona el estado de paginación y carga de datos de combos
 */
export default function CatalogoCombos() {
    // Estado para almacenar los combos obtenidos
    const [combos, setCombos] = useState([]);
    // Estado para saber si está cargando los datos
    const [loading, setLoading] = useState(true);
    // Estado para mostrar errores en la carga
    const [error, setError] = useState(null);
    
    // Estado para la paginación (página actual, total de páginas, total de combos, combos por página)
    const [paginacion, setPaginacion] = useState({
        paginaActual: 1, // Página actual
        totalPaginas: 1, // Total de páginas
        total: 0,        // Total de combos
        porPagina: 16    // Combos por página (4 columnas x 4 filas)
    });

    // useEffect: carga combos cada vez que cambia la página actual
    useEffect(() => {
        cargarCombos(); // Llama a la función para cargar combos
    }, [paginacion.paginaActual]); // Solo cuando cambia la página

    // Función asíncrona para cargar combos desde el servicio
    const cargarCombos = async () => {
        try {
            setLoading(true); // Muestra spinner de carga
            setError(null);   // Limpia errores anteriores

            // Llama al servicio para obtener combos activos y paginados
            const resultado = await combosPublicosService.obtenerActivos({
                pagina: paginacion.paginaActual,
                porPagina: paginacion.porPagina
            });
            
            // Actualiza el estado con los combos obtenidos
            setCombos(resultado.combos);
            // Actualiza la paginación con los datos recibidos
            setPaginacion(prev => ({
                ...prev,
                totalPaginas: resultado.paginas,
                total: resultado.total
            }));
        } catch (err) {
            // Si ocurre un error, lo muestra en pantalla
            setError('Error al cargar los combos. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false); // Oculta el spinner de carga
        }
    };

    // Función para cambiar la página actual (usada por el componente Pagination)
    const handleCambioPagina = (nuevaPagina) => {
        setPaginacion(prev => ({ ...prev, paginaActual: nuevaPagina }));
    };

    // Renderiza el catálogo de combos
    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header con resultados y título */}
            <div className="mb-8">
                <h1 className="text-4xl font-black text-gray-900 mb-2 flex items-center gap-3">
                    <span>🎁</span>
                    <span>Combos Especiales</span>
                </h1>
                <p className="text-gray-600 text-lg mb-4">
                    Descubrí nuestros packs promocionales con ofertas imprescindibles
                </p>
                <div className="flex justify-between items-center">
                    <p className="text-gray-700 font-semibold">
                        {loading 
                            ? 'Cargando combos...' 
                            : `${paginacion.total} ${paginacion.total === 1 ? 'combo disponible' : 'combos disponibles'}`
                        }
                    </p>
                </div>
            </div>

            {/* Muestra error si existe */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Spinner de carga */}
            {loading && (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
            )}

            {/* Grid de combos */}
            {!loading && !error && (
                <>
                    {combos.length > 0 ? (
                        <>
                            {/* Muestra los combos en un grid responsivo */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {combos.map((combo) => (
                                    <ComboCard 
                                        key={combo.combo_id} 
                                        combo={combo} 
                                    />
                                ))}
                            </div>

                            {/* Componente de paginación */}
                            <Pagination
                                paginaActual={paginacion.paginaActual}
                                totalPaginas={paginacion.totalPaginas}
                                onCambioPagina={handleCambioPagina}
                            />
                        </>
                    ) : (
                        // Si no hay combos, muestra mensaje amigable
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🎁</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                No hay combos disponibles
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Vuelve pronto para ver nuestras promociones especiales
                            </p>
                            <a
                                href="/productos"
                                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Ver todos los productos
                            </a>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
