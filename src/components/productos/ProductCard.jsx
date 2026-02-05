/**
 * Componente de tarjeta de producto para el catálogo
 * Diseño inspirado en Mercado Libre
 * Muestra imagen, nombre, precio, marca y acceso al detalle
 */
export default function ProductCard({ producto }) {
    // Función para formatear el precio en pesos argentinos
    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(precio);
    };

    // Determina estado del stock
    const sinStock = producto.stock === 0;
    const stockBajo = producto.stock > 0 && producto.stock <= 5;

    // URL del detalle del producto
    const urlDetalle = `/producto/${producto.producto_id}`;

    return (
        <article className="group bg-white rounded-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
            {/* Contenedor de imagen - Clickeable */}
            <a href={urlDetalle} className="relative bg-white overflow-hidden aspect-square flex items-center justify-center">
                <img
                    src={producto.imagen_url}
                    alt={producto.nombre}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />

                {/* Badges de promoción superior derecha */}
                <div className="absolute top-1 md:top-2 right-1 md:right-2 flex flex-col gap-1">
                    {sinStock && (
                        <div className="bg-red-600 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded font-bold shadow-md">
                            SIN STOCK
                        </div>
                    )}
                    {stockBajo && !sinStock && (
                        <div className="bg-orange-500 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded font-bold shadow-md">
                            ÚLTIMAS
                        </div>
                    )}
                    {/* Badge de oferta activa */}
                    {producto.tiene_oferta && !sinStock && (
                        <div className="bg-red-500 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded font-bold shadow-md">
                            {producto.descuento}% OFF
                        </div>
                    )}
                </div>
            </a>

            {/* Información del producto */}
            <div className="p-2 md:p-3 flex flex-col flex-grow">
                {/* Marca y Modelo - Oculto en mobile */}
                {producto.marca && (
                    <p className="hidden md:block text-xs text-gray-600 font-medium mb-1">
                        {producto.marca}
                    </p>
                )}

                {/* Nombre del producto - Clickeable */}
                <a href={urlDetalle} className="block">
                    <h3 className="text-xs md:text-sm font-semibold text-amber-500 mb-1 md:mb-2 line-clamp-2 min-h-[2rem] md:min-h-[2.5rem] group-hover:text-amber-600 transition-colors">
                        {producto.nombre}
                    </h3>
                </a>

                {/* Precio y opciones de compra */}
                <div className="mt-auto">
                    {/* Precio principal */}
                    <div className="mb-2 md:mb-3">
                        {/* Si hay descuento por oferta, mostrar precio original tachado */}
                        {producto.tiene_oferta && producto.precio_con_descuento ? (
                            <div>
                                <div className="flex items-center gap-1 md:gap-2 mb-0.5 md:mb-1">
                                    <span className="text-[10px] md:text-sm text-gray-500 line-through">
                                        {formatearPrecio(producto.precio_original)}
                                    </span>
                                    <span className="bg-red-100 text-red-700 text-[9px] md:text-xs font-bold px-1 md:px-2 py-0.5 rounded">
                                        {producto.descuento}% OFF
                                    </span>
                                </div>
                                <div className="text-lg md:text-2xl font-black text-black">
                                    {formatearPrecio(producto.precio_con_descuento)}
                                </div>
                                <p className="hidden md:block text-xs text-gray-500 mt-1">
                                    Ahorrás {formatearPrecio(producto.precio_original - producto.precio_con_descuento)}
                                </p>
                            </div>
                        ) : (
                            <div className="text-lg md:text-2xl font-black text-black">
                                {formatearPrecio(producto.precio)}
                            </div>
                        )}
                        {/* Mostrar badge de combo si aplica */}
                        {producto.tiene_combo && (
                            <div className="mt-1 md:mt-2">
                                <span className="inline-block bg-purple-100 text-purple-700 text-[9px] md:text-xs font-semibold px-1.5 md:px-2 py-0.5 md:py-1 rounded">
                                    Disponible en combo
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Botón de agregar al carrito */}
                    <a
                        href={urlDetalle}
                        className={`
                            block w-full py-1.5 md:py-2.5 rounded-lg font-semibold text-xs md:text-sm text-center transition-all
                            ${sinStock 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                            }
                        `}
                    >
                        {sinStock ? 'Sin stock' : 'Ver producto'}
                    </a>
                </div>
            </div>
        </article>
    );
}
