// Importa los hooks de React para manejar estado y efectos secundarios
import { useState, useEffect } from 'react';
// Importa el componente de tabla reutilizable para mostrar datos
import DataTable from '../../ui/DataTable.jsx';
// Importa el componente Modal para formularios emergentes
import Modal from '../../ui/Modal.jsx';
// Importa el componente Button para botones estilizados
import Button from '../../ui/Button.jsx';
// Importa el servicio de categorías para interactuar con la API
import { categoriasService } from '../../../services/apiServices.js';

// Componente principal para gestionar categorías
export default function CategoriasManager() {
    // Estado para almacenar la lista de categorías
    const [categorias, setCategorias] = useState([]);
    const [categoriasFiltradas, setCategoriasFiltradas] = useState([]); // Lista filtrada
    const [busqueda, setBusqueda] = useState(''); // Término de búsqueda
    // Estado para mostrar el spinner de carga
    const [loading, setLoading] = useState(true);
    // Estado para controlar la apertura/cierre del modal
    const [modalOpen, setModalOpen] = useState(false);
    // Estado para saber si se está editando una categoría (null si es nueva)
    const [editingCategoria, setEditingCategoria] = useState(null);
    // Estado para los datos del formulario (crear/editar)
    const [formData, setFormData] = useState({
        nombre: '', // Nombre de la categoría
    });

    // Configuración de las columnas para la tabla de categorías
    const columns = [
        { key: 'categoria_id', label: 'ID' }, // Muestra el ID único de la categoría
        { key: 'nombre', label: 'Nombre' }, // Muestra el nombre de la categoría
    ];

    // Efecto que carga las categorías al montar el componente
    useEffect(() => {
        cargarDatos(); // Llama a la función para cargar las categorías desde la API
    }, []); // Solo se ejecuta una vez al montar

    // Filtra categorías cuando cambia la búsqueda
    useEffect(() => {
        if (!busqueda.trim()) {
            setCategoriasFiltradas(categorias);
        } else {
            const busquedaLower = busqueda.toLowerCase();
            const filtradas = categorias.filter(categoria =>
                categoria.nombre?.toLowerCase().includes(busquedaLower)
            );
            setCategoriasFiltradas(filtradas);
        }
    }, [busqueda, categorias]);

    // Función asíncrona para cargar las categorías desde la API
    async function cargarDatos() {
        try {
            setLoading(true); // Activa el spinner de carga
            const data = await categoriasService.obtenerTodas(); // Obtiene todas las categorías desde el backend
            setCategorias(data); // Actualiza el estado con los datos obtenidos
        } catch (error) {
            alert('Error al cargar las categorías: ' + error.message); // Alerta al usuario
        } finally {
            setLoading(false); // Desactiva el spinner
        }
    }

    // Maneja los cambios en los campos del formulario
    function handleInputChange(e) {
        const { name, value } = e.target; // Obtiene el nombre y valor del campo
        setFormData((prev) => ({ ...prev, [name]: value })); // Actualiza el estado del formulario
    }

    // Abre el modal para crear una nueva categoría
    function handleCreate() {
        setEditingCategoria(null); // No hay categoría en edición
        setFormData({ 
            nombre: '', // Limpia el campo nombre
        });
        setModalOpen(true); // Abre el modal
    }

    // Abre el modal para editar una categoría existente
    function handleEdit(categoria) {
        setEditingCategoria(categoria); // Establece la categoría en edición
        setFormData({
            nombre: categoria.nombre, // Rellena el nombre
        });
        setModalOpen(true); // Abre el modal
    }

    // Elimina una categoría después de confirmar
    async function handleDelete(categoria) {
        if (!confirm(`¿Estás seguro de eliminar la categoría "${categoria.nombre}"?`)) {
            return; // Si el usuario cancela, no hace nada
        }

        try {
            await categoriasService.eliminar(categoria.categoria_id); // Elimina la categoría por ID
            alert('Categoría eliminada correctamente'); // Mensaje de éxito
            cargarDatos(); // Recarga los datos
        } catch (error) {
            alert('Error al eliminar la categoría: ' + error.message); // Alerta al usuario
        }
    }

    // Maneja el envío del formulario para crear o actualizar una categoría
    async function handleSubmit(e) {
        e.preventDefault(); // Previene el comportamiento por defecto

        try {
            if (editingCategoria) {
                await categoriasService.actualizar(editingCategoria.categoria_id, formData); // Actualiza la categoría existente
                alert('Categoría actualizada correctamente'); // Mensaje de éxito
            } else {
                await categoriasService.crear(formData); // Crea una nueva categoría
                alert('Categoría creada correctamente'); // Mensaje de éxito
            }
            setModalOpen(false); // Cierra el modal
            cargarDatos(); // Recarga los datos
        } catch (error) {
            alert('Error al guardar la categoría: ' + error.message); // Alerta al usuario
        }
    }

    // Si está cargando, muestra un spinner animado
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div> {/* Spinner de carga */}
            </div>
        );
    }

    // Renderiza el componente principal del manager de categorías
    return (
        <div>
            {/* Header */}
            <div className="mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Gestión de Categorías</h2>
                <p className="text-sm md:text-base text-gray-600 mt-1">Organiza tus productos en categorías</p>
            </div>

            {/* Barra de acciones: Botón y Buscador */}
            <div className="flex flex-col md:flex-row gap-3 mb-4 md:mb-6">
                <Button onClick={handleCreate} className="w-full md:w-auto">
                    + Nueva Categoría
                </Button>
                
                {/* Buscador */}
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Buscar por nombre o descripción..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    />
                    <svg 
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {busqueda && (
                        <button
                            onClick={() => setBusqueda('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Tabla de categorías con acciones de editar/eliminar */}
            <DataTable
                columns={columns} // Configuración de columnas
                data={categoriasFiltradas} // Datos filtrados
                onEdit={handleEdit} // Acción editar
                onDelete={handleDelete} // Acción eliminar
            />

            {/* Modal para crear/editar categoría */}
            <Modal
                isOpen={modalOpen} // Estado de apertura
                onClose={() => setModalOpen(false)} // Acción cerrar
                title={editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'} // Título dinámico
            >
                <form onSubmit={handleSubmit} className="space-y-4"> {/* Formulario de categoría */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre de la Categoría *
                        </label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre} // Valor del campo nombre
                            onChange={handleInputChange} // Actualiza estado
                            required // Campo obligatorio
                            placeholder="Ej: Proteínas, Creatinas, Vitaminas..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Botones de acción del formulario */}
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                        <Button variant="outline" onClick={() => setModalOpen(false)} type="button">
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {editingCategoria ? 'Actualizar Categoría' : 'Crear Categoría'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
