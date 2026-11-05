// Servicio para obtener productos públicos directamente desde Supabase
// Este servicio se usa en páginas públicas que no requieren autenticación
import { supabase } from '../lib/supabaseCliente.js';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Función auxiliar para reintentar consultas fallidas
 * @param {Function} fn - Función asíncrona a ejecutar
 * @param {number} retries - Número de reintentos (default: 2)
 * @param {number} delay - Delay entre reintentos en ms (default: 1000)
 */
const retryQuery = async (fn, retries = 2, delay = 1000) => {
    let lastError;
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (i < retries) {
                // Esperar antes de reintentar
                await new Promise(resolve => setTimeout(resolve, delay));
                console.warn(`Reintento ${i + 1}/${retries} después de error:`, error.message);
            }
        }
    }
    throw lastError;
};

/**
 * Servicio para consultas públicas de productos
 * No requiere autenticación, ideal para el catálogo público
 */
export const productosPublicosService = {
    /**
     * Obtiene productos con filtros y paginación
     * @param {Object} opciones - Opciones de filtrado y paginación
     * @param {number} opciones.pagina - Número de página (empieza en 1)
     * @param {number} opciones.porPagina - Cantidad de productos por página (default: 12)
     * @param {number} opciones.categoria_id - ID de categoría para filtrar
     * @param {string} opciones.marca - Marca para filtrar
     * @param {number} opciones.precioMin - Precio mínimo
     * @param {number} opciones.precioMax - Precio máximo
     * @param {string} opciones.busqueda - Texto de búsqueda en nombre/descripción
     * @param {string} opciones.ordenar - Campo para ordenar (nombre, precio, created_at)
     * @param {boolean} opciones.ordenAsc - true = ascendente, false = descendente
     * @param {boolean} opciones.soloOfertas - true = solo productos con ofertas activas
     * @returns {Promise<{productos: Array, total: number, paginas: number}>}
     */
    obtenerConFiltros: async (opciones = {}) => {
        const {
            pagina = 1,
            porPagina = 12,
            categoria_id = null,
            marca = null,
            precioMin = null,
            precioMax = null,
            busqueda = '',
            ordenar = 'nombre',
            ordenAsc = true,
            soloOfertas = false
        } = opciones;

        // Calcula el rango para la paginación
        const desde = (pagina - 1) * porPagina;
        const hasta = desde + porPagina - 1;

        // Construye la consulta base
        let query = supabase
            .from('productos')
            .select(`
                *,
                categorias (
                    categoria_id,
                    nombre
                ),
                marcas (
                    marca_id,
                    nombre
                )
            `, { count: 'exact' })
            .eq('activo', true); // Solo productos activos

        // Aplica filtros
        if (categoria_id) {
            query = query.eq('categoria_id', categoria_id);
        }

        if (marca && marca.trim() !== '') {
            query = query.ilike('marcas.nombre', marca);
        }

        if (precioMin !== null && precioMin > 0) {
            query = query.gte('precio', precioMin);
        }

        if (precioMax !== null && precioMax > 0) {
            query = query.lte('precio', precioMax);
        }

        if (busqueda && busqueda.trim() !== '') {
            // Búsqueda en nombre o descripción (case insensitive)
            // Si busqueda contiene comas, dividir y crear múltiples condiciones OR
            const palabras = busqueda.split(',').map(p => p.trim()).filter(p => p !== '');
            
            if (palabras.length > 1) {
                // Múltiples palabras: crear condición OR para cada una
                const condiciones = palabras.flatMap(palabra => [
                    `nombre.ilike.%${palabra}%`,
                    `descripcion.ilike.%${palabra}%`
                ]);
                query = query.or(condiciones.join(','));
            } else {
                // Una sola palabra
                query = query.or(`nombre.ilike.%${busqueda}%,descripcion.ilike.%${busqueda}%`);
            }
        }

        // Aplica ordenamiento
        query = query.order(ordenar, { ascending: ordenAsc });

        // Aplica paginación
        query = query.range(desde, hasta);

        // Ejecuta la consulta con reintentos
        const result = await retryQuery(async () => {
            const queryResult = await query;
            if (queryResult.error) {
                throw queryResult.error;
            }
            return queryResult;
        });
        
        const { data, error, count } = result;

        // Obtener ofertas activas para todos los productos (sin bloquear si falla)
        const now = new Date().toISOString();
        let ofertasActivas = [];
        try {
            const { data: ofertasData, error: errorOfertas } = await supabase
                .from('ofertas')
                .select('*')
                .eq('activo', true)
                .lte('fecha_inicio', now)
                .gte('fecha_fin', now);

            if (!errorOfertas && ofertasData) {
                ofertasActivas = ofertasData;
            } else if (errorOfertas) {
                console.error('Error al cargar ofertas:', errorOfertas);
            }
        } catch (err) {
            console.error('Excepción al cargar ofertas:', err);
        }

        // Obtener combos activos (sin bloquear si falla)
        let combosActivos = [];
        try {
            const { data: combosData, error: errorCombos } = await supabase
                .from('combos')
                .select(`
                    combo_id,
                    nombre,
                    precio_combo,
                    activo,
                    productos:combo_productos(
                        cantidad,
                        producto_id
                    )
                `)
                .eq('activo', true);

            if (!errorCombos && combosData) {
                combosActivos = combosData;
            } else if (errorCombos) {
                console.error('Error al cargar combos:', errorCombos);
            }
        } catch (err) {
            console.error('Excepción al cargar combos:', err);
        }

        // Crear mapa de ofertas por producto_id
        const ofertasMap = {};
        (ofertasActivas || []).forEach(oferta => {
            ofertasMap[oferta.producto_id] = oferta;
        });

        // Crear mapa de combos por producto_id
        const combosMap = {};
        (combosActivos || []).forEach(combo => {
            combo.productos?.forEach(cp => {
                if (!combosMap[cp.producto_id]) {
                    combosMap[cp.producto_id] = [];
                }
                combosMap[cp.producto_id].push({
                    combo_id: combo.combo_id,
                    nombre: combo.nombre,
                    precio_combo: combo.precio_combo
                });
            });
        });

        // Procesa los productos para agregar la imagen principal, ofertas y combos
        let productosFormateados = (data || []).map(producto => {
            // Usa imagen_url del producto o la primera imagen de producto_imagenes
            const imagenPrincipal = producto.imagen_url || producto.imagenes?.[0]?.url || '/images/placeholder.svg';
            
            // Buscar oferta activa para este producto
            const ofertaActiva = ofertasMap[producto.producto_id];
            
            // Calcular precio con descuento si hay oferta
            let precioConDescuento = null;
            let descuento = null;
            if (ofertaActiva) {
                // Intenta obtener el descuento (puede ser descuento_porcentaje o descuento)
                descuento = ofertaActiva.descuento_porcentaje || ofertaActiva.descuento;
                if (descuento) {
                    precioConDescuento = producto.precio * (1 - descuento / 100);
                }
            }

            // Obtener combos de este producto
            const combosProducto = combosMap[producto.producto_id] || [];
            
            return {
                ...producto,
                imagen_principal: imagenPrincipal,
                categoria_nombre: producto.categorias?.nombre || 'Sin categoría',
                todas_imagenes: [], // Vaciado temporalmente
                // Datos de oferta
                tiene_oferta: !!ofertaActiva && !!descuento,
                descuento: descuento,
                precio_con_descuento: precioConDescuento,
                precio_original: producto.precio,
                // Datos de combos
                tiene_combo: combosProducto.length > 0,
                combos: combosProducto
            };
        });

        // Filtrar por ofertas si se solicita
        if (soloOfertas) {
            productosFormateados = productosFormateados.filter(p => p.tiene_oferta);
        }

        // Calcular el total después de filtros adicionales
        const totalFiltrado = productosFormateados.length;
        const totalPaginas = Math.ceil(totalFiltrado / porPagina);

        return {
            productos: productosFormateados,
            total: soloOfertas ? totalFiltrado : (count || 0),
            paginas: soloOfertas ? totalPaginas : (count ? Math.ceil(count / porPagina) : 0),
            paginaActual: pagina,
            porPagina
        };
    },

    /**
     * Obtiene un producto por su ID con todas sus imágenes y ofertas activas
     * @param {number} id - ID del producto
     * @returns {Promise<Object>}
     */
    obtenerPorId: async (id) => {
        const { data, error } = await supabase
            .from('productos')
            .select(`
                *,
                categorias (
                    categoria_id,
                    nombre
                ),
                imagenes:producto_imagenes (
                    imagen_id,
                    url,
                    descripcion,
                    orden
                ),
                sabores:producto_sabores (
                    sabor_id,
                    nombre
                )
            `)
            .eq('producto_id', id)
            .eq('activo', true)
            .single();

        if (error) {
            throw error;
        }

        try {
            const saboresResponse = await fetch(`${API_BASE_URL}/producto/${id}/sabores`);
            if (!saboresResponse.ok) {
                throw new Error(`No se pudieron cargar los sabores (${saboresResponse.status})`);
            }
            data.sabores = await saboresResponse.json();
        } catch (saboresError) {
            console.error('Error al cargar sabores del producto:', saboresError);
        }

        // Ordenar las imágenes por el campo orden si existen
        if (data?.imagenes && data.imagenes.length > 0) {
            data.imagenes = data.imagenes.sort((a, b) => (a.orden || 0) - (b.orden || 0));
        }

        // Obtener ofertas activas para el producto
        const now = new Date().toISOString();
        const { data: ofertas, error: errorOferta } = await supabase
            .from('ofertas')
            .select('*')
            .eq('producto_id', id)
            .eq('activo', true)
            .lte('fecha_inicio', now)
            .gte('fecha_fin', now)
            .limit(1)
            .single();

        // Si hay oferta activa, calcular precio con descuento
        if (ofertas && !errorOferta) {
            data.oferta = ofertas;
            data.precio_original = data.precio;
            data.precio_con_descuento = data.precio * (1 - ofertas.descuento / 100);
            data.descuento = ofertas.descuento;
        }

        if (errorOferta && errorOferta.code !== 'PGRST116') {
            // PGRST116 = no rows returned, no es un error real
            console.error('Error al cargar oferta del producto:', errorOferta);
        }

        return data;
    },

    /**
     * Obtiene productos destacados (puedes usar un campo 'destacado' o los más recientes)
     * @param {number} limite - Cantidad de productos a obtener
     * @returns {Promise<Array>}
     */
    obtenerDestacados: async (limite = 8) => {
        const { data, error } = await supabase
            .from('productos')
            .select(`
                *,
                categorias (
                    categoria_id,
                    nombre
                )
            `)
            .eq('activo', true)
            .order('created_at', { ascending: false })
            .limit(limite);

        if (error) {
            throw error;
        }

        // Procesa las imágenes
        return (data || []).map(producto => {
            // Usa imagen_url del producto o la primera imagen de producto_imagenes
            const imagenPrincipal = producto.imagen_url || producto.imagenes?.[0]?.url || '/images/placeholder.svg';
            
            return {
                ...producto,
                imagen_principal: imagenPrincipal
            };
        });
    }
};

/**
 * Servicio para obtener categorías públicas
 */
export const categoriasPublicasService = {
    /**
     * Obtiene todas las categorías activas
     * @returns {Promise<Array>}
     */
    obtenerTodas: async () => {
        const { data, error } = await supabase
            .from('categorias')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) {
            console.error('Error al obtener categorías:', error);
            throw error;
        }

        return data || [];
    },

    /**
     * Obtiene una categoría por su ID
     * @param {number} id - ID de la categoría
     * @returns {Promise<Object>}
     */
    obtenerPorId: async (id) => {
        const { data, error } = await supabase
            .from('categorias')
            .select('*')
            .eq('categoria_id', id)
            .single();

        if (error) {
            throw error;
        }

        return data;
    },

    /**
     * Obtiene el rango de precios disponible en el catálogo
     * @returns {Promise<{min: number, max: number}>}
     */
    obtenerRangoPrecios: async () => {
        const { data, error } = await supabase
            .from('productos')
            .select('precio')
            .eq('activo', true);

        if (error || !data || data.length === 0) {
            return { min: 0, max: 0 };
        }

        const precios = data.map(p => p.precio).filter(p => p !== null);
        
        return {
            min: Math.min(...precios),
            max: Math.max(...precios)
        };
    },

    /**
     * Obtiene todas las marcas únicas disponibles
     * @returns {Promise<Array<string>>}
     */
    obtenerMarcas: async () => {
        const { data, error } = await supabase
            .from('productos')
            .select('marcas (marca_id, nombre)')
            .eq('activo', true);

        if (error || !data) {
            return [];
        }

        // Extrae marcas únicas y cuenta productos por marca
        const marcasMap = {};
        data.forEach(p => {
            const marca = p.marcas?.nombre;
            if (marca) {
                marcasMap[marca] = (marcasMap[marca] || 0) + 1;
            }
        });

        // Convierte a array y ordena por cantidad
        return Object.entries(marcasMap)
            .map(([marca, count]) => ({ marca, count }))
            .sort((a, b) => b.count - a.count);
    }
};

/**
 * Servicio para obtener combos públicos
 */
export const combosPublicosService = {
    /**
     * Obtiene todos los combos activos y vigentes con paginación
     * @param {Object} opciones - Opciones de paginación
     * @param {number} opciones.pagina - Número de página (empieza en 1)
     * @param {number} opciones.porPagina - Cantidad de combos por página
     * @returns {Promise<{combos: Array, total: number, paginas: number}>}
     */
    obtenerActivos: async (opciones = {}) => {
        const {
            pagina = 1,
            porPagina = 12
        } = opciones;

        const desde = (pagina - 1) * porPagina;
        const hasta = desde + porPagina - 1;

        const now = new Date().toISOString();
        
        const { data, error, count } = await supabase
            .from('combos')
            .select(`
                *,
                combo_productos(
                    cantidad,
                    productos(
                        producto_id,
                        nombre,
                        marca,
                        modelo,
                        precio,
                        imagen_url,
                        stock,
                        descripcion
                    )
                )
            `, { count: 'exact' })
            .eq('activo', true)
            .lte('fecha_inicio', now)
            .gte('fecha_fin', now)
            .order('created_at', { ascending: false })
            .range(desde, hasta);

        if (error) {
            throw error;
        }

        const totalPaginas = count ? Math.ceil(count / porPagina) : 0;

        return {
            combos: data || [],
            total: count || 0,
            paginas: totalPaginas,
            paginaActual: pagina,
            porPagina
        };
    },

    /**
     * Obtiene un combo por su ID
     * @param {number} id - ID del combo
     * @returns {Promise<Object>}
     */
    obtenerPorId: async (id) => {
        const { data, error } = await supabase
            .from('combos')
            .select(`
                *,
                combo_productos(
                    cantidad,
                    productos(
                        producto_id,
                        nombre,
                        marca,
                        modelo,
                        precio,
                        imagen_url,
                        stock,
                        descripcion
                    )
                )
            `)
            .eq('combo_id', id)
            .eq('activo', true)
            .single();

        if (error) {
            throw error;
        }

        // Calcular precio de ahorro
        if (data?.combo_productos) {
            let precioTotal = 0;
            data.combo_productos.forEach(item => {
                if (item.productos) {
                    precioTotal += item.productos.precio * item.cantidad;
                }
            });
            data.precio_total_individual = precioTotal;
            data.ahorro = precioTotal - data.precio_combo;
            data.porcentaje_ahorro = ((data.ahorro / precioTotal) * 100).toFixed(2);
        }

        return data;
    }
};

/**
 * Servicio para obtener ofertas públicas
 */
export const ofertasPublicasService = {
    /**
     * Obtiene todas las ofertas activas y vigentes
     * @returns {Promise<Array>}
     */
    obtenerActivas: async () => {
        const now = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('ofertas')
            .select(`
                *,
                productos(
                    producto_id,
                    nombre,
                    marca,
                    precio,
                    imagen_url,
                    stock,
                    categoria:categorias(categoria_id, nombre)
                )
            `)
            .eq('activo', true)
            .lte('fecha_inicio', now)
            .gte('fecha_fin', now)
            .order('descuento', { ascending: false });

        if (error) {
            throw error;
        }

        // Calcular precio con descuento
        return (data || []).map(oferta => {
            if (oferta.productos) {
                oferta.productos.precio_original = oferta.productos.precio;
                oferta.productos.precio_con_descuento = oferta.productos.precio * (1 - oferta.descuento / 100);
                oferta.productos.descuento = oferta.descuento;
            }
            return oferta;
        });
    },

    /**
     * Obtiene ofertas para un producto específico
     * @param {number} productoId - ID del producto
     * @returns {Promise<Object|null>}
     */
    obtenerPorProducto: async (productoId) => {
        const now = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('ofertas')
            .select('*')
            .eq('producto_id', productoId)
            .eq('activo', true)
            .lte('fecha_inicio', now)
            .gte('fecha_fin', now)
            .order('descuento', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            // No hay oferta activa, no es un error crítico
            return null;
        }

        return data;
    }
};
