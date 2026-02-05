/**
 * Componente de tarjeta de combo
 * - Muestra los datos principales de un combo: imagen, nombre, lista breve de productos y precios
 * - El objetivo de los comentarios es educativo: explicar cada línea sin alterar la lógica
 */
export default function ComboCard({ combo }) {
    // Función que recibe un número (precio) y retorna una cadena formateada en pesos ARS
    const formatearPrecio = (precio) => {
        // Intl.NumberFormat se usa para formatear moneda localmente
        return new Intl.NumberFormat('es-AR', {
            style: 'currency', // tipo moneda
            currency: 'ARS',   // peso argentino
            minimumFractionDigits: 0, // sin decimales
            maximumFractionDigits: 0
        }).format(precio);
    };

    // Selecciona la imagen principal del combo:
    // 1) Si el combo tiene `imagen_url` se usa esa
    // 2) Si no, intenta usar la imagen del primer producto incluido (`combo.combo_productos[0].productos.imagen_url`)
    // 3) Si ninguna existe, se usa un placeholder local
    const imagenPrincipal = combo.imagen_url || combo.combo_productos?.[0]?.productos?.imagen_url || '/images/placeholder.svg';
    
    // Inicializamos la variable que almacenará la sumatoria de precios individuales de los productos del combo
    let precioTotalIndividual = 0;

    // Iteramos sobre los productos del combo (si existen) para sumar el precio * cantidad de cada uno
    combo.combo_productos?.forEach(item => {
        // `item.productos` es la referencia al producto; si existe, acumulamos su precio
        if (item.productos) {
            // Sumar precio del producto multiplicado por la cantidad incluida en el combo
            precioTotalIndividual += item.productos.precio * item.cantidad;
        }
    });
    
    // Calculamos el ahorro absoluto: diferencia entre la suma de precios individuales y el precio del combo
    const ahorro = precioTotalIndividual - combo.precio_combo;

    // Porcentaje de ahorro: si `precioTotalIndividual` > 0, calculamos el % y redondeamos a entero
    const porcentajeAhorro = precioTotalIndividual > 0 
        ? ((ahorro / precioTotalIndividual) * 100).toFixed(0)
        : 0;

    // Construcción de la URL hacia la página de detalle del combo usando su id
    const urlDetalle = `/combo/${combo.combo_id}`;

    // Retornamos el JSX que renderiza la tarjeta visual del combo
    return (
        // `article` actúa como contenedor semántico de la tarjeta
        <article className="group bg-white rounded-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
            {/* Contenedor de imagen - clickeable para ir al detalle */}
            <a href={urlDetalle} className="relative bg-white overflow-hidden aspect-square flex items-center justify-center">
                {/* Imagen principal: se muestra la actual del array de imágenes */}
                <img
                    src={imagenPrincipal}
                    alt={combo.nombre} // texto alternativo accesible
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    loading="lazy" // carga diferida para mejorar performance
                />

                {/* Badges en la esquina superior derecha */}
                <div className="absolute top-1 md:top-2 right-1 md:right-2 flex flex-col gap-1">
                    {/* Badge fijo que indica que es un combo */}
                    <div className="bg-purple-500 text-white text-center text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded font-bold shadow-md">
                        {/* Icono y texto descriptivo */}
                        COMBO
                    </div>
                    {/* Si hay ahorro calculado (>0), mostramos un badge adicional con el % */}
                    {porcentajeAhorro > 0 && (
                        <div className="bg-green-500 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded font-bold shadow-md">
                            AHORRA {porcentajeAhorro}%
                        </div>
                    )}
                </div>

                {/* Indicador en la esquina inferior izquierda con la cantidad de productos incluidos */}
                <div className="absolute bottom-1 md:bottom-2 left-1 md:left-2 bg-black bg-opacity-70 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded font-semibold">
                    {combo.combo_productos?.length || 0} productos
                </div>
            </a>

            {/* Contenedor con información textual del combo */}
            <div className="p-3 flex flex-col flex-grow">
                {/* Nombre del combo (clickeable) */}
                <a href={urlDetalle} className="block">
                    {/* h3: título del combo con limitación de líneas (line-clamp) */}
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
                        {combo.nombre}
                    </h3>
                </a>

                {/* Lista resumida de productos incluidos en el combo (hasta 3) */}
                {combo.combo_productos && combo.combo_productos.length > 0 && (
                    <div className="mb-3">
                        <p className="text-xs text-gray-600 font-medium mb-1">Incluye:</p>
                        <ul className="space-y-1">
                            {/* Mostramos solo los primeros 3 para mantener la tarjeta compacta */}
                            {combo.combo_productos.slice(0, 3).map((item, idx) => (
                                <li key={idx} className="text-xs text-gray-600 line-clamp-1">
                                    {/* Mostrar cantidad y nombre del producto (si está disponible) */}
                                    • {item.cantidad}x {item.productos?.nombre}
                                </li>
                            ))}
                            {/* Si hay más de 3 productos, indicamos cuántos quedan ocultos */}
                            {combo.combo_productos.length > 3 && (
                                <li className="text-xs text-blue-600 font-medium">
                                    + {combo.combo_productos.length - 3} más...
                                </li>
                            )}
                        </ul>
                    </div>
                )}

                {/* Sección de precios ubicada al final (mt-auto empuja hacia abajo) */}
                <div className="mt-auto">
                    <div className="mb-3">
                        {/* Comparación entre la suma de precios individuales y el precio del combo */}
                        <div className="mb-2">
                            {precioTotalIndividual > combo.precio_combo ? (
                                // Si el precio individual total es mayor que el precio del combo, mostramos ahorro
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {/* Precio total individual (tachado) */}
                                        <span className="text-sm text-gray-500 line-through">
                                            {formatearPrecio(precioTotalIndividual)}
                                        </span>
                                    </div>
                                    {/* Precio del combo en grande */}
                                    <div className="text-2xl font-black text-black">
                                        {formatearPrecio(combo.precio_combo)}
                                    </div>
                                    {/* Texto pequeño indicando el monto que se ahorra */}
                                    <p className="text-xs text-gray-500 mt-1">
                                        Ahorrás {formatearPrecio(ahorro)}
                                    </p>
                                </div>
                            ) : (
                                // Si no hay ahorro, simplemente mostramos el precio del combo
                                <div className="text-2xl font-black text-gray-900">
                                    {formatearPrecio(combo.precio_combo)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botón que lleva al detalle del combo */}
                    <a
                        href={urlDetalle}
                        className="block w-full py-2.5 rounded-lg font-semibold text-sm text-center transition-all bg-purple-600 text-white hover:bg-purple-700 active:scale-95"
                    >
                        Ver combo
                    </a>
                </div>
            </div>
        </article>
    );
}
