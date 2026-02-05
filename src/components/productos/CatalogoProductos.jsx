import { useState, useEffect } from 'react';
import FilterSidebar from './FilterSidebar.jsx';
import ProductCard from './ProductCard.jsx';
import ComboCard from '../combos/ComboCard.jsx';
import Pagination from './Pagination.jsx';
import { productosPublicosService, categoriasPublicasService, combosPublicosService } from '../../services/productosPublicos.js';

/**
 * Componente principal del catálogo de productos
 * Gestiona el estado de filtros, paginación y carga de datos
 * 
 * @param {Object} props
 * @param {string|null} props.categoriaInicial - Nombre de la categoría inicial a filtrar
 * @param {string} props.busquedaInicial - Texto de búsqueda inicial
 * @param {boolean} props.soloOfertas - Si debe mostrar solo productos con ofertas
 */
export default function CatalogoProductos({ 
    categoriaInicial = null, 
    busquedaInicial = '', 
    soloOfertas = false 
}) {
    // Estados
    const [productos, setProductos] = useState([]);
    const [combos, setCombos] = useState([]);
    const [items, setItems] = useState([]); // Items mezclados (productos o combos)
    const [categorias, setCategorias] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [rangoPrecios, setRangoPrecios] = useState({ min: 0, max: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estados para modales mobile
    const [mostrarModalOrdenar, setMostrarModalOrdenar] = useState(false);
    const [mostrarModalFiltrar, setMostrarModalFiltrar] = useState(false);
    const [filtrosTemporales, setFiltrosTemporales] = useState(null); // Para mobile
    
    // Estado de paginación y filtros
    const [paginacion, setPaginacion] = useState({
        paginaActual: 1,
        totalPaginas: 1,
        total: 0,
        porPagina: 16 // 2 columnas x 8 filas en mobile, 4 columnas x 4 filas en desktop
    });
    
    const [filtros, setFiltros] = useState({
        busqueda: busquedaInicial || '',
        categoria_id: null,
        marca: null,
        precioMin: null,
        precioMax: null,
        ordenar: 'relevancia',
        ordenAsc: true,
        soloOfertas: soloOfertas,
        soloCombos: false
    });

    // Carga inicial de categorías, marcas y rango de precios
    useEffect(() => {
        const cargarDatosIniciales = async () => {
            try {
                const [cats, marcasData, rango] = await Promise.all([
                    categoriasPublicasService.obtenerTodas(),
                    categoriasPublicasService.obtenerMarcas(),
                    categoriasPublicasService.obtenerRangoPrecios()
                ]);
                
                setCategorias(cats);
                setMarcas(marcasData);
                setRangoPrecios(rango);

                // Si se especificó una categoría inicial, encontrarla y establecerla
                if (categoriaInicial && cats.length > 0) {
                    const categoriaEncontrada = cats.find(
                        cat => cat.nombre.toLowerCase() === categoriaInicial.toLowerCase()
                    );
                    if (categoriaEncontrada) {
                        // Priorizar filtro por categoria_id de la BD
                        setFiltros(prev => ({
                            ...prev,
                            categoria_id: categoriaEncontrada.categoria_id,
                            busqueda: '' // Limpiar búsqueda si se encontró categoría
                        }));
                    } else if (busquedaInicial) {
                        // Si no se encontró la categoría en BD, usar búsqueda por palabras clave
                        setFiltros(prev => ({
                            ...prev,
                            busqueda: busquedaInicial
                        }));
                    }
                } else if (busquedaInicial) {
                    // Si no hay categoría inicial pero sí búsqueda, aplicarla
                    setFiltros(prev => ({
                        ...prev,
                        busqueda: busquedaInicial
                    }));
                }
            } catch (err) {
                setError('Error al cargar categorías y precios');
            }
        };

        cargarDatosIniciales();
    }, [categoriaInicial, busquedaInicial]);

    // Carga de productos cuando cambian los filtros o la página
    useEffect(() => {
        cargarProductos();
    }, [filtros, paginacion.paginaActual]);

    // Función para cargar productos
    const cargarProductos = async () => {
        try {
            setLoading(true);
            setError(null);

            if (filtros.soloCombos) {
                // Cargar solo combos
                const resultadoCombos = await combosPublicosService.obtenerActivos({
                    pagina: paginacion.paginaActual,
                    porPagina: paginacion.porPagina
                });
                
                setCombos(resultadoCombos.combos);
                setItems(resultadoCombos.combos.map(c => ({ ...c, tipo: 'combo' })));
                setPaginacion(prev => ({
                    ...prev,
                    totalPaginas: resultadoCombos.paginas,
                    total: resultadoCombos.total
                }));
            } else {
                // Cargar productos normalmente
                const opciones = {
                    pagina: paginacion.paginaActual,
                    porPagina: paginacion.porPagina,
                    busqueda: filtros.busqueda,
                    categoria_id: filtros.categoria_id,
                    marca: filtros.marca,
                    precioMin: filtros.precioMin,
                    precioMax: filtros.precioMax,
                    ordenar: filtros.ordenar === 'precio_asc' || filtros.ordenar === 'precio_desc' 
                        ? 'precio' 
                        : filtros.ordenar === 'recientes' 
                        ? 'created_at' 
                        : filtros.ordenar === 'relevancia'
                        ? 'nombre'
                        : 'nombre',
                    ordenAsc: filtros.ordenar === 'precio_desc' ? false : true,
                    soloOfertas: filtros.soloOfertas
                };

                const resultado = await productosPublicosService.obtenerConFiltros(opciones);
                
                setProductos(resultado.productos);
                setItems(resultado.productos.map(p => ({ ...p, tipo: 'producto' })));
                setPaginacion(prev => ({
                    ...prev,
                    totalPaginas: resultado.paginas,
                    total: resultado.total
                }));
            }
        } catch (err) {
            console.error("Error detallado al cargar items:", err);
            setError('Error al cargar los items. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // Maneja el cambio de filtros
    const handleFiltrosChange = (nuevosFiltros) => {
        setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
        // Reset a página 1 si hay nuevos filtros
        if (nuevosFiltros.pagina) {
            setPaginacion(prev => ({ ...prev, paginaActual: nuevosFiltros.pagina }));
        }
    };

    // Maneja el cambio de página
    const handleCambioPagina = (nuevaPagina) => {
        setPaginacion(prev => ({ ...prev, paginaActual: nuevaPagina }));
    };

    // Función para cambiar ordenamiento desde modal mobile
    const handleCambioOrdenamiento = (nuevoOrden) => {
        handleFiltrosChange({ ordenar: nuevoOrden, pagina: 1 });
        setMostrarModalOrdenar(false);
    };

    return (
        <div className="w-full">
            <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto px-2 md:px-4 py-4 md:py-8">
                {/* Sidebar de filtros - Solo visible en desktop */}
                <div className="hidden lg:block lg:w-1/4">
                    <FilterSidebar
                        categorias={categorias}
                        marcas={marcas}
                        rangoPrecios={rangoPrecios}
                        filtrosActuales={filtros}
                        onFiltrosChange={handleFiltrosChange}
                    />
                </div>

                {/* Área de productos */}
                <div className="w-full lg:w-3/4">
                    {/* Header con resultados y controles mobile */}
                    <div className="mb-4 md:mb-6">
                        {/* Desktop Header */}
                        <div className="hidden md:block">
                            <h2 className="text-3xl font-bold text-[#ff792b] mb-2">
                                {filtros.soloOfertas 
                                    ? 'Ofertas Activas' 
                                    : filtros.soloCombos 
                                    ? 'Combos Especiales'
                                    : filtros.categoria_id 
                                    ? categorias.find(c => c.categoria_id === filtros.categoria_id)?.nombre 
                                    : 'Todos los productos'
                                }
                            </h2>
                            <div className="flex justify-between items-center">
                                <p className="text-gray-700 font-semibold">
                                    {loading 
                                        ? 'Cargando...' 
                                        : `${paginacion.total} ${paginacion.total === 1 ? 'resultado encontrado' : 'resultados encontrados'}`
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Mobile Header con botones de Ordenar y Filtrar */}
                        <div className="md:hidden">
                            <p className="text-sm text-gray-600 mb-3">
                                {loading 
                                    ? 'Cargando...' 
                                    : `${paginacion.total} ${paginacion.total === 1 ? 'resultado' : 'resultados'}`
                                }
                            </p>
                            <div className="flex gap-2">
                                {/* Botón Ordenar */}
                                <button 
                                    onClick={() => setMostrarModalOrdenar(true)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/>
                                    </svg>
                                    <span>Ordenar</span>
                                </button>
                                
                                {/* Botón Filtrar */}
                                <button 
                                    onClick={() => {
                                        setFiltrosTemporales(filtros); // Inicializar con filtros actuales
                                        setMostrarModalFiltrar(true);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-md px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                                    </svg>
                                    <span>Filtrar</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mostrar error si existe */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            <p className="font-semibold">Error</p>
                            <p className="text-sm">{error}</p>
                            <button 
                                onClick={() => cargarProductos()}
                                className="mt-3 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
                            >
                                Intentar de nuevo
                            </button>
                        </div>
                    )}

                    {/* Loading spinner */}
                    {loading && (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    )}

                    {/* Grid de productos - Responsive: 2 cols mobile, 4 cols desktop */}
                    {!loading && !error && (
                        <>
                            {items.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
                                        {items.map((item) => (
                                            item.tipo === 'combo' ? (
                                                <ComboCard 
                                                    key={`combo-${item.combo_id}`} 
                                                    combo={item} 
                                                />
                                            ) : (
                                                <ProductCard 
                                                    key={`producto-${item.producto_id}`} 
                                                    producto={item} 
                                                />
                                            )
                                        ))}
                                    </div>

                                    {/* Paginación */}
                                    <Pagination
                                        paginaActual={paginacion.paginaActual}
                                        totalPaginas={paginacion.totalPaginas}
                                        onCambioPagina={handleCambioPagina}
                                    />
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🔍</div>
                                    <h3 className="text-xl font-bold text-[#ff792b] mb-2">
                                        No se encontraron {filtros.soloCombos ? 'combos' : 'productos'}
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        Intenta ajustar los filtros o buscar con otros términos
                                    </p>
                                    <button
                                        onClick={() => handleFiltrosChange({
                                            busqueda: '',
                                            categoria_id: null,
                                            marca: null,
                                            precioMin: null,
                                            precioMax: null,
                                            ordenar: 'nombre',
                                            soloOfertas: false,
                                            soloCombos: false,
                                            pagina: 1
                                        })}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Limpiar filtros
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal de Ordenar - Mobile */}
            {mostrarModalOrdenar && (
                <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50" onClick={() => setMostrarModalOrdenar(false)}>
                    <div className="bg-white rounded-t-2xl w-full max-w-lg animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Ordenar por</h3>
                            <button 
                                onClick={() => setMostrarModalOrdenar(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        
                        {/* Opciones de ordenamiento */}
                        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                            {[
                                { valor: 'relevancia', texto: 'Más relevantes' },
                                { valor: 'nombre', texto: 'Nombre (A-Z)' },
                                { valor: 'precio_asc', texto: 'Menor precio' },
                                { valor: 'precio_desc', texto: 'Mayor precio' },
                                { valor: 'recientes', texto: 'Más recientes' }
                            ].map(opcion => (
                                <button
                                    key={opcion.valor}
                                    onClick={() => handleCambioOrdenamiento(opcion.valor)}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                                        filtros.ordenar === opcion.valor 
                                            ? 'bg-blue-50 text-blue-700 font-semibold' 
                                            : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{opcion.texto}</span>
                                        {filtros.ordenar === opcion.valor && (
                                            <svg className="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Filtros - Mobile */}
            {mostrarModalFiltrar && (
                <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50" onClick={() => {
                    setFiltrosTemporales(null);
                    setMostrarModalFiltrar(false);
                }}>
                    <div className="bg-white rounded-t-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        {/* Header fijo */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
                            <button 
                                onClick={() => {
                                    setFiltrosTemporales(null);
                                    setMostrarModalFiltrar(false);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        
                        {/* Contenido scrolleable del filtro */}
                        <div className="flex-1 overflow-y-auto">
                            <FilterSidebar
                                categorias={categorias}
                                marcas={marcas}
                                rangoPrecios={rangoPrecios}
                                filtrosActuales={filtrosTemporales || filtros}
                                onFiltrosChange={(nuevosFiltros) => {
                                    // En mobile, guardar en estado temporal, NO aplicar inmediatamente
                                    setFiltrosTemporales(nuevosFiltros);
                                }}
                                isMobile={true}
                            />
                        </div>
                        
                        {/* Footer con botones - Fijo en la parte inferior */}
                        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        // Limpiar filtros temporales y aplicar filtros limpios
                                        const filtrosLimpios = {
                                            busqueda: '',
                                            categoria_id: null,
                                            marca: null,
                                            precioMin: null,
                                            precioMax: null,
                                            ordenar: 'relevancia',
                                            soloOfertas: false,
                                            soloCombos: false,
                                            pagina: 1
                                        };
                                        setFiltrosTemporales(null);
                                        handleFiltrosChange(filtrosLimpios);
                                        setMostrarModalFiltrar(false);
                                    }}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                                >
                                    Limpiar
                                </button>
                                <button
                                    onClick={() => {
                                        // Aplicar filtros temporales y cerrar modal
                                        if (filtrosTemporales) {
                                            handleFiltrosChange(filtrosTemporales);
                                        }
                                        setFiltrosTemporales(null);
                                        setMostrarModalFiltrar(false);
                                    }}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                                >
                                    Ver resultados
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
