// Importa los hooks de React para manejar estado y efectos secundarios
import { useState, useEffect } from 'react';
// Importa íconos de Lucide para usar en los botones y UI
import { Plus, Edit2, Trash2, Image as ImageIcon, MoveVertical, Eye, EyeOff } from 'lucide-react';
// Importa el componente Modal para mostrar formularios emergentes
import Modal from '../../ui/Modal';
// Importa los servicios para interactuar con la API de banners
import {
  obtenerTodosBanners,
  crearBanner,
  actualizarBanner,
  eliminarBanner,
  subirImagenBanner,
  reordenarBanners
} from '../../../services/bannersService';

// Componente principal para gestionar banners
export default function BannersManager() {
  // Estado para la lista de banners
  const [banners, setBanners] = useState([]);
  // Estado para mostrar spinner de carga
  const [loading, setLoading] = useState(true);
  // Estado para mostrar/ocultar el modal de edición/creación
  const [modalOpen, setModalOpen] = useState(false);
  // Estado para saber si se está editando un banner existente
  const [editingBanner, setEditingBanner] = useState(null);
  // Estado para el formulario del banner (datos a crear/editar)
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    imagen_url: '',
    orden: 0,
    activo: true
  });
  // Estado para mostrar spinner al subir imagen
  const [uploadingImage, setUploadingImage] = useState(false);

  // useEffect: carga los banners al montar el componente
  useEffect(() => {
    cargarBanners();
  }, []);

  // Función para cargar todos los banners desde la API
  const cargarBanners = async () => {
    try {
      // Obtiene el token JWT del usuario
      const token = localStorage.getItem('supabase_token');
      // Llama al servicio para obtener los banners
      const data = await obtenerTodosBanners(token);
      setBanners(data); // Actualiza el estado con los banners recibidos
    } catch (error) {
      // Si ocurre un error, lo muestra y alerta al usuario
      alert('Error al cargar los banners');
    } finally {
      setLoading(false); // Oculta el spinner de carga
    }
  };

  // Abre el modal para crear o editar un banner
  const handleOpenModal = (banner = null) => {
    if (banner) {
      // Si se pasa un banner, es edición: carga sus datos en el formulario
      setEditingBanner(banner);
      setFormData({
        titulo: banner.titulo || '',
        descripcion: banner.descripcion || '',
        imagen_url: banner.imagen_url || '',
        orden: banner.orden || 0,
        activo: banner.activo
      });
    } else {
      // Si no, es creación: limpia el formulario
      setEditingBanner(null);
      setFormData({
        titulo: '',
        descripcion: '',
        imagen_url: '',
        orden: banners.length, // El nuevo banner va al final
        activo: true
      });
    }
    setModalOpen(true); // Abre el modal
  };

  // Cierra el modal y limpia el formulario
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingBanner(null);
    setFormData({
      titulo: '',
      descripcion: '',
      imagen_url: '',
      orden: 0,
      activo: true
    });
  };

  // Maneja la subida de imagen al backend
  const handleImageUpload = async (file) => {
    try {
      setUploadingImage(true); // Muestra spinner
      const token = localStorage.getItem('supabase_token');
      // Llama al servicio para subir la imagen
      const result = await subirImagenBanner(file, token);
      // Actualiza el campo imagen_url del formulario con la URL recibida
      setFormData({ ...formData, imagen_url: result.url });
    } catch (error) {
      // Si ocurre un error, lo muestra y alerta al usuario
      alert(`Error al subir la imagen: ${error.message || 'Error desconocido'}`);
    } finally {
      setUploadingImage(false); // Oculta spinner
    }
  };

  // Maneja el envío del formulario para crear/editar banner
  const handleSubmit = async (e) => {
    e.preventDefault(); // Previene recarga de página
    try {
      const token = localStorage.getItem('supabase_token');
      // Valida que se haya subido una imagen
      if (!formData.imagen_url) {
        alert('Debes subir una imagen');
        return;
      }
      // Si se está editando, actualiza el banner
      if (editingBanner) {
        await actualizarBanner(editingBanner.banner_id, formData, token);
      } else {
        // Si no, crea un nuevo banner
        await crearBanner(formData, token);
      }
      // Recarga la lista de banners y cierra el modal
      await cargarBanners();
      handleCloseModal();
    } catch (error) {
      // Si ocurre un error, lo muestra y alerta al usuario
      alert('Error al guardar el banner');
    }
  };

  // Maneja la eliminación de un banner
  const handleDelete = async (bannerId) => {
    // Confirma con el usuario antes de eliminar
    if (!confirm('¿Estás seguro de eliminar este banner?')) return;
    try {
      const token = localStorage.getItem('supabase_token');
      await eliminarBanner(bannerId, token); // Llama al servicio para eliminar
      await cargarBanners(); // Recarga la lista
    } catch (error) {
      alert('Error al eliminar el banner');
    }
  };

  // Cambia el estado activo/inactivo de un banner
  const handleToggleActivo = async (banner) => {
    try {
      const token = localStorage.getItem('supabase_token');
      await actualizarBanner(
        banner.banner_id,
        { activo: !banner.activo },
        token
      );
      await cargarBanners();
    } catch (error) {
      alert('Error al actualizar el estado del banner');
    }
  };

  // Mueve un banner hacia arriba en el orden
  const moveUp = async (index) => {
    if (index === 0) return; // No puede subir si ya está primero
    const newBanners = [...banners];
    // Intercambia posiciones con el anterior
    [newBanners[index], newBanners[index - 1]] = [newBanners[index - 1], newBanners[index]];
    // Actualiza el orden de todos los banners
    const bannersConOrden = newBanners.map((banner, idx) => ({
      banner_id: banner.banner_id,
      orden: idx
    }));
    try {
      const token = localStorage.getItem('supabase_token');
      await reordenarBanners(bannersConOrden, token); // Llama al servicio para actualizar orden
      await cargarBanners(); // Recarga la lista
    } catch (error) {
      alert('Error al reordenar los banners');
    }
  };

  // Mueve un banner hacia abajo en el orden
  const moveDown = async (index) => {
    if (index === banners.length - 1) return; // No puede bajar si ya está último
    const newBanners = [...banners];
    // Intercambia posiciones con el siguiente
    [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
    // Actualiza el orden de todos los banners
    const bannersConOrden = newBanners.map((banner, idx) => ({
      banner_id: banner.banner_id,
      orden: idx
    }));
    try {
      const token = localStorage.getItem('supabase_token');
      await reordenarBanners(bannersConOrden, token); // Llama al servicio para actualizar orden
      await cargarBanners(); // Recarga la lista
    } catch (error) {
      alert('Error al reordenar los banners');
    }
  };

  // Si está cargando, muestra spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Cargando banners...</p>
      </div>
    );
  }

  // Renderiza la interfaz principal de gestión de banners
  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-3xl font-bold text-gray-800">Gestión de Banners</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">Administra los banners del slider principal</p>
      </div>

      {/* Botón de crear banner */}
      <div className="mb-4 md:mb-6">
        <button
          onClick={() => handleOpenModal()}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nuevo Banner
        </button>
      </div>

      {/* Si no hay banners, muestra mensaje y botón para crear el primero */}
      {banners.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 md:p-8 text-center">
          <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">No hay banners configurados</p>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Crear primer banner
          </button>
        </div>
      ) : (
        // Si hay banners, muestra el grid de banners
        <div className="grid grid-cols-1 gap-4">
          {banners.map((banner, index) => (
            <div
              key={banner.banner_id}
              className={`bg-white rounded-lg shadow-md overflow-hidden ${
                !banner.activo ? 'opacity-60' : ''
              }`}
            >
              <div className="flex flex-col md:flex-row">
                {/* Imagen del banner */}
                <div className="md:w-1/3 bg-gray-100">
                  <img
                    src={banner.imagen_url}
                    alt={banner.titulo || 'Banner'}
                    className="w-full h-48 object-cover"
                  />
                </div>

                {/* Contenido textual del banner */}
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {banner.titulo || 'Sin título'}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {banner.descripcion || 'Sin descripción'}
                      </p>
                    </div>
                    {/* Badge de estado activo/inactivo */}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      banner.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {banner.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  {/* Botones de acciones para el banner */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleToggleActivo(banner)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                      title={banner.activo ? 'Desactivar' : 'Activar'}
                    >
                      {banner.activo ? <EyeOff size={16} /> : <Eye size={16} />}
                      {banner.activo ? 'Desactivar' : 'Activar'}
                    </button>

                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      title="Mover arriba"
                    >
                      ↑
                    </button>

                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === banners.length - 1}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      title="Mover abajo"
                    >
                      ↓
                    </button>

                    <button
                      onClick={() => handleOpenModal(banner)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors text-sm"
                    >
                      <Edit2 size={16} />
                      Editar
                    </button>

                    <button
                      onClick={() => handleDelete(banner.banner_id)}
                      className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para crear/editar banner */}
      <Modal isOpen={modalOpen} onClose={handleCloseModal} title={editingBanner ? 'Editar Banner' : 'Nuevo Banner'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título (opcional)
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Promoción Pañales Pampers"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción del banner..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen del Banner *
            </label>
            {formData.imagen_url ? (
              <div className="mb-4">
                <img
                  src={formData.imagen_url}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg mb-2"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, imagen_url: '' })}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Cambiar imagen
                </button>
              </div>
            ) : (
              // Input para subir imagen
              <div className="space-y-2">
                <label className="relative cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  <div className={`
                    border-2 border-dashed rounded-lg p-8 text-center
                    ${uploadingImage 
                      ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                      : 'border-blue-300 hover:border-blue-500 bg-blue-50 hover:bg-blue-100 cursor-pointer'}
                    transition-all duration-200
                  `}>
                    <div className="flex flex-col items-center gap-2">
                      {uploadingImage ? (
                        <>
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                          <span className="text-sm text-gray-600">Subiendo imagen...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="text-sm font-medium text-blue-600">
                            Haz clic para seleccionar una imagen
                          </span>
                          <span className="text-xs text-gray-500">
                            Recomendado: 1920x600px • PNG, JPG, WEBP
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </label>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Banner activo</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploadingImage || !formData.imagen_url}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingBanner ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
