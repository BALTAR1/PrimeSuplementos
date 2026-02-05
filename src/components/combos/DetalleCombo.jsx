import { useState, useEffect, useRef } from 'react';
import { combosPublicosService } from '../../services/productosPublicos.js';
import { addToCart } from '../../hooks/useCart.js';

/**
 * Componente de detalle de combo
 * - Muestra información completa del combo: imágenes, lista de productos, precio y ahorro
 * - Comentarios añadidos para aprendizaje (sin cambiar la lógica)
 */
export default function DetalleCombo({ comboId }) {
    // Estado que contiene el objeto `combo` obtenido del backend
    const [combo, setCombo] = useState(null);
    // Estado para controlar la UI de carga
    const [loading, setLoading] = useState(true);
    // Estado para almacenar mensajes de error y mostrarlos en UI
    const [error, setError] = useState(null);
    // Índice de la imagen seleccionada en el slider
    const [imagenSeleccionada, setImagenSeleccionada] = useState(0);
    // Cantidad de combos que el usuario desea agregar
    const [cantidad, setCantidad] = useState(1);

    // Función que recolecta todas las imágenes disponibles del combo
    const obtenerTodasImagenes = () => {
        // Array que guardará las URLs de las imágenes
        const imagenes = [];
        // Recorremos los productos del combo y agregamos sus imágenes si están disponibles
        combo?.combo_productos?.forEach(item => {
            if (item.productos?.imagen_url) {
                imagenes.push(item.productos.imagen_url);
            }
        });
        // Si el combo tiene una imagen principal distinta, la colocamos al inicio
        if (combo?.imagen_url && !imagenes.includes(combo.imagen_url)) {
            imagenes.unshift(combo.imagen_url);
        }
        // Si no encontramos imágenes, agregamos una imagen placeholder por defecto
        if (imagenes.length === 0) {
            imagenes.push('/images/placeholder.svg');
        }
        // Retornamos el array con las imágenes finales
        return imagenes;
    };

    // Obtenemos el array de imágenes solo si `combo` ya fue cargado
    const todasImagenes = combo ? obtenerTodasImagenes() : [];

    // Efecto que se ejecuta cuando cambia `comboId` para recargar datos
    useEffect(() => {
        cargarCombo();
    }, [comboId]);

    // Función asíncrona que consulta el servicio para obtener el combo por su ID
    const cargarCombo = async () => {
        try {
            setLoading(true); // activamos indicador de carga
            setError(null); // limpiamos errores previos
            const data = await combosPublicosService.obtenerPorId(comboId);
            setCombo(data); // guardamos la respuesta en el estado
        } catch (err) {
            setError('No se pudo cargar el combo'); // mensaje legible para el usuario
        } finally {
            setLoading(false); // desactivamos indicador de carga
        }
    };

    // Formatea números a moneda local (pesos argentinos)
    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(precio);
    };

    // Función para armar el objeto que representaría el item que se añadiría al carrito
    const agregarAlCarrito = () => {
        const itemCarrito = {
            combo_id: combo.combo_id, // id del combo
            nombre: combo.nombre, // nombre del combo
            precio: combo.precio_combo, // precio por unidad del combo
            cantidad: cantidad, // cantidad seleccionada
            tipo: 'combo', // tipo para distinguir en el carrito
            productos: combo.combo_productos, // detalle de los productos incluidos
            imagen: todasImagenes[0], // imagen principal para mostrar en el carrito
            caracteristicas: {
                pack: `Pack de ${combo.combo_productos?.length || 0} productos`,
                ahorro: combo.ahorro > 0 ? `Ahorro: ${formatearPrecio(combo.ahorro)}` : null
            }
        };

        // Agregar al carrito usando el hook
        addToCart(itemCarrito);
    };

    // Referencia para mantener la referencia del intervalo del autoplay
    const intervaloRef = useRef(null);

    // Autoplay: cambiamos la imagen cada 5 segundos si hay más de una
    useEffect(() => {
        if (todasImagenes.length <= 1) return; // no crear intervalo si solo hay 1 imagen
        intervaloRef.current = setInterval(() => {
            setImagenSeleccionada((prev) => (prev + 1) % todasImagenes.length);
        }, 5000);
        // Limpieza del intervalo cuando el componente se desmonta o se actualiza
        return () => clearInterval(intervaloRef.current);
    }, [todasImagenes.length]);

    // Funciones para navegar manualmente las imágenes (antes/después)
    const handlePrev = () => {
        setImagenSeleccionada((prev) => (prev - 1 + todasImagenes.length) % todasImagenes.length);
        // Al interactuar detenemos temporalmente el autoplay
        clearInterval(intervaloRef.current);
    };

    const handleNext = () => {
        setImagenSeleccionada((prev) => (prev + 1) % todasImagenes.length);
        clearInterval(intervaloRef.current);
    };

    // Manejo de deslizamiento táctil
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
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            handleNext();
        } else if (isRightSwipe) {
            handlePrev();
        }
    };

    // Si estamos cargando, mostramos un spinner centrado
    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Si ocurre un error o no existe el combo, mostramos mensaje de error
    if (error || !combo) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-semibold">Error</p>
                    <p className="text-sm">{error || 'No se encontró el combo'}</p>
                </div>
            </div>
        );
    }

    // Variables derivadas del objeto `combo` para mostrar en la UI
    const precioTotalIndividual = combo.precio_total_individual || 0;
    const ahorro = combo.ahorro || 0;
    const porcentajeAhorro = combo.porcentaje_ahorro || 0;

    // Render del detalle completo
    return (
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
            {/* Breadcrumb de navegación (mejora la experiencia y SEO) */}
            <nav className="flex items-center gap-2 text-xs md:text-sm mb-4 md:mb-8" aria-label="Breadcrumb">
                <a href="/" className="text-blue-600 hover:text-blue-700 hover:underline">
                    Inicio
                </a>
                <span className="text-gray-400">›</span>
                <a href="/productos" className="text-blue-600 hover:text-blue-700 hover:underline">
                    Productos
                </a>
                <span className="text-gray-400">›</span>
                <span className="text-gray-700 font-medium truncate">
                    {combo.nombre}
                </span>
            </nav>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                {/* Columna izquierda: slider de imágenes y miniaturas */}
                <div className="flex flex-col gap-2 md:gap-4">
                    {/* Imagen principal con slider */}
                    <div 
                        className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square group"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                    >
                        <img
                            src={todasImagenes[imagenSeleccionada]}
                            alt={combo.nombre}
                            className="w-full h-full object-cover"
                        />

                        {/* Botones de navegación (aparecen on-hover) */}
                        {todasImagenes.length > 1 && (
                            <>
                                <button
                                    onClick={handlePrev}
                                    className="absolute left-1 md:left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 md:p-2 shadow-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 z-10"
                                >
                                    <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="absolute right-1 md:right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 md:p-2 shadow-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 z-10"
                                >
                                    <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </>
                        )}

                        {/* Indicador de posición en el slider (ej: 1 / 4) */}
                        {todasImagenes.length > 1 && (
                            <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                {imagenSeleccionada + 1} / {todasImagenes.length}
                            </div>
                        )}
                    </div>

                    {/* Miniaturas clickeables para seleccionar imagen */}
                    {todasImagenes.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {todasImagenes.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setImagenSeleccionada(idx)}
                                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                        imagenSeleccionada === idx 
                                            ? 'border-purple-600' 
                                            : 'border-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                    <img
                                        src={img}
                                        alt={`Miniatura ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Columna derecha: información detallada del combo */}
                <div className="flex flex-col gap-4 md:gap-6">
                    {/* Nombre y resumen del combo */}
                    <div>
                        <h1 className="text-2xl md:text-4xl font-black text-gray-900 mb-2">
                            {combo.nombre}
                        </h1>
                        <div className="flex items-center gap-4 text-xs md:text-sm">
                            <span className="bg-purple-100 text-purple-700 px-2 md:px-3 py-1 rounded-full font-medium">
                                Pack de {combo.combo_productos?.length || 0} productos
                            </span>
                        </div>
                    </div>

                    {/* Precios y ahorro: comparativa y visualización del monto ahorrado */}
                    <div className="border-b pb-4 md:pb-6">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 md:p-4 mb-4">
                            <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">Precio normalmente:</p>
                            <p className="text-xs md:text-sm text-gray-500 line-through mb-2 md:mb-3">
                                {formatearPrecio(precioTotalIndividual)}
                            </p>
                            
                            <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">Precio en combo:</p>
                            <div className="text-2xl md:text-4xl font-black text-gray-900 mb-2 md:mb-3">
                                {formatearPrecio(combo.precio_combo)}
                            </div>

                            {ahorro > 0 && (
                                <div className="bg-green-100 border border-green-300 rounded p-2 md:p-3 mb-0">
                                    <p className="text-xs md:text-sm font-semibold text-green-700">
                                        ¡Ahorrás {formatearPrecio(ahorro)}! ({porcentajeAhorro}%)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lista de productos incluidos: imagen, nombre, marca y precio por unidad */}
                    <div className="border-b pb-4 md:pb-6">
                        <h2 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">
                            Productos incluidos en el combo
                        </h2>
                        <div className="space-y-2 md:space-y-3">
                            {combo.combo_productos?.map((item, idx) => (
                                <div key={idx} className="bg-gray-50 rounded-lg p-2 md:p-3 flex gap-2 md:gap-3">
                                    {item.productos?.imagen_url && (
                                        <img
                                            src={item.productos.imagen_url}
                                            alt={item.productos.nombre}
                                            className="w-14 h-14 md:w-16 md:h-16 object-cover rounded flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 text-sm md:text-base truncate">
                                                    {item.cantidad}x {item.productos?.nombre}
                                                </p>
                                                {item.productos?.marca && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Marca: {item.productos.marca}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="font-bold text-gray-900 text-sm md:text-base">
                                                    {formatearPrecio(item.productos?.precio || 0)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    c/u
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Controles de cantidad y botón para agregar al carrito */}
                    <div className="space-y-2 md:space-y-3">
                        <div className="flex items-center gap-3 md:gap-4">
                            <label className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">
                                Cantidad de combos:
                            </label>
                            <div className="flex items-center border border-gray-300 rounded-lg">
                                <button
                                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                    className="px-2 md:px-3 py-1 md:py-2 text-gray-600 hover:bg-gray-100 text-sm md:text-base"
                                >
                                    −
                                </button>
                                <span className="px-3 md:px-4 py-1 md:py-2 font-semibold text-gray-900 text-sm md:text-base">
                                    {cantidad}
                                </span>
                                <button
                                    onClick={() => setCantidad(cantidad + 1)}
                                    className="px-2 md:px-3 py-1 md:py-2 text-gray-600 hover:bg-gray-100 text-sm md:text-base"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={agregarAlCarrito}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 md:py-4 px-4 md:px-6 rounded-lg transition-colors text-sm md:text-lg"
                        >
                            {/* Botón muestra el precio total (precio combo * cantidad) */}
                            Agregar al carrito - {formatearPrecio(combo.precio_combo * cantidad)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
