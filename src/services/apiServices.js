// Importa el objeto 'api' que contiene los métodos HTTP (get, post, put, delete) ya configurados.
// Esto nos permite reutilizar la lógica de 'fetch' y la gestión de autenticación.
import { api } from '../hooks/useApi.js';

/**
 * Servicio para manejar todas las operaciones CRUD (Crear, Leer, Actualizar, Eliminar)
 * relacionadas con los productos. Cada método aquí corresponde a un endpoint de la API.
 */
export const productosService = {
    /**
     * Obtiene una lista de todos los productos, con la opción de aplicar filtros.
     * @param {object} filtros - Un objeto con los filtros a aplicar (ej. { nombre: 'iPhone' }).
     * @returns {Promise<Array>} - Una promesa que se resuelve con un array de productos.
     */
    obtenerTodos: async (filtros = {}) => {
        // Convierte el objeto de filtros en una cadena de consulta URL (query string).
        // Ejemplo: { categoria: 1, stock_min: 10 } se convierte en "categoria=1&stock_min=10".
        const params = new URLSearchParams(filtros).toString();
        // Construye el endpoint. Si hay parámetros, los añade a la URL.
        const endpoint = params ? `/productos?${params}` : '/productos';
        // Llama al método GET del objeto 'api' con el endpoint construido.
        return api.get(endpoint);
    },

    /**
     * Obtiene un único producto por su ID.
     * @param {number|string} id - El ID del producto a obtener.
     * @returns {Promise<object>} - Una promesa que se resuelve con el objeto del producto.
     */
    obtenerPorId: async (id) => {
        // Llama al método GET para el endpoint específico de un producto.
        return api.get(`/producto/${id}`);
    },

    /**
     * Crea un nuevo producto en la base de datos.
     * @param {object} producto - El objeto con los datos del nuevo producto.
     * @returns {Promise<object>} - Una promesa que se resuelve con el producto recién creado.
     */
    crear: async (producto) => {
        // Llama al método POST, enviando los datos del producto en el cuerpo de la petición.
        return api.post('/producto', producto);
    },

    /**
     * Actualiza un producto existente por su ID.
     * @param {number|string} id - El ID del producto a actualizar.
     * @param {object} producto - El objeto con los datos actualizados del producto.
     * @returns {Promise<object>} - Una promesa que se resuelve con el producto actualizado.
     */
    actualizar: async (id, producto) => {
        // Llama al método PUT para actualizar el recurso, pasando el ID y los nuevos datos.
        return api.put(`/producto/${id}`, producto);
    },

    /**
     * Elimina un producto por su ID.
     * @param {number|string} id - El ID del producto a eliminar.
     * @returns {Promise<object>} - Una promesa que se resuelve con un mensaje de confirmación.
     */
    eliminar: async (id) => {
        // Llama al método DELETE para el endpoint del producto específico.
        return api.delete(`/producto/${id}`);
    },

    /**
     * Obtiene todos los productos que pertenecen a una categoría específica.
     * @param {number|string} categoriaId - El ID de la categoría.
     * @returns {Promise<Array>} - Una promesa que se resuelve con un array de productos filtrados.
     */
    filtrarPorCategoria: async (categoriaId) => {
        // Llama al método GET usando un query param para filtrar por categoría.
        return api.get(`/productos?categoria_id=${categoriaId}`);
    },
};

/**
 * Servicio para manejar las operaciones CRUD de las categorías.
 */
export const categoriasService = {
    /**
     * Obtiene una lista de todas las categorías.
     * @returns {Promise<Array>} - Una promesa que se resuelve con un array de categorías.
     */
    obtenerTodas: async () => {
        return api.get('/categorias');
    },

    /**
     * Obtiene una única categoría por su ID.
     * @param {number|string} id - El ID de la categoría a obtener.
     * @returns {Promise<object>} - Una promesa que se resuelve con el objeto de la categoría.
     */
    obtenerPorId: async (id) => {
        return api.get(`/categorias/${id}`);
    },

    /**
     * Crea una nueva categoría.
     * @param {object} categoria - El objeto con los datos de la nueva categoría.
     * @returns {Promise<object>} - Una promesa que se resuelve con la categoría recién creada.
     */
    crear: async (categoria) => {
        return api.post('/categorias', categoria);
    },

    /**
     * Actualiza una categoría existente por su ID.
     * @param {number|string} id - El ID de la categoría a actualizar.
     * @param {object} categoria - El objeto con los datos actualizados.
     * @returns {Promise<object>} - Una promesa que se resuelve con la categoría actualizada.
     */
    actualizar: async (id, categoria) => {
        return api.put(`/categorias/${id}`, categoria);
    },

    /**
     * Elimina una categoría por su ID.
     * @param {number|string} id - El ID de la categoría a eliminar.
     * @returns {Promise<object>} - Una promesa que se resuelve con un mensaje de confirmación.
     */
    eliminar: async (id) => {
        return api.delete(`/categorias/${id}`);
    },
};

// =========================
// NOTA: Los siguientes servicios están comentados porque no tienen
// endpoints implementados en el backend actual.
// Descoméntalos cuando implementes las rutas correspondientes.
// =========================

/**
 * Servicio para manejar las operaciones CRUD de los pedidos.
 * ESTADO: NO IMPLEMENTADO EN EL BACKEND
 */
/*
export const pedidosService = {
    obtenerTodos: async () => {
        return api.get('/pedidos');
    },

    obtenerPorCliente: async (clienteId) => {
        return api.get(`/pedidos/${clienteId}`);
    },

    obtenerPorId: async (id) => {
        return api.get(`/pedido/${id}`);
    },

    crear: async (pedido) => {
        return api.post('/pedido', pedido);
    },

    actualizar: async (id, pedido) => {
        return api.put(`/pedido/${id}`, pedido);
    },

    eliminar: async (id) => {
        return api.delete(`/pedido/${id}`);
    },
};
*/

/**
 * Servicio para manejar las operaciones CRUD de los clientes.
 * ESTADO: NO IMPLEMENTADO EN EL BACKEND
 */
/*
export const clientesService = {
    obtenerTodos: async () => {
        return api.get('/clientes');
    },

    obtenerPorId: async (id) => {
        return api.get(`/clientes/${id}`);
    },

    crear: async (cliente) => {
        return api.post('/clientes', cliente);
    },

    actualizar: async (id, cliente) => {
        return api.put(`/clientes/${id}`, cliente);
    },

    eliminar: async (id) => {
        return api.delete(`/clientes/${id}`);
    },
};
*/

/**
 * Servicio para manejar las operaciones CRUD de las imágenes de productos.
 * Cada producto puede tener múltiples imágenes asociadas en la tabla 'producto_imagenes'.
 */
export const productoImagenesService = {
    /**
     * Obtiene todas las imágenes de un producto específico.
     * @param {number|string} productoId - El ID del producto.
     * @returns {Promise<Array>} - Una promesa que se resuelve con un array de imágenes.
     */
    obtenerPorProducto: async (productoId) => {
        return api.get(`/producto_imagenes/${productoId}`);
    },

    /**
     * Agrega una nueva imagen a un producto.
     * @param {object} imagen - El objeto con los datos de la imagen { producto_id, url, descripcion }.
     * @returns {Promise<object>} - Una promesa que se resuelve con la imagen creada.
     */
    agregar: async (imagen) => {
        return api.post('/producto_imagenes', imagen);
    },

    /**
     * Elimina una imagen por su ID.
     * @param {number|string} imagenId - El ID de la imagen a eliminar.
     * @returns {Promise<object>} - Una promesa que se resuelve con un mensaje de confirmación.
     */
    eliminar: async (imagenId) => {
        return api.delete(`/producto_imagenes/${imagenId}`);
    },

    /**
     * Actualiza la descripción de una imagen.
     * @param {number|string} imagenId - El ID de la imagen a actualizar.
     * @param {string} descripcion - La nueva descripción.
     * @returns {Promise<object>} - Una promesa que se resuelve con la imagen actualizada.
     */
    actualizar: async (imagenId, descripcion) => {
        return api.put(`/producto_imagenes/${imagenId}`, { descripcion });
    },
};