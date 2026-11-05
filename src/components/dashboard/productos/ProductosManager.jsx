// Importa los hooks de React y componentes UI reutilizables
import { useState, useEffect } from 'react';
import DataTable from '../../ui/DataTable.jsx'; // Tabla para mostrar productos
import Modal from '../../ui/Modal.jsx'; // Modal para formularios y vistas
import Button from '../../ui/Button.jsx'; // Botón reutilizable
import ImageUploader from '../../ui/ImageUploader.jsx'; // Componente para subir imágenes
import { productosService, categoriasService, productoImagenesService, productoSaboresService } from '../../../services/apiServices.js'; // Servicios API para productos, categorías, imágenes y sabores

// Componente principal para gestionar productos
export default function ProductosManager() {
    // Estados para almacenar datos y controlar la UI
    const [productos, setProductos] = useState([]); // Lista de productos
    const [productosFiltrados, setProductosFiltrados] = useState([]); // Lista filtrada
    const [busqueda, setBusqueda] = useState(''); // Término de búsqueda
    const [ordenProductos, setOrdenProductos] = useState('categoria'); // Orden principal del listado
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas'); // Filtro por categoría
    const [categorias, setCategorias] = useState([]); // Lista de categorías
    const [loading, setLoading] = useState(true); // Estado de carga
    const [modalOpen, setModalOpen] = useState(false); // Modal de formulario abierto/cerrado
    const [imageModalOpen, setImageModalOpen] = useState(false); // Modal de imagen abierto/cerrado
    const [selectedImage, setSelectedImage] = useState(null); // Imagen seleccionada para vista previa
    const [editingProducto, setEditingProducto] = useState(null); // Producto en edición
    // Estado para el formulario de producto
    const [formData, setFormData] = useState({
        nombre: '',
        marca: '',
        descripcion: '',
        precio: '',
        stock: '',
        categoria_id: '',
        imagen_url: '',
        peso_kg: '',
        activo: true,
        destacado: false,
        mostrar_ultimas: false,
        mostrar_sin_stock: false,
        marca_id: '',
    });
    const [imagenesProducto, setImagenesProducto] = useState([]); // Imágenes asociadas al producto
    const [saboresProducto, setSaboresProducto] = useState([]);
    const [nuevoSabor, setNuevoSabor] = useState('');

    function obtenerNombreCategoria(categoriaId) {
        const categoria = categorias.find((item) => String(item.categoria_id) === String(categoriaId));
        return categoria?.nombre || 'Sin categoría';
    }

    function obtenerNombreMarca(producto) {
        return producto.marcas?.nombre || producto.marca || '';
    }

    // Definición de columnas para la tabla de productos
    const columns = [
        { key: 'producto_id', label: 'ID' }, // Identificador único
        {
            key: 'imagen_url',
            label: 'Imagen',
            // Renderiza la imagen principal y adicionales, permite vista previa
            render: (imageUrl, row) => {
                if (!imageUrl) return <span className="text-gray-400">Sin imagen</span>;
                
                const todasLasImagenes = [imageUrl];
                if (row.imagenes_adicionales && row.imagenes_adicionales.length > 0) {
                    todasLasImagenes.push(...row.imagenes_adicionales.map(img => img.url));
                }
                
                return (
                    <div className="flex items-center gap-1">
                        {todasLasImagenes.slice(0, 2).map((url) => (
                            <img
                                key={url}
                                src={url}
                                alt={`Producto ${url}`}
                                className="h-10 w-10 object-cover rounded border border-gray-200 cursor-pointer hover:scale-150 transition-transform"
                                onClick={() => {
                                    setSelectedImage(url);
                                    setImageModalOpen(true);
                                }}
                            />
                        ))}
                        {todasLasImagenes.length > 2 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                +{todasLasImagenes.length - 2}
                            </span>
                        )}
                    </div>
                );
            },
        },
        { key: 'nombre', label: 'Nombre' }, // Nombre del producto
        {
            key: 'categoria_id',
            label: 'Categoría',
            render: (value) => obtenerNombreCategoria(value),
        },
        { key: 'marcas', label: 'Marca', render: (value, row) => value?.nombre || row.marca || '-' }, // Marca
        { 
            key: 'precio', 
            label: 'Precio', 
            // Formatea el precio en moneda local
            render: (value) => `$${parseFloat(value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
        },
        { 
            key: 'stock', 
            label: 'Stock',
            // Muestra el stock con color según cantidad
            render: (value) => {
                const stock = parseInt(value);
                let className = 'px-2 py-1 text-xs font-semibold rounded-full ';
                if (stock === 0) className += 'bg-red-100 text-red-800';
                else if (stock < 10) className += 'bg-yellow-100 text-yellow-800';
                else className += 'bg-green-100 text-green-800';
                return <span className={className}>{stock}</span>;
            }
        },
        {
            key: 'activo',
            label: 'Estado',
            // Indica si el producto está activo o inactivo con botón de toggle
            render: (value, row) => (
                <button
                    onClick={() => toggleEstadoActivo(row)}
                    className={`px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                        value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                    title="Clic para cambiar estado"
                >
                    {value ? 'Activo' : 'Inactivo'}
                </button>
            )
        },
        {
            key: 'destacado',
            label: 'Destacado',
            render: (value) => value ? 'Destacado' : '-'
        },
    ];

    // Carga los datos al montar el componente
    useEffect(() => {
        cargarDatos();
    }, []);

    // Filtra productos cuando cambia la búsqueda
    useEffect(() => {
        let listaFiltrada = productos;

        if (categoriaSeleccionada !== 'todas') {
            listaFiltrada = listaFiltrada.filter((producto) =>
                categoriaSeleccionada === 'sin-categoria'
                    ? !producto.categoria_id
                    : String(producto.categoria_id) === categoriaSeleccionada
            );
        }
        
        // Aplicar búsqueda si hay texto
        if (busqueda.trim()) {
            const busquedaLower = busqueda.toLowerCase();
            listaFiltrada = productos.filter(producto =>
                producto.nombre?.toLowerCase().includes(busquedaLower) ||
                obtenerNombreMarca(producto).toLowerCase().includes(busquedaLower) ||
                obtenerNombreCategoria(producto.categoria_id).toLowerCase().includes(busquedaLower)
            );
        }
        
        // Ordena por categoría y usa el ID como desempate para mantener un orden estable.
        const listaOrdenada = [...listaFiltrada].sort((a, b) => {
            if (ordenProductos === 'categoria') {
                const categoriaA = obtenerNombreCategoria(a.categoria_id);
                const categoriaB = obtenerNombreCategoria(b.categoria_id);
                const sinCategoriaA = categoriaA === 'Sin categoría';
                const sinCategoriaB = categoriaB === 'Sin categoría';
                if (sinCategoriaA !== sinCategoriaB) return sinCategoriaA ? 1 : -1;
                const categoriaCompare = categoriaA.localeCompare(categoriaB, 'es', {
                    sensitivity: 'base',
                    numeric: true,
                });
                if (categoriaCompare !== 0) return categoriaCompare;
            }

            return ordenProductos === 'id-asc'
                ? a.producto_id - b.producto_id
                : b.producto_id - a.producto_id;
        });
        
        setProductosFiltrados(listaOrdenada);
    }, [busqueda, productos, categorias, ordenProductos, categoriaSeleccionada]);

    // Función para cargar productos y categorías desde la API
    async function cargarDatos() {
        try {
            setLoading(true); // Muestra spinner de carga
            const [productosData, categoriasData] = await Promise.all([
                productosService.obtenerTodos(), // Obtiene productos
                categoriasService.obtenerTodas(), // Obtiene categorías
            ]);
            
            const imagenes = await productoImagenesService.obtenerPorProductos(
                productosData.map((producto) => producto.producto_id)
            );
            const imagenesPorProducto = imagenes.reduce((grupos, imagen) => {
                const productoId = String(imagen.producto_id);
                grupos[productoId] = grupos[productoId] || [];
                grupos[productoId].push(imagen);
                return grupos;
            }, {});
            const productosConImagenes = productosData.map((producto) => ({
                ...producto,
                imagenes_adicionales: imagenesPorProducto[String(producto.producto_id)] || [],
            }));
            
            setProductos(productosConImagenes); // Actualiza estado de productos
            setCategorias(categoriasData); // Actualiza estado de categorías
        } catch (error) {
            alert('Error al cargar los datos: ' + error.message);
        } finally {
            setLoading(false); // Oculta spinner
        }
    }

    // Maneja cambios en los inputs del formulario
    function handleInputChange(e) {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Abre el modal para crear un nuevo producto
    function handleCreate() {
        setEditingProducto(null); // No hay producto en edición
        setFormData({
            nombre: '',
            marca: '',
            descripcion: '',
            precio: '',
            stock: '',
            categoria_id: '',
            imagen_url: '',
            peso_kg: '',
            activo: true,
            destacado: false,
            mostrar_ultimas: false,
            mostrar_sin_stock: false,
            marca_id: '',
        });
        setImagenesProducto([]); // Limpia imágenes
        setSaboresProducto([]);
        setNuevoSabor('');
        setModalOpen(true); // Abre modal
    }

    // Abre el modal para editar un producto existente
    async function handleEdit(producto) {
        setEditingProducto(producto); // Establece producto en edición
        setFormData({
            nombre: producto.nombre,
            marca: obtenerNombreMarca(producto),
            descripcion: producto.descripcion || '',
            precio: producto.precio,
            stock: producto.stock,
            categoria_id: producto.categoria_id || '',
            imagen_url: producto.imagen_url || '',
            peso_kg: producto.peso_kg || '',
            activo: producto.activo !== undefined ? producto.activo : true,
            destacado: producto.destacado || false,
            mostrar_ultimas: producto.mostrar_ultimas || false,
            mostrar_sin_stock: producto.mostrar_sin_stock || false,
            marca_id: producto.marca_id || '',
        });
        
        // Carga imágenes principales y adicionales
        const imagenes = [];
        if (producto.imagen_url) {
            imagenes.push(producto.imagen_url);
        }
        if (producto.imagenes_adicionales && producto.imagenes_adicionales.length > 0) {
            imagenes.push(...producto.imagenes_adicionales.map(img => img.url || img));
        }
        setImagenesProducto(imagenes.filter(img => img)); // Actualiza estado de imágenes
        setSaboresProducto([]);
        setNuevoSabor('');
        try {
            const sabores = await productoSaboresService.obtenerPorProducto(producto.producto_id);
            setSaboresProducto(sabores.map((sabor) => sabor.nombre));
        } catch (error) {
            alert('Error al cargar los sabores: ' + error.message);
        }
        setModalOpen(true); // Abre modal
    }

    // Elimina un producto tras confirmación
    async function handleDelete(producto) {
        if (!confirm(`¿Estás seguro de eliminar el producto "${producto.nombre}"?`)) {
            return;
        }
        try {
            await productosService.eliminar(producto.producto_id); // Llama API para eliminar
            alert('Producto eliminado correctamente');
            cargarDatos(); // Refresca lista
        } catch (error) {
            alert('Error al eliminar el producto: ' + error.message);
        }
    }

    // Envía el formulario para crear o actualizar producto
    async function handleSubmit(e) {
        e.preventDefault();
        try {
            // Prepara datos para enviar (solo campos que existen en la tabla)
            const dataToSubmit = {
                ...(String(formData.nombre || '').trim() ? { nombre: String(formData.nombre).trim() } : {}),
                ...(String(formData.marca || '').trim() ? { marca_nombre: String(formData.marca).trim() } : {}),
                descripcion: formData.descripcion,
                ...(formData.precio !== '' ? { precio: parseFloat(formData.precio) } : {}),
                ...(formData.stock !== '' ? { stock: parseInt(formData.stock, 10) } : {}),
                ...(imagenesProducto[0] || formData.imagen_url
                    ? { imagen_url: imagenesProducto[0] || formData.imagen_url }
                    : {}),
                categoria_id: formData.categoria_id ? parseInt(formData.categoria_id, 10) : null,
                marca_id: formData.marca_id ? parseInt(formData.marca_id, 10) : null,
                activo: formData.activo,
                destacado: formData.destacado,
                mostrar_ultimas: formData.mostrar_ultimas,
                mostrar_sin_stock: formData.mostrar_sin_stock,
            };
            let productoId;
            if (editingProducto) {
                await productosService.actualizar(editingProducto.producto_id, dataToSubmit);
                productoId = editingProducto.producto_id;
                // Elimina imágenes adicionales existentes (si la tabla existe)
                if (editingProducto.imagenes_adicionales && editingProducto.imagenes_adicionales.length > 0) {
                    try {
                        await Promise.all(
                            editingProducto.imagenes_adicionales.map(img => 
                                productoImagenesService.eliminar(img.imagen_id)
                            )
                        );
                    } catch (imgError) {
                        console.warn('Error al eliminar imágenes adicionales:', imgError);
                        // Continuamos aunque falle
                    }
                }
            } else {
                // Crea nuevo producto
                const response = await productosService.crear(dataToSubmit);
                productoId = response?.producto_id || 
                             response?.id || 
                             response?.data?.producto_id ||
                             response?.data?.id || 
                             response?.data?.[0]?.producto_id || 
                             response?.[0]?.producto_id;
                if (!productoId) {
                    throw new Error('No se pudo obtener el ID del producto creado');
                }
            }

            await productoSaboresService.reemplazar(productoId, saboresProducto);
            
            // Guarda imágenes adicionales (excepto la principal)
            const imagenesAdicionales = imagenesProducto.slice(1);
            if (imagenesAdicionales.length > 0) {
                try {
                    await Promise.all(
                        imagenesAdicionales.map((url, index) => 
                            productoImagenesService.agregar({
                                producto_id: productoId,
                                url: url,
                                descripcion: `Imagen ${index + 2}`
                            })
                        )
                    );
                } catch (imgError) {
                    console.warn('Error al agregar imágenes adicionales:', imgError);
                    // Continuamos aunque falle
                }
            }
            
            alert(editingProducto ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
            setModalOpen(false); // Cierra modal
            cargarDatos(); // Refresca lista
        } catch (error) {
            alert('Error al guardar el producto: ' + error.message);
        }
    }

    // Función para cambiar el estado activo/inactivo de un producto
    async function toggleEstadoActivo(producto) {
        try {
            const nuevoEstado = !producto.activo;
            await productosService.actualizar(producto.producto_id, {
                activo: nuevoEstado
            });
            alert(`Producto ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
            // Recargar datos para reflejar el cambio
            cargarDatos();
        } catch (error) {
            alert('Error al cambiar el estado: ' + error.message);
        }
    }

    // Agrega una imagen al estado cuando se sube
    function handleImagenAgregada(url) {
        setImagenesProducto(prev => [...prev, url]);
        if (imagenesProducto.length === 0) {
            setFormData(prev => ({ ...prev, imagen_url: url })); // Establece imagen principal
        }
    }

    // Elimina una imagen del estado
    function handleEliminarImagen(index) {
        const nuevasImagenes = imagenesProducto.filter((_, i) => i !== index);
        setImagenesProducto(nuevasImagenes);
        if (index === 0 && nuevasImagenes.length > 0) {
            setFormData(prev => ({ ...prev, imagen_url: nuevasImagenes[0] })); // Actualiza imagen principal
        } else if (nuevasImagenes.length === 0) {
            setFormData(prev => ({ ...prev, imagen_url: '' })); // Limpia imagen principal
        }

    }

    function agregarSabor() {
        const sabor = nuevoSabor.trim();
        if (!sabor) return;
        if (saboresProducto.some((item) => item.toLowerCase() === sabor.toLowerCase())) {
            setNuevoSabor('');
            return;
        }
        setSaboresProducto((prev) => [...prev, sabor]);
        setNuevoSabor('');
    }

    function eliminarSabor(sabor) {
        setSaboresProducto((prev) => prev.filter((item) => item !== sabor));
    }

    // Muestra spinner mientras carga datos
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Renderiza la UI principal
    return (
        <div>
            {/* Encabezado */}
            <div className="mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Gestión de Productos</h2>
                <p className="text-sm md:text-base text-gray-600 mt-1">Administra el catálogo completo de productos</p>
            </div>

            {/* Barra de acciones: Botón y Buscador */}
            <div className="flex flex-col gap-3 mb-4 md:mb-6">
                <Button onClick={handleCreate} className="w-full md:w-auto">
                    + Nuevo Producto
                </Button>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[auto_auto_1fr]">
                    {/* Selector de filtro por categoría */}
                    <div className="flex min-w-0 flex-col gap-1">
                        <label htmlFor="filtro-categoria" className="text-sm font-medium text-gray-700">Filtrar por categoría</label>
                        <select
                            id="filtro-categoria"
                            value={categoriaSeleccionada}
                            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                            className="w-full min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="todas">Todas las categorías</option>
                            {categorias.map((categoria) => (
                                <option key={categoria.categoria_id} value={categoria.categoria_id}>
                                    {categoria.nombre}
                                </option>
                            ))}
                            <option value="sin-categoria">Sin categoría</option>
                        </select>
                    </div>

                    {/* Selector de ordenamiento */}
                    <div className="flex min-w-0 flex-col gap-1">
                        <label htmlFor="orden-productos" className="text-sm font-medium text-gray-700">Ordenar por</label>
                        <select
                            id="orden-productos"
                            value={ordenProductos}
                            onChange={(e) => setOrdenProductos(e.target.value)}
                            className="w-full min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="categoria">Categoría (A-Z)</option>
                            <option value="id-desc">ID descendente (más nuevos primero)</option>
                            <option value="id-asc">ID ascendente (más antiguos primero)</option>
                        </select>
                    </div>

                    {/* Buscador */}
                    <div className="relative min-w-0 self-end">
                        <label htmlFor="busqueda-productos" className="sr-only">Buscar productos</label>
                        <input
                            id="busqueda-productos"
                            type="text"
                            placeholder="Buscar por nombre, marca o categoría..."
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
                                aria-label="Limpiar búsqueda"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabla de productos */}
            <DataTable
                columns={columns}
                data={productosFiltrados}
                onEdit={handleEdit}
                onDelete={handleDelete}
                mobileCollapsible
                mobileSummaryKeys={['imagen_url', 'nombre', 'categoria_id', 'precio', 'stock']}
            />

            {/* Modal de formulario para crear/editar producto */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Información Básica */}
                    <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                        <h4 className="font-semibold text-blue-900 mb-2">Información Básica</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Campo nombre */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del Producto *
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleInputChange}
                                required={!editingProducto}
                                placeholder="Ej: Proteína Whey Gold Standard"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Campo marca */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Marca *
                            </label>
                            <input
                                type="text"
                                name="marca"
                                value={formData.marca}
                                onChange={handleInputChange}
                                required={!editingProducto}
                                placeholder="Ej: Optimum Nutrition, ENA, Star Nutrition"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                    </div>

                    <div className="rounded border border-amber-200 bg-amber-50 p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sabores (opcional)
                        </label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                                type="text"
                                value={nuevoSabor}
                                onChange={(e) => setNuevoSabor(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        agregarSabor();
                                    }
                                }}
                                placeholder="Ej: Chocolate, Frutilla, Vainilla"
                                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2"
                            />
                            <Button type="button" onClick={agregarSabor}>Agregar sabor</Button>
                        </div>
                        {saboresProducto.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {saboresProducto.map((sabor) => (
                                    <span key={sabor} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-gray-700 shadow-sm">
                                        {sabor}
                                        <button type="button" onClick={() => eliminarSabor(sabor)} className="font-bold text-red-500" aria-label={`Eliminar sabor ${sabor}`}>
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <p className="mt-2 text-xs text-gray-500">Dejalo vacío si el producto no tiene sabores.</p>
                    </div>

                    {/* Campo descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Ej: Proteína de suero con 24g de proteína por porción, ideal para post-entrenamiento..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Sección precio e inventario */}
                    <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded mt-6">
                        <h4 className="font-semibold text-green-900 mb-2">Precio e Inventario</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Campo precio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio *
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                <input
                                    type="number"
                                    name="precio"
                                    value={formData.precio}
                                    onChange={handleInputChange}
                                    required={!editingProducto}
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Campo stock */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stock Disponible *
                            </label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleInputChange}
                                required={!editingProducto}
                                min="0"
                                placeholder="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Campo peso */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Peso (kg)
                            </label>
                            <input
                                type="number"
                                name="peso_kg"
                                value={formData.peso_kg}
                                onChange={handleInputChange}
                                step="0.001"
                                min="0"
                                placeholder="0.000"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Campo categoría */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoría
                        </label>
                        <select
                            name="categoria_id"
                            value={formData.categoria_id}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Sin categoría</option>
                            {categorias.map(cat => (
                                <option key={cat.categoria_id} value={cat.categoria_id}>
                                    {cat.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sección imágenes */}
                    <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded mt-6">
                        <h4 className="font-semibold text-purple-900 mb-2">Imágenes del Producto</h4>
                    </div>

                    {/* Componente para subir y eliminar imágenes */}
                    <ImageUploader
                        onImageUploaded={handleImagenAgregada}
                        currentImages={imagenesProducto}
                        onDeleteImage={handleEliminarImagen}
                    />

                    {/* Estado del producto */}
                    <div className="mt-4 space-y-3">
                        {/* Checkbox activo */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.activo}
                                onChange={(e) => setFormData(prev => ({ ...prev, activo: e.target.checked }))}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Producto activo (visible en la tienda)
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.destacado}
                                onChange={(e) => setFormData(prev => ({ ...prev, destacado: e.target.checked }))}
                                className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Producto destacado (aparece en la página de inicio)
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.mostrar_ultimas}
                                onChange={(e) => setFormData(prev => ({ ...prev, mostrar_ultimas: e.target.checked }))}
                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Mostrar etiqueta “Últimas”
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.mostrar_sin_stock}
                                onChange={(e) => setFormData(prev => ({ ...prev, mostrar_sin_stock: e.target.checked }))}
                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Mostrar etiqueta “Sin stock”
                            </span>
                        </label>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                        <Button variant="outline" onClick={() => setModalOpen(false)} type="button">
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {editingProducto ? 'Actualizar Producto' : 'Crear Producto'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal para vista previa de imagen */}
            <Modal
                isOpen={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
                title="Vista Previa de Imagen"
                size="lg"
            >
                {selectedImage && (
                    <img
                        src={selectedImage}
                        alt="Vista previa"
                        className="w-full h-auto rounded-lg"
                    />
                )}
            </Modal>
        </div>
    );
}
