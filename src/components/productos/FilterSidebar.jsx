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
    const [marcasSeleccionadas, setMarcasSeleccionadas] = useState(filtrosActuales.marca_ids || []);
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
        setMarcasSeleccionadas(filtrosActuales.marca_ids || []);
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
                marca_ids: marcasSeleccionadas,
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
    }, [busqueda, categoriaSeleccionada, marcasSeleccionadas, precioMin, precioMax, ordenamiento, soloOfertas, soloCombos, isMobile]);

    // Limpiar filtros
    const limpiarFiltros = () => {
        setBusqueda('');
        setCategoriaSeleccionada(null);
        setMarcasSeleccionadas([]);
        setPrecioMin('');
        setPrecioMax('');
        setOrdenamiento('relevancia');
        setSoloOfertas(false);
        setSoloCombos(false);
        
        const filtrosLimpios = {
            busqueda: '',
            categoria_id: null,
            marca_ids: [],
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
        <aside className={`w-full overflow-hidden bg-white ${isMobile ? '' : 'rounded-sm border border-black/10 shadow-[0_12px_30px_rgba(0,0,0,0.06)]'}`}>
            {/* Header - Solo mostrar en desktop */}
            {!isMobile && (
                <div className="flex items-center justify-between bg-[#171717] p-4">
                    <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-[#c68b52]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                        </svg>
                        <h2 className="text-base font-bold uppercase tracking-wide text-white">Filtros</h2>
                    </div>
                    <button
                        onClick={limpiarFiltros}
                        className="text-xs font-semibold text-[#c68b52] hover:text-white hover:underline"
                    >
                        Limpiar
                    </button>
                </div>
            )}

            <div className={`space-y-5 bg-[#fbfbfa] p-4 ${isMobile ? 'max-h-[60vh]' : 'max-h-[calc(100vh-200px)]'} overflow-y-auto`}>
                {/* Búsqueda */}
                <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-black/50">
                        Buscar productos
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar productos..."
                            className="w-full rounded-sm border border-black/15 bg-white py-3 pl-10 pr-3 text-sm shadow-sm focus:border-[#c68b52] focus:outline-none focus:ring-1 focus:ring-[#c68b52]"
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                    </div>
                </div>

                {/* Promociones - NUEVO */}
                <div className="border-t border-black/10 pt-5">
                    <button
                        onClick={() => toggleSeccion('promociones')}
                        className="mb-3 flex w-full items-center justify-between text-sm font-bold uppercase tracking-wide text-[#171717]"
                    >
                        <span>Promociones</span>
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
                            <label                             className="group flex cursor-pointer items-center rounded-sm border border-transparent bg-white p-3 transition-colors hover:border-[#c68b52]/30 hover:bg-[#f7f7f5]">
                                <input
                                    type="checkbox"
                                    checked={soloOfertas}
                                    onChange={(e) => {
                                        setSoloOfertas(e.target.checked);
                                        if (e.target.checked) {
                                            setSoloCombos(false); // Desactivar combos si se activa ofertas
                                        }
                                    }}
                                    className="h-4 w-4 rounded border-black/20 text-[#a8763e] focus:ring-2 focus:ring-[#c68b52]"
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
                            <label className="group flex cursor-pointer items-center rounded-sm border border-transparent bg-white p-3 transition-colors hover:border-[#c68b52]/30 hover:bg-[#f7f7f5]">
                                <input
                                    type="checkbox"
                                    checked={soloCombos}
                                    onChange={(e) => {
                                        setSoloCombos(e.target.checked);
                                        if (e.target.checked) {
                                            setSoloOfertas(false); // Desactivar ofertas si se activa combos
                                        }
                                    }}
                                    className="h-4 w-4 rounded border-black/20 text-[#a8763e] focus:ring-2 focus:ring-[#c68b52]"
                                />
                                <div className="ml-3 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900">Solo Combos</span>
                                        <span className="rounded bg-[#171717] px-1.5 py-0.5 text-xs font-bold text-[#c68b52]">COMBO</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">Packs promocionales con descuento</p>
                                </div>
                            </label>
                        </div>
                    )}
                </div>

                {/* Categorías */}
                {categorias.length > 0 && (
                    <div className="border-t border-black/10 pt-5">
                        <button
                            onClick={() => toggleSeccion('categorias')}
                            className="mb-3 flex w-full items-center justify-between text-sm font-bold uppercase tracking-wide text-[#171717]"
                        >
                            <span>Categorías</span>
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
                                                ? 'border-[#c68b52]/40 bg-[#f2e7da]' 
                                                : 'border-transparent hover:bg-white'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={categoriaSeleccionada === categoria.categoria_id}
                                            onChange={() => {
                                                const nuevaCat = categoriaSeleccionada === categoria.categoria_id ? null : categoria.categoria_id;
                                                setCategoriaSeleccionada(nuevaCat);
                                            }}
                                            className="h-4 w-4 rounded border-black/20 text-[#a8763e] focus:ring-2 focus:ring-[#c68b52]"
                                        />
                                        <span className={`ml-3 text-sm flex-1 ${
                                            categoriaSeleccionada === categoria.categoria_id 
                                                ? 'font-semibold text-[#a8763e]' 
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
                    <div className="border-t border-black/10 pt-5">
                        <button
                            onClick={() => toggleSeccion('marcas')}
                            className="mb-3 flex w-full items-center justify-between text-sm font-bold uppercase tracking-wide text-[#171717]"
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
                                            checked={marcasSeleccionadas.includes(item.marca_id)}
                                            onChange={() => {
                                                setMarcasSeleccionadas(prev =>
                                                    prev.includes(item.marca_id)
                                                        ? prev.filter(id => id !== item.marca_id)
                                                        : [...prev, item.marca_id]
                                                );
                                            }}
                                            className="h-4 w-4 rounded border-black/20 text-[#a8763e] focus:ring-2 focus:ring-[#c68b52]"
                                        />
                                        <span                                         className="ml-2 flex-1 text-sm text-gray-700 group-hover:text-[#a8763e]">
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
                <div className="border-t border-black/10 pt-5">
                    <button
                        onClick={() => toggleSeccion('precio')}
                        className="mb-3 flex w-full items-center justify-between text-sm font-bold uppercase tracking-wide text-[#171717]"
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
                                            className="w-full rounded-sm border border-black/15 bg-white py-2 pl-6 pr-2 text-sm focus:border-[#c68b52] focus:outline-none focus:ring-1 focus:ring-[#c68b52]"
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
                                            className="w-full rounded-sm border border-black/15 bg-white py-2 pl-6 pr-2 text-sm focus:border-[#c68b52] focus:outline-none focus:ring-1 focus:ring-[#c68b52]"
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
                <div>
                    <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-[#171717]">
                        Ordenar productos
                    </label>
                    <select
                        value={ordenamiento}
                        onChange={(e) => setOrdenamiento(e.target.value)}
                        className="w-full rounded-sm border border-black/15 bg-white px-3 py-3 text-sm focus:border-[#c68b52] focus:outline-none focus:ring-1 focus:ring-[#c68b52]"
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
                    className="w-full rounded-sm border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#171717] transition-colors hover:border-[#c68b52] hover:text-[#a8763e]"
                >
                    Limpiar todos los filtros
                </button>
            </div>
        </aside>
    );
}
