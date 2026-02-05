const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Servicio para gestionar banners
 */

// Obtener todos los banners activos (público)
export const obtenerBannersActivos = async () => {
  try {
    const response = await fetch(`${API_URL}/banners`);
    if (!response.ok) {
      throw new Error('Error al obtener banners');
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Obtener todos los banners (admin)
export const obtenerTodosBanners = async (token) => {
  try {
    const response = await fetch(`${API_URL}/banners/admin`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Error al obtener banners');
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Obtener banner por ID
export const obtenerBannerPorId = async (bannerId, token) => {
  try {
    const response = await fetch(`${API_URL}/banner/${bannerId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Error al obtener banner');
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Crear banner
export const crearBanner = async (bannerData, token) => {
  try {
    const response = await fetch(`${API_URL}/banner`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bannerData)
    });
    if (!response.ok) {
      throw new Error('Error al crear banner');
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Actualizar banner
export const actualizarBanner = async (bannerId, bannerData, token) => {
  try {
    const response = await fetch(`${API_URL}/banner/${bannerId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bannerData)
    });
    if (!response.ok) {
      throw new Error('Error al actualizar banner');
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Eliminar banner
export const eliminarBanner = async (bannerId, token) => {
  try {
    const response = await fetch(`${API_URL}/banner/${bannerId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error('Error al eliminar banner');
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Subir imagen de banner
export const subirImagenBanner = async (file, token) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}/banner/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
};

// Reordenar banners
export const reordenarBanners = async (banners, token) => {
  try {
    const response = await fetch(`${API_URL}/banners/reordenar`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ banners })
    });
    if (!response.ok) {
      throw new Error('Error al reordenar banners');
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};
