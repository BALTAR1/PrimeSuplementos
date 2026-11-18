import { useState, useEffect, useRef } from 'react';
import { combosPublicosService } from '../../services/productosPublicos.js';
import { addToCart } from '../../hooks/useCart.js';

/**
 * Detalle de combo.
 * Misma estructura y estilos que DetalleProducto: breadcrumb, tarjeta blanca con
 * galería a la izquierda, información a la derecha, precio en caja arena y botón marrón.
 * La lógica (carga, galería, autoplay, swipe, carrito) no cambia.
 */
export default function DetalleCombo({ comboId }) {
    const [combo, setCombo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imagenSeleccionada, setImagenSeleccionada] = useState(0);
    const [cantidad, setCantidad] = useState(1);
    const [modalImagenAbierto, setModalImagenAbierto] = useState(false);
    // Controla qué descripciones de productos están desplegadas (por índice)
    const [descripcionesAbiertas, setDescripcionesAbiertas] = useState({});

    const toggleDescripcion = (idx) => {
        setDescripcionesAbiertas(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    // Recolecta las imágenes: la del combo primero, después la de cada producto
    const obtenerTodasImagenes = () => {
        const imagenes = [];
        combo?.combo_productos?.forEach(item => {
            if (item.productos?.imagen_url) {
                imagenes.push(item.productos.imagen_url);
            }
        });
        if (combo?.imagen_url && !imagenes.includes(combo.imagen_url)) {
            imagenes.unshift(combo.imagen_url);
        }
        if (imagenes.length === 0) {
            imagenes.push('/images/placeholder.svg');
        }
        return imagenes;
    };

    const todasImagenes = combo ? obtenerTodasImagenes() : [];

    useEffect(() => {
        cargarCombo();
    }, [comboId]);

    const cargarCombo = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await combosPublicosService.obtenerPorId(comboId);
            setCombo(data);
        } catch (err) {
            setError('No se pudo cargar el combo');
        } finally {
            setLoading(false);
        }
    };

    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(precio);
    };

    const agregarAlCarrito = () => {
        const itemCarrito = {
            combo_id: combo.combo_id,
            nombre: combo.nombre,
            precio: combo.precio_combo,
            cantidad: cantidad,
            tipo: 'combo',
            productos: combo.combo_productos,
            imagen: todasImagenes[0],
            caracteristicas: {
                pack: `Pack de ${combo.combo_productos?.length || 0} productos`,
                ahorro: combo.ahorro > 0 ? `Ahorro: ${formatearPrecio(combo.ahorro)}` : null
            }
        };

        addToCart(itemCarrito);
    };

    const intervaloRef = useRef(null);

    // Autoplay: cambia la imagen cada 5 segundos
    useEffect(() => {
        if (todasImagenes.length <= 1) return;
        intervaloRef.current = setInterval(() => {
            setImagenSeleccionada((prev) => (prev + 1) % todasImagenes.length);
        }, 5000);
        return () => clearInterval(intervaloRef.current);
    }, [todasImagenes.length]);

    const handlePrev = () => {
        setImagenSeleccionada((prev) => (prev - 1 + todasImagenes.length) % todasImagenes.length);
        clearInterval(intervaloRef.current);
    };
    const handleNext = () => {
        setImagenSeleccionada((prev) => (prev + 1) % todasImagenes.length);
        clearInterval(intervaloRef.current);
    };

    // Deslizamiento táctil
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = (e) => {
        setTouchEnd(e.changedTouches[0].clientX);
        handleSwipe();
    };

    const handleSwipe = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (distance > 50) {
            handleNext();
        } else if (distance < -50) {
            handlePrev();
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-naranja)' }}></div>
                </div>
            </div>
        );
    }

    if (error || !combo) {
        return (
            <div className="container mx-auto px-4 py-12">
                <div className="rounded-lg p-6 text-center" style={{ backgroundColor: 'var(--color-arena-claro)', border: '1px solid var(--color-arena)' }}>
                    <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-error)' }}>Error</h2>
                    <p style={{ color: 'var(--color-error)' }}>{error || 'No se encontró el combo'}</p>
                    <a href="/productos" className="inline-block mt-4 hover:underline" style={{ color: 'var(--color-naranja)' }}>
                        ← Volver al catálogo
                    </a>
                </div>
            </div>
        );
    }

    const precioTotalIndividual = combo.precio_total_individual || 0;
    const ahorro = combo.ahorro || 0;
    const porcentajeAhorro = Math.round(Number(combo.porcentaje_ahorro) || 0);
    const cantidadProductos = combo.combo_productos?.length || 0;

    return (
        <div className="container mx-auto px-4 py-4 md:py-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs md:text-sm mb-4 md:mb-6" aria-label="Breadcrumb">
                <a href="/" className="hover:underline" style={{ color: 'var(--color-naranja)' }}>
                    Inicio
                </a>
                <span style={{ color: 'var(--color-dorado)' }}>›</span>
                <a href="/productos" className="hover:underline" style={{ color: 'var(--color-naranja)' }}>
                    Productos
                </a>
                <span style={{ color: 'var(--color-dorado)' }}>›</span>
                <span className="font-medium truncate" style={{ color: 'var(--color-texto-gris)' }}>
                    {combo.nombre}
                </span>
            </nav>

            <div className="bg-white rounded-xl shadow-lg border overflow-hidden" style={{ borderColor: 'var(--color-arena)' }}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 p-4 md:p-6">
                    {/* Columna izquierda - Imágenes */}
                    <div>
                        <div
                            className="relative bg-gray-50 rounded-lg overflow-hidden mb-4 md:mb-8 flex items-center justify-center"
                            style={{ height: '300px', maxHeight: '50vh', minHeight: '200px' }}
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                        >
                            {todasImagenes.length > 1 && (
                                <button
                                    onClick={handlePrev}
                                    className="absolute left-1 md:left-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1 md:p-2 shadow-lg transition-all z-20 hover:scale-110"
                                    style={{ color: 'var(--color-naranja)' }}
                                    aria-label="Imagen anterior"
                                >
                                    <svg width="20" height="20" className="md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
                                </button>
                            )}
                            <img
                                src={todasImagenes[imagenSeleccionada] || '/images/placeholder.svg'}
                                alt={combo.nombre}
                                className="max-h-72 w-auto object-contain mx-auto transition-all duration-300 cursor-pointer hover:opacity-90"
                                onClick={() => setModalImagenAbierto(true)}
                            />
                            {todasImagenes.length > 1 && (
                                <button
                                    onClick={handleNext}
                                    className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1 md:p-2 shadow-lg transition-all z-20 hover:scale-110"
                                    style={{ color: 'var(--color-naranja)' }}
                                    aria-label="Imagen siguiente"
                                >
                                    <svg width="20" height="20" className="md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
                                </button>
                            )}
                        </div>

                        {/* Miniaturas */}
                        {todasImagenes.length > 1 && (
                            <div className="flex gap-2 md:gap-4 justify-center items-center mt-2 md:mt-4 mb-4 md:mb-8 overflow-x-auto pb-2">
                                {todasImagenes.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setImagenSeleccionada(index)}
                                        className={`relative flex-shrink-0 border-2 rounded-lg overflow-hidden transition-all duration-300
                                            ${imagenSeleccionada === index ? 'scale-110 shadow-lg z-10' : 'hover:scale-105 scale-100'}
                                        `}
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            borderColor: imagenSeleccionada === index ? 'var(--color-naranja)' : 'var(--color-arena)'
                                        }}
                                        aria-label={`Ver imagen ${index + 1}`}
                                    >
                                        <img
                                            src={img}
                                            alt={`${combo.nombre} - Vista ${index + 1}`}
                                            className="w-full h-full object-cover transition-all duration-300"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Descripción breve de cada producto del combo */}
                        {combo.combo_productos?.some(item => item.productos?.descripcion) && (
                            <div className="mt-2 md:mt-4 space-y-3">
                                <h2 className="text-xs md:text-sm font-semibold text-gray-900">
                                    Sobre los productos
                                </h2>
                                {combo.combo_productos.map((item, idx) => {
                                    if (!item.productos?.descripcion) return null;
                                    const abierta = !!descripcionesAbiertas[idx];
                                    return (
                                        <div
                                            key={idx}
                                            className="rounded-lg border p-3"
                                            style={{ borderColor: 'var(--color-arena)' }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleDescripcion(idx)}
                                                className="w-full flex items-center justify-between gap-2 text-left"
                                                aria-expanded={abierta}
                                            >
                                                <span className="text-xs md:text-sm font-semibold" style={{ color: 'var(--color-marron)' }}>
                                                    {item.productos.nombre}
                                                </span>
                                                <svg
                                                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${abierta ? 'rotate-180' : ''}`}
                                                    style={{ color: 'var(--color-naranja)' }}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                                                </svg>
                                            </button>
                                            <p
                                                className={`text-xs md:text-sm mt-1 whitespace-pre-line ${abierta ? '' : 'line-clamp-2'}`}
                                                style={{ color: 'var(--color-texto-gris)' }}
                                            >
                                                {item.productos.descripcion}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => toggleDescripcion(idx)}
                                                className="text-xs font-medium mt-1 hover:underline"
                                                style={{ color: 'var(--color-naranja)' }}
                                            >
                                                {abierta ? 'Ver menos' : 'Ver descripción completa'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Columna derecha - Información */}
                    <div className="flex flex-col">
                        {/* Título */}
                        <h1 className="text-xl md:text-3xl font-bold mb-1 md:mb-2" style={{ color: 'var(--color-marron)' }}>
                            {combo.nombre}
                        </h1>

                        {/* Tipo y cantidad de productos (ocupa el lugar de marca y modelo) */}
                        <p className="text-sm md:text-base mb-3 md:mb-4" style={{ color: 'var(--color-texto-gris)' }}>
                            <span className="font-medium">Combo</span>
                            <span> - Pack de {cantidadProductos} producto{cantidadProductos !== 1 ? 's' : ''}</span>
                        </p>

                        {/* Precio */}
                        <div className="rounded-lg p-3 md:p-4 mb-3 md:mb-4" style={{ backgroundColor: 'var(--color-arena-claro)' }}>
                            {ahorro > 0 ? (
                                <>
                                    <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                                        <span className="text-sm md:text-xl text-gray-500 line-through">
                                            {formatearPrecio(precioTotalIndividual)}
                                        </span>
                                        {porcentajeAhorro > 0 && (
                                            <span className="bg-red-100 text-red-700 text-xs md:text-sm font-bold px-2 md:px-3 py-1 rounded-full">
                                                {porcentajeAhorro}% OFF
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-2xl md:text-4xl font-semibold text-[#171717] mb-1">
                                        {formatearPrecio(combo.precio_combo)}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        ¡Ahorrás {formatearPrecio(ahorro)}!
                                    </p>
                                </>
                            ) : (
                                <div className="text-2xl md:text-3xl font-semibold text-[#171717] mb-1">
                                    {formatearPrecio(combo.precio_combo)}
                                </div>
                            )}
                        </div>

                        {/* Productos incluidos */}
                        <div className="mb-3 md:mb-4">
                            <h2 className="text-xs md:text-sm font-semibold text-gray-900 mb-2">
                                Incluye
                            </h2>
                            <div className="space-y-2">
                                {combo.combo_productos?.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 md:gap-3 rounded-lg border p-2"
                                        style={{ borderColor: 'var(--color-arena)' }}
                                    >
                                        {item.productos?.imagen_url && (
                                            <img
                                                src={item.productos.imagen_url}
                                                alt={item.productos.nombre}
                                                className="w-12 h-12 md:w-14 md:h-14 object-contain rounded bg-gray-50 flex-shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs md:text-sm font-medium text-[#171717] line-clamp-2">
                                                {item.cantidad}x {item.productos?.nombre}
                                            </p>
                                            {item.productos?.marca && (
                                                <p className="text-xs" style={{ color: 'var(--color-texto-gris)' }}>
                                                    {item.productos.marca}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs md:text-sm font-semibold text-[#171717]">
                                                {formatearPrecio(item.productos?.precio || 0)}
                                            </p>
                                            <p className="text-[10px] md:text-xs text-gray-500">c/u</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Cantidad */}
                        <div className="mb-3 md:mb-4">
                            <label className="block text-xs md:text-sm font-semibold text-gray-900 mb-2">
                                Cantidad: {cantidad} combo{cantidad !== 1 ? 's' : ''}
                            </label>
                            <div className="flex items-center gap-2 md:gap-3">
                                <button
                                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                    className="w-8 h-8 md:w-10 md:h-10 border border-gray-300 rounded-lg hover:bg-gray-100 font-bold text-sm md:text-base"
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    value={cantidad}
                                    onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-16 md:w-20 text-center border border-gray-300 rounded-lg py-1 md:py-2 text-sm md:text-base"
                                    min="1"
                                />
                                <button
                                    onClick={() => setCantidad(cantidad + 1)}
                                    className="w-8 h-8 md:w-10 md:h-10 border border-gray-300 rounded-lg hover:bg-gray-100 font-bold text-sm md:text-base"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Botón de acción */}
                        <div className="flex flex-col gap-2 md:gap-3 mb-4 md:mb-6">
                            <button
                                onClick={agregarAlCarrito}
                                className="w-full text-white font-bold py-3 md:py-4 px-4 md:px-6 rounded-lg transition-all text-sm md:text-lg hover:scale-[1.02] shadow-lg"
                                style={{ backgroundColor: '#a8763e' }}
                            >
                                {`Agregar al carrito - ${formatearPrecio(combo.precio_combo * cantidad)}`}
                            </button>
                        </div>

                        {/* Información adicional */}
                        <div className="border-t pt-3 md:pt-4 space-y-2 md:space-y-3" style={{ borderColor: 'var(--color-arena)' }}>
                            <div className="flex items-start gap-2 md:gap-3">
                                <svg className="w-4 h-4 md:w-5 md:h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-exito)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                                </svg>
                                <div>
                                    <p className="font-medium text-xs md:text-sm" style={{ color: 'var(--color-negro)' }}>Pack con precio especial</p>
                                    <p className="text-xs" style={{ color: 'var(--color-texto-gris)' }}>Envío a todo el país</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 md:gap-3">
                                <svg className="w-4 h-4 md:w-5 md:h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-dorado)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                                </svg>
                                <div>
                                    <p className="font-medium text-xs md:text-sm" style={{ color: 'var(--color-negro)' }}>Compra protegida</p>
                                    <p className="text-xs" style={{ color: 'var(--color-texto-gris)' }}>Garantía del vendedor</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de imagen ampliada */}
            {modalImagenAbierto && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
                    onClick={() => setModalImagenAbierto(false)}
                >
                    <button
                        onClick={() => setModalImagenAbierto(false)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                        aria-label="Cerrar"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>

                    {todasImagenes.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all"
                                aria-label="Imagen anterior"
                            >
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 19l-7-7 7-7"/>
                                </svg>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-3 transition-all"
                                aria-label="Imagen siguiente"
                            >
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 5l7 7-7 7"/>
                                </svg>
                            </button>
                        </>
                    )}

                    <img
                        src={todasImagenes[imagenSeleccionada]}
                        alt={combo.nombre}
                        className="max-h-[90vh] max-w-[90vw] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {todasImagenes.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                            {imagenSeleccionada + 1} / {todasImagenes.length}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
