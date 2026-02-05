import { useState, useEffect } from 'react';

/**
 * Componente de filtros laterales - Inspirado en Mercado Libre
 * Filtros dinámicos basados en datos reales de productos
 * Responsive: Sidebar en desktop, Modal bottom sheet en mobile
 */
export default function FilterSidebar({ 
    categorias = [], 
    marcas = [],
    rangoPrecios = { min: 0, max: 0 },
    filtrosActuales = {},
    onFiltrosChange,
    isMobile = false
}) {
    // Estados locales
    const [busqueda, setBusqueda] = useState(filtrosActuales.busqueda || '');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(filtrosActuales.categoria_id || null);
    const [marcaSeleccionada, setMarcaSeleccionada] = useState(filtrosActuales.marca || null);
    const [precioMin, setPrecioMin] = useState(filtrosActuales.precioMin || '');
    const [precioMax, setPrecioMax] = useState(filtrosActuales.precioMax || '');
    const [ordenamiento, setOrdenamiento] = useState(filtrosActuales.ordenar || 'relevancia');
    const [soloOfertas, setSoloOfertas] = useState(filtrosActuales.soloOfertas || false);
    const [soloCombos, setSoloCombos] = useState(filtrosActuales.soloCombos || false);

    // Estado para secciones colapsables
    const [seccionesAbiertas, setSeccionesAbiertas] = useState({
        promociones: true,
        categorias: true,
        marcas: true,
        precio: true
    });

    // Sincronizar estados locales con filtros actuales (importante para mobile)
    useEffect(() => {
        setBusqueda(filtrosActuales.busqueda || '');
        setCategoriaSeleccionada(filtrosActuales.categoria_id || null);
        setMarcaSeleccionada(filtrosActuales.marca || null);
        setPrecioMin(filtrosActuales.precioMin || '');
        setPrecioMax(filtrosActuales.precioMax || '');
        setOrdenamiento(filtrosActuales.ordenar || 'relevancia');
        setSoloOfertas(filtrosActuales.soloOfertas || false);
        setSoloCombos(filtrosActuales.soloCombos || false);
    }, [filtrosActuales]);

    // Aplicar filtros automáticamente cuando hay cambios
    useEffect(() => {
        const timer = setTimeout(() => {
            const nuevosFiltros = {
                busqueda: busqueda.trim(),
                categoria_id: categoriaSeleccionada,
                marca: marcaSeleccionada,
                precioMin: precioMin !== '' ? Number(precioMin) : null,
                precioMax: precioMax !== '' ? Number(precioMax) : null,
                ordenar: ordenamiento,
                soloOfertas: soloOfertas,
                soloCombos: soloCombos,
                pagina: 1
            };
            onFiltrosChange(nuevosFiltros);
        }, isMobile ? 0 : 500); // En mobile aplicar inmediatamente a filtrosTemporales, en desktop con debounce
        
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [busqueda, categoriaSeleccionada, marcaSeleccionada, precioMin, precioMax, ordenamiento, soloOfertas, soloCombos, isMobile]);

    // Limpiar filtros
    const limpiarFiltros = () => {
        setBusqueda('');
        setCategoriaSeleccionada(null);
        setMarcaSeleccionada(null);
        setPrecioMin('');
        setPrecioMax('');
        setOrdenamiento('relevancia');
        setSoloOfertas(false);
        setSoloCombos(false);
        
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
        onFiltrosChange(filtrosLimpios);
    };

    // Toggle sección
    const toggleSeccion = (seccion) => {
        setSeccionesAbiertas(prev => ({
            ...prev,
            [seccion]: !prev[seccion]
        }));
    };

    return (
        <aside className={`w-full bg-white overflow-hidden ${isMobile ? '' : 'rounded-lg border border-gray-200'}`}>
            {/* Header - Solo mostrar en desktop */}
            {!isMobile && (
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                        </svg>
                        <h2 className="text-base font-semibold text-gray-900">Filtros</h2>
                    </div>
                    <button
                        onClick={limpiarFiltros}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                        Limpiar
                    </button>
                </div>
            )}

            <div className={`p-4 space-y-4 ${isMobile ? 'max-h-[60vh]' : 'max-h-[calc(100vh-200px)]'} overflow-y-auto`}>
                {/* Búsqueda */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Buscar
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar productos..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                    </div>
                </div>

                {/* Promociones - NUEVO */}
                <div className="border-t border-gray-200 pt-4">
                    <button
                        onClick={() => toggleSeccion('promociones')}
                        className="w-full flex items-center justify-between text-sm font-medium text-gray-900 mb-3"
                    >
                        <span className="flex items-center gap-2">
                            <span>🎉</span>
                            <span>Promociones</span>
                        </span>
                        <svg 
                            className={`w-4 h-4 transition-transform ${seccionesAbiertas.promociones ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                    
                    {seccionesAbiertas.promociones && (
                        <div className="space-y-3">
                            {/* Filtro Solo Ofertas */}
                            <label className="flex items-center cursor-pointer group p-2 rounded hover:bg-red-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={soloOfertas}
                                    onChange={(e) => {
                                        setSoloOfertas(e.target.checked);
                                        if (e.target.checked) {
                                            setSoloCombos(false); // Desactivar combos si se activa ofertas
                                        }
                                    }}
                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                                />
                                <div className="ml-3 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900">Solo Ofertas</span>
                                        <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded font-bold">%OFF</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">Productos con descuento activo</p>
                                </div>
                            </label>

                            {/* Filtro Solo Combos */}
                            <label className="flex items-center cursor-pointer group p-2 rounded hover:bg-purple-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={soloCombos}
                                    onChange={(e) => {
                                        setSoloCombos(e.target.checked);
                                        if (e.target.checked) {
                                            setSoloOfertas(false); // Desactivar ofertas si se activa combos
                                        }
                                    }}
                                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                                />
                                <div className="ml-3 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900">Solo Combos</span>
                                        <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded font-bold">🎁</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">Packs promocionales con descuento</p>
                                </div>
                            </label>
                        </div>
                    )}
                </div>

                {/* Categorías */}
                {categorias.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                        <button
                            onClick={() => toggleSeccion('categorias')}
                            className="w-full flex items-center justify-between text-sm font-medium text-gray-900 mb-3"
                        >
                            <span className="flex items-center gap-2">
                                <span>📂</span>
                                <span>Categorías</span>
                            </span>
                            <svg 
                                className={`w-4 h-4 transition-transform ${seccionesAbiertas.categorias ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </button>
                        
                        {seccionesAbiertas.categorias && (
                            <div className="space-y-2">
                                {categorias.map((categoria) => (
                                    <label 
                                        key={categoria.categoria_id} 
                                        className={`flex items-center cursor-pointer group p-2 rounded transition-colors ${
                                            categoriaSeleccionada === categoria.categoria_id 
                                                ? 'bg-blue-50' 
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={categoriaSeleccionada === categoria.categoria_id}
                                            onChange={() => {
                                                const nuevaCat = categoriaSeleccionada === categoria.categoria_id ? null : categoria.categoria_id;
                                                setCategoriaSeleccionada(nuevaCat);
                                            }}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className={`ml-3 text-sm flex-1 ${
                                            categoriaSeleccionada === categoria.categoria_id 
                                                ? 'text-blue-700 font-medium' 
                                                : 'text-gray-700 group-hover:text-gray-900'
                                        }`}>
                                            {categoria.nombre}
                                        </span>
                                        {categoria.cantidad && (
                                            <span className="text-xs text-gray-500 ml-2">
                                                ({categoria.cantidad})
                                            </span>
                                        )}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Marcas */}
                {marcas.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                        <button
                            onClick={() => toggleSeccion('marcas')}
                            className="w-full flex items-center justify-between text-sm font-medium text-gray-900 mb-3"
                        >
                            <span>Marca</span>
                            <svg 
                                className={`w-4 h-4 transition-transform ${seccionesAbiertas.marcas ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                            </svg>
                        </button>
                        
                        {seccionesAbiertas.marcas && (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {marcas.map((item, index) => (
                                    <label key={index} className="flex items-center cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={marcaSeleccionada === item.marca}
                                            onChange={() => {
                                                const nuevaMarca = marcaSeleccionada === item.marca ? null : item.marca;
                                                setMarcaSeleccionada(nuevaMarca);
                                            }}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900 flex-1">
                                            {item.marca}
                                        </span>
                                        <span className="text-xs text-gray-500">({item.count})</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Precio */}
                <div className="border-t border-gray-200 pt-4">
                    <button
                        onClick={() => toggleSeccion('precio')}
                        className="w-full flex items-center justify-between text-sm font-medium text-gray-900 mb-3"
                    >
                        <span>Precio</span>
                        <svg 
                            className={`w-4 h-4 transition-transform ${seccionesAbiertas.precio ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                    
                    {seccionesAbiertas.precio && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Desde</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                        <input
                                            type="number"
                                            value={precioMin}
                                            onChange={(e) => setPrecioMin(e.target.value)}
                                            placeholder="0"
                                            min="0"
                                            className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                        <input
                                            type="number"
                                            value={precioMax}
                                            onChange={(e) => setPrecioMax(e.target.value)}
                                            placeholder={rangoPrecios.max.toString()}
                                            min="0"
                                            className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                            {rangoPrecios.max > 0 && (
                                <p className="text-xs text-gray-500">
                                    Rango: ${rangoPrecios.min.toLocaleString()} - ${rangoPrecios.max.toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Ordenar por */}
                <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                        Ordenar por
                    </label>
                    <select
                        value={ordenamiento}
                        onChange={(e) => setOrdenamiento(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="relevancia">Más relevantes</option>
                        <option value="nombre">Nombre (A-Z)</option>
                        <option value="precio_asc">Menor precio</option>
                        <option value="precio_desc">Mayor precio</option>
                        <option value="recientes">Más recientes</option>
                    </select>
                </div>

                {/* Botón limpiar filtros */}
                <button
                    onClick={limpiarFiltros}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-md transition-colors text-sm"
                >
                    Limpiar todos los filtros
                </button>
            </div>
        </aside>
    );
}
