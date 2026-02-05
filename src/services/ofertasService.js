import { api } from '../hooks/useApi.js';

/**
 * Servicio para manejar todas las operaciones relacionadas con ofertas
 */
export const ofertasService = {
    /**
     * Obtiene una lista de todas las ofertas con opciones de filtrado
     * @param {object} filtros - Filtros a aplicar (activo, vigentes, producto_id, tipo_oferta, etc.)
     * @returns {Promise<Array>} - Array de ofertas
     */
    obtenerTodas: async (filtros = {}) => {
        const params = new URLSearchParams(filtros).toString();
        const endpoint = params ? `/ofertas?${params}` : '/ofertas';
        return api.get(endpoint);
    },

    /**
     * Obtiene una oferta por su ID
     * @param {number|string} id - ID de la oferta
     * @returns {Promise<object>} - Objeto de la oferta con datos del producto
     */
    obtenerPorId: async (id) => {
        return api.get(`/oferta/${id}`);
    },

    /**
     * Crea una nueva oferta
     * @param {object} oferta - Datos de la oferta (producto_id, descuento, fecha_inicio, fecha_fin, activo, tipo_oferta)
     * @returns {Promise<object>} - Oferta creada
     */
    crear: async (oferta) => {
        return api.post('/oferta', oferta);
    },

    /**
     * Actualiza una oferta existente
     * @param {number|string} id - ID de la oferta
     * @param {object} oferta - Datos actualizados de la oferta
     * @returns {Promise<object>} - Oferta actualizada
     */
    actualizar: async (id, oferta) => {
        return api.put(`/oferta/${id}`, oferta);
    },

    /**
     * Elimina una oferta por su ID
     * @param {number|string} id - ID de la oferta a eliminar
     * @returns {Promise<object>} - Mensaje de confirmación
     */
    eliminar: async (id) => {
        return api.delete(`/oferta/${id}`);
    },

    /**
     * Obtiene todas las ofertas activas para un producto específico
     * @param {number|string} productoId - ID del producto
     * @returns {Promise<Array>} - Array de ofertas activas del producto
     */
    obtenerPorProducto: async (productoId) => {
        return api.get(`/producto/${productoId}/ofertas`);
    },

    /**
     * Activa o desactiva una oferta (toggle)
     * @param {number|string} id - ID de la oferta
     * @returns {Promise<object>} - Oferta con estado actualizado
     */
    toggle: async (id) => {
        return api.patch(`/oferta/${id}/toggle`);
    },

    /**
     * Obtiene ofertas activas y vigentes (para mostrar en el frontend público)
     * @returns {Promise<Array>} - Array de ofertas activas
     */
    obtenerActivas: async () => {
        return api.get('/ofertas?activo=true&vigentes=true');
    }
};
