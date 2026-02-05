import { api } from '../hooks/useApi.js';

/**
 * Servicio para manejar todas las operaciones relacionadas con combos
 */
export const combosService = {
    /**
     * Obtiene una lista de todos los combos con opciones de filtrado
     * @param {object} filtros - Filtros a aplicar (activo, vigentes, con_productos, etc.)
     * @returns {Promise<Array>} - Array de combos
     */
    obtenerTodos: async (filtros = {}) => {
        const params = new URLSearchParams(filtros).toString();
        const endpoint = params ? `/combos?${params}` : '/combos';
        return api.get(endpoint);
    },

    /**
     * Obtiene un combo por su ID con sus productos asociados
     * @param {number|string} id - ID del combo
     * @returns {Promise<object>} - Objeto del combo con sus productos
     */
    obtenerPorId: async (id) => {
        return api.get(`/combo/${id}`);
    },

    /**
     * Crea un nuevo combo
     * @param {object} combo - Datos del combo (nombre, descripcion, precio_combo, productos[], etc.)
     * @returns {Promise<object>} - Combo creado
     */
    crear: async (combo) => {
        return api.post('/combo', combo);
    },

    /**
     * Actualiza un combo existente
     * @param {number|string} id - ID del combo
     * @param {object} combo - Datos actualizados del combo
     * @returns {Promise<object>} - Combo actualizado
     */
    actualizar: async (id, combo) => {
        return api.put(`/combo/${id}`, combo);
    },

    /**
     * Elimina un combo por su ID
     * @param {number|string} id - ID del combo a eliminar
     * @returns {Promise<object>} - Mensaje de confirmación
     */
    eliminar: async (id) => {
        return api.delete(`/combo/${id}`);
    },

    /**
     * Agrega un producto a un combo existente
     * @param {number|string} comboId - ID del combo
     * @param {object} producto - Objeto con producto_id y cantidad
     * @returns {Promise<object>} - Relación creada
     */
    agregarProducto: async (comboId, producto) => {
        return api.post(`/combo/${comboId}/producto`, producto);
    },

    /**
     * Elimina un producto de un combo
     * @param {number|string} comboId - ID del combo
     * @param {number|string} productoId - ID del producto a eliminar
     * @returns {Promise<object>} - Mensaje de confirmación
     */
    eliminarProducto: async (comboId, productoId) => {
        return api.delete(`/combo/${comboId}/producto/${productoId}`);
    },

    /**
     * Obtiene combos activos y vigentes (para mostrar en el frontend público)
     * @returns {Promise<Array>} - Array de combos activos
     */
    obtenerActivos: async () => {
        return api.get('/combos?activo=true&vigentes=true&con_productos=true');
    }
};
