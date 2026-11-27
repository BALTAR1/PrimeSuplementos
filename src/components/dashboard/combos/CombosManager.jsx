// Importa los hooks de React y componentes UI reutilizables
import { useState, useEffect, useMemo } from 'react';
import DataTable from '../../ui/DataTable.jsx';
import Modal from '../../ui/Modal.jsx';
import Button from '../../ui/Button.jsx';
import ImageUploader from '../../ui/ImageUploader.jsx';
import Toast from '../../ui/Toast.jsx';
import { combosService } from '../../../services/combosService.js';
import { productosService, categoriasService } from '../../../services/apiServices.js';

// Estilos del formulario (marca Prime: negro #111, bronce #a8763e, crema #f7f7f5)
const input = 'w-full rounded-lg border border-[#e4e1da] bg-white px-3 py-2 text-[15px] shadow-sm focus:border-[#a8763e] focus:outline-none focus:ring-2 focus:ring-[#a8763e]/30';

const FORM_VACIO = {
    nombre: '',
    descripcion: '',
    imagen_url: '',
    precio_combo: '',
    fecha_inicio: '',
    fecha_fin: '',
    activo: true,
};

const moneda = (n) => `$${(Number(n) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
// Los <input type="date"> necesitan YYYY-MM-DD (la base puede devolver un timestamp completo)
const soloFecha = (v) => (v ? String(v).slice(0, 10) : '');
const formatoFecha = (v) => (v ? soloFecha(v).split('-').reverse().join('/') : '');

// Tarjeta numerada para cada bloque del formulario
function Seccion({ n, titulo, extra, children }) {
    return (
        <section className="rounded-xl border border-[#e8e4dc] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="flex items-center gap-2 font-bold text-[#111]">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#111] text-xs text-white">{n}</span>
                    {titulo}
                </h4>
                {extra}
            </div>
            {children}
        </section>
    );
}

// Campo con su etiqueta
function Campo({ label, hint, className = '', children }) {
    return (
        <div className={className}>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#111]/70">{label}</label>
            {children}
            {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
    );
}

// Interruptor (switch) en lugar de checkbox
function Interruptor({ checked, onChange, titulo, desc }) {
    return (
        <div className={`rounded-xl border p-3 ${checked ? 'border-[#a8763e]/60 bg-[#a8763e]/5' : 'border-[#e8e4dc]'}`}>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-[#111]">{titulo}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
                    className={`relative h-6 w-11 flex-none rounded-full transition-colors ${checked ? 'bg-[#a8763e]' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
            </div>
        </div>
    );
}

// Texto de vigencia para la tabla (las fechas son opcionales)
function textoVigencia(combo) {
    const ini = formatoFecha(combo.fecha_inicio);
    const fin = formatoFecha(combo.fecha_fin);
    if (!ini && !fin) return 'Sin límite';
    if (ini && fin) return `${ini} al ${fin}`;
    if (ini) return `Desde ${ini}`;
    return `Hasta ${fin}`;
}

// --- Datos del producto ---
// Acepta texto ("Star"), objeto ({ nombre }) o lista de cualquiera de los dos.
// La categoría se completa en cargarDatos a partir de categoria_id
const nombresDe = (...valores) => {
    const valor = valores.find((v) => (Array.isArray(v) ? v.length > 0 : Boolean(v)));
    return [valor].flat()
        .map((v) => (typeof v === 'string' ? v : v?.nombre))
        .filter(Boolean)
        .map((v) => v.trim());
};
const marcasDe = (p) => nombresDe(p?.marcas, p?.marca);
const categoriasDe = (p) => nombresDe(p?.categoria);
const imagenDe = (p) => {
    const img = p?.imagen_url || p?.imagen || p?.imagenes?.[0];
    return typeof img === 'string' ? img : img?.url || img?.imagen_url || '';
};
// Para buscar sin importar mayúsculas ni acentos
const normalizar = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const opcionesUnicas = (productos, obtener) =>
    [...new Set(productos.flatMap(obtener))].sort((a, b) => a.localeCompare(b, 'es'));
// Evita que Enter envíe todo el formulario mientras se busca o se cambia una cantidad
const frenarEnter = (e) => { if (e.key === 'Enter') e.preventDefault(); };

function Miniatura({ producto }) {
    const url = imagenDe(producto);
    return url ? (
        <img src={url} alt="" loading="lazy" className="h-11 w-11 flex-none rounded-lg border border-[#e8e4dc] bg-white object-contain" />
    ) : (
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-lg border border-[#e8e4dc] bg-[#f7f7f5] text-sm font-bold text-[#a8763e]">
            {producto?.nombre?.charAt(0).toUpperCase() || '?'}
        </span>
    );
}

// Buscador de productos con filtros por marca y categoría
function SelectorProductos({ productos, items, onAgregar }) {
    const [texto, setTexto] = useState('');
    const [marca, setMarca] = useState('');
    const [categoria, setCategoria] = useState('');

    const marcas = useMemo(() => opcionesUnicas(productos, marcasDe), [productos]);
    const categorias = useMemo(() => opcionesUnicas(productos, categoriasDe), [productos]);

    const resultados = useMemo(() => {
        const palabras = normalizar(texto).split(/\s+/).filter(Boolean);
        return productos.filter((p) => {
            if (marca && !marcasDe(p).includes(marca)) return false;
            if (categoria && !categoriasDe(p).includes(categoria)) return false;
            const contenido = normalizar([p.nombre, ...marcasDe(p), ...categoriasDe(p)].join(' '));
            return palabras.every((palabra) => contenido.includes(palabra));
        });
    }, [productos, texto, marca, categoria]);

    const hayFiltros = texto || marca || categoria;

    function limpiar() {
        setTexto('');
        setMarca('');
        setCategoria('');
    }

    return (
        <div className="rounded-xl border border-[#e8e4dc] bg-[#f7f7f5] p-3">
            <input
                type="search"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={frenarEnter}
                placeholder="Buscar producto..."
                aria-label="Buscar producto"
                className={input}
            />
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <select value={marca} onChange={(e) => setMarca(e.target.value)} disabled={marcas.length === 0}
                    aria-label="Filtrar por marca" className={`${input} min-w-0 disabled:opacity-50`}>
                    <option value="">{marcas.length ? 'Todas las marcas' : 'Marca (sin datos)'}</option>
                    {marcas.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} disabled={categorias.length === 0}
                    aria-label="Filtrar por categoría" className={`${input} min-w-0 disabled:opacity-50`}>
                    <option value="">{categorias.length ? 'Todas las categorías' : 'Categoría (sin datos)'}</option>
                    {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="my-2 flex items-center justify-between text-xs text-gray-500">
                <span>{resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}</span>
                {hayFiltros && (
                    <button type="button" onClick={limpiar} className="font-semibold text-[#a8763e] hover:underline">Limpiar filtros</button>
                )}
            </div>

            <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
                {resultados.map((p) => {
                    const elegido = items.find((it) => String(it.producto_id) === String(p.producto_id));
                    const detalle = [...marcasDe(p), ...categoriasDe(p)].join(' · ');
                    return (
                        <li key={p.producto_id}>
                            <button type="button" onClick={() => onAgregar(p.producto_id)}
                                className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors hover:border-[#a8763e] ${elegido ? 'border-[#a8763e]/60 bg-[#a8763e]/10' : 'border-transparent bg-white'}`}>
                                <Miniatura producto={p} />
                                <span className="min-w-0 flex-1">
                                    <span className="block break-words text-sm font-semibold text-[#111]">{p.nombre}</span>
                                    {detalle && <span className="block truncate text-xs text-gray-500">{detalle}</span>}
                                    <span className="block text-sm font-bold text-[#a8763e]">{moneda(p.precio)}</span>
                                </span>
                                <span className={`flex-none whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-white ${elegido ? 'bg-[#a8763e]' : 'bg-[#111]'}`}>
                                    {elegido ? `✓ ${elegido.cantidad || 0} · +1` : '+ Agregar'}
                                </span>
                            </button>
                        </li>
                    );
                })}
                {resultados.length === 0 && (
                    <li className="py-6 text-center text-sm text-gray-500">No hay productos con esa búsqueda.</li>
                )}
            </ul>
        </div>
    );
}

export default function CombosManager() {
    const [combos, setCombos] = useState([]);
    const [productos, setProductos] = useState([]); // Catálogo para elegir los productos del combo
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [editingCombo, setEditingCombo] = useState(null);
    const [formData, setFormData] = useState(FORM_VACIO);
    const [itemsCombo, setItemsCombo] = useState([]); // Productos elegidos: { producto_id, cantidad }
    const [notificacion, setNotificacion] = useState(null);

    function mostrarNotificacion(message, type = 'success') {
        setNotificacion({ message, type });
    }

    // Columnas de la tabla
    const columns = [
        { key: 'combo_id', label: 'ID' },
        {
            key: 'imagen_url',
            label: 'Imagen',
            render: (url, row) => url ? (
                <img
                    src={url}
                    alt={`Combo ${row.nombre}`}
                    className="relative h-9 w-9 flex-none cursor-pointer rounded border border-gray-200 object-cover transition-transform hover:z-10 hover:scale-150"
                    onClick={() => { setSelectedImage(url); setImageModalOpen(true); }}
                />
            ) : <span className="whitespace-nowrap text-gray-400">Sin imagen</span>,
        },
        {
            key: 'nombre',
            label: 'Nombre',
            render: (value) => <span className="block break-words md:min-w-[180px]">{value}</span>,
        },
        {
            key: 'productos',
            label: 'Productos',
            render: (value) => (
                <span className="whitespace-nowrap">{(value || []).length} {(value || []).length === 1 ? 'producto' : 'productos'}</span>
            ),
        },
        {
            key: 'precio_combo',
            label: 'Precio',
            render: (value) => <span className="whitespace-nowrap">{moneda(value)}</span>,
        },
        {
            key: 'fecha_inicio',
            label: 'Vigencia',
            render: (_, row) => <span className="whitespace-nowrap">{textoVigencia(row)}</span>,
        },
        {
            key: 'activo',
            label: 'Estado',
            render: (value, row) => (
                <button
                    onClick={() => toggleEstadoActivo(row)}
                    className={`cursor-pointer whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold transition-opacity hover:opacity-80 ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    title="Clic para cambiar estado"
                >
                    {value ? 'Activo' : 'Inactivo'}
                </button>
            ),
        },
    ];

    useEffect(() => {
        cargarDatos();
    }, []);

    async function cargarDatos(mostrarSpinner = true) {
        try {
            if (mostrarSpinner) setLoading(true);
            const [combosData, productosData, categoriasData] = await Promise.all([
                combosService.obtenerTodos({ con_productos: true, limit: 100 }),
                productosService.obtenerTodos(), // sin límite, igual que en ProductosManager
                categoriasService.obtenerTodas().catch(() => []), // si falla, solo se pierde ese filtro
            ]);
            setCombos(combosData);
            const nombreCategoria = new Map(categoriasData.map((c) => [String(c.categoria_id), c.nombre]));
            setProductos(productosData.map((p) => ({ ...p, categoria: nombreCategoria.get(String(p.categoria_id)) })));
        } catch (error) {
            mostrarNotificacion('Error al cargar los datos: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    // Filtro por nombre
    const combosFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return combos;
        return combos.filter((c) => c.nombre?.toLowerCase().includes(q));
    }, [combos, busqueda]);

    // Precio sugerido = suma de precio x cantidad de cada producto elegido
    const resumenPrecio = useMemo(() => {
        const sugerido = itemsCombo.reduce((total, item) => {
            const prod = productos.find((p) => String(p.producto_id) === String(item.producto_id));
            return total + (prod ? Number(prod.precio) * (parseInt(item.cantidad, 10) || 0) : 0);
        }, 0);
        const precio = parseFloat(formData.precio_combo);
        const tienePrecio = !isNaN(precio) && precio > 0;
        const ahorro = tienePrecio ? sugerido - precio : 0;
        const descuento = tienePrecio && sugerido > 0 ? (ahorro / sugerido) * 100 : 0;
        return { sugerido, ahorro, descuento, tienePrecio };
    }, [itemsCombo, productos, formData.precio_combo]);

    function handleInputChange(e) {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }

    function handleCreate() {
        setEditingCombo(null);
        setFormData(FORM_VACIO);
        setItemsCombo([]);
        setModalOpen(true);
    }

    function handleEdit(combo) {
        setEditingCombo(combo);
        setFormData({
            nombre: combo.nombre || '',
            descripcion: combo.descripcion || '',
            imagen_url: combo.imagen_url || '',
            precio_combo: combo.precio_combo ?? '',
            fecha_inicio: soloFecha(combo.fecha_inicio),
            fecha_fin: soloFecha(combo.fecha_fin),
            activo: combo.activo !== undefined ? combo.activo : true,
        });
        const items = (combo.productos || []).map((cp) => ({
            producto_id: cp.producto?.producto_id ?? '',
            cantidad: cp.cantidad,
        }));
        setItemsCombo(items.filter((it) => it.producto_id !== ''));
        setModalOpen(true);
    }

    async function handleDelete(combo) {
        if (!confirm(`¿Estás seguro de eliminar el combo "${combo.nombre}"?`)) return;
        try {
            await combosService.eliminar(combo.combo_id);
            mostrarNotificacion('Combo eliminado correctamente');
            setCombos((prev) => prev.filter((c) => c.combo_id !== combo.combo_id));
        } catch (error) {
            mostrarNotificacion('Error al eliminar el combo: ' + error.message, 'error');
        }
    }

    async function toggleEstadoActivo(combo) {
        try {
            const nuevoEstado = !combo.activo;
            await combosService.actualizar(combo.combo_id, { activo: nuevoEstado });
            mostrarNotificacion(`Combo ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`);
            setCombos((prev) => prev.map((c) => (c.combo_id === combo.combo_id ? { ...c, activo: nuevoEstado } : c)));
        } catch (error) {
            mostrarNotificacion('Error al cambiar el estado: ' + error.message, 'error');
        }
    }

    // --- Productos del combo ---
    // Si el producto ya está en el combo, suma una unidad
    function agregarProducto(productoId) {
        setItemsCombo((prev) => {
            const existe = prev.some((it) => String(it.producto_id) === String(productoId));
            if (!existe) return [...prev, { producto_id: productoId, cantidad: 1 }];
            return prev.map((it) => (String(it.producto_id) === String(productoId)
                ? { ...it, cantidad: (parseInt(it.cantidad, 10) || 0) + 1 }
                : it));
        });
    }
    function cambiarCantidad(index, valor) {
        setItemsCombo((prev) => prev.map((it, i) => (i === index ? { ...it, cantidad: valor } : it)));
    }
    function quitarItem(index) {
        setItemsCombo((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (guardando) return;

        // Productos válidos (con producto elegido y cantidad >= 1)
        const productosValidos = itemsCombo
            .filter((it) => it.producto_id !== '' && parseInt(it.cantidad, 10) >= 1)
            .map((it) => ({ producto_id: parseInt(it.producto_id, 10), cantidad: parseInt(it.cantidad, 10) }));

        if (productosValidos.length === 0) {
            mostrarNotificacion('Agregá al menos un producto al combo', 'error');
            return;
        }
        if (!(parseFloat(formData.precio_combo) > 0)) {
            mostrarNotificacion('El precio del combo debe ser mayor a 0', 'error');
            return;
        }
        // Las fechas son opcionales: solo se valida el orden si hay ambas
        if (formData.fecha_inicio && formData.fecha_fin && formData.fecha_fin < formData.fecha_inicio) {
            mostrarNotificacion('La fecha de fin no puede ser anterior a la de inicio', 'error');
            return;
        }

        setGuardando(true);
        try {
            const dataToSubmit = {
                nombre: formData.nombre.trim(),
                descripcion: formData.descripcion || '',
                precio_combo: parseFloat(formData.precio_combo),
                imagen_url: formData.imagen_url || null,
                // Fecha vacía => null (sin límite)
                fecha_inicio: formData.fecha_inicio || null,
                fecha_fin: formData.fecha_fin || null,
                activo: formData.activo,
                productos: productosValidos,
            };

            if (editingCombo) {
                await combosService.actualizar(editingCombo.combo_id, dataToSubmit);
            } else {
                await combosService.crear(dataToSubmit);
            }

            mostrarNotificacion(editingCombo ? 'Combo actualizado correctamente' : 'Combo creado correctamente');
            setModalOpen(false);
            cargarDatos(false);
        } catch (error) {
            mostrarNotificacion('Error al guardar el combo: ' + error.message, 'error');
        } finally {
            setGuardando(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const hayFechas = formData.fecha_inicio || formData.fecha_fin;

    return (
        <div>
            {notificacion && (
                <Toast message={notificacion.message} type={notificacion.type} onClose={() => setNotificacion(null)} />
            )}

            {/* Encabezado */}
            <div className="mb-4 md:mb-6">
                <h2 className="text-xl font-bold text-gray-800 md:text-2xl">Gestión de Combos</h2>
                <p className="mt-1 text-sm text-gray-600 md:text-base">Armá combos de productos con precio especial</p>
            </div>

            {/* Barra de acciones */}
            <div className="mb-4 flex flex-col gap-3 md:mb-6">
                <Button onClick={handleCreate} className="w-full md:w-auto">+ Nuevo Combo</Button>

                <div className="relative min-w-0">
                    <label htmlFor="busqueda-combos" className="sr-only">Buscar combos</label>
                    <input
                        id="busqueda-combos"
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 md:text-base"
                    />
                    <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {busqueda && (
                        <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label="Limpiar búsqueda">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Tabla */}
            <div className="w-full max-w-full overflow-x-auto">
                <DataTable
                    columns={columns}
                    data={combosFiltrados}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    mobileCollapsible
                    mobileSummaryKeys={['imagen_url', 'nombre', 'precio_combo']}
                />
            </div>

            {/* Modal crear/editar */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingCombo ? 'Editar Combo' : 'Nuevo Combo'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-[#f7f7f5] p-3">
                    <Seccion n="1" titulo="Información básica">
                        <div className="grid grid-cols-1 gap-4">
                            <Campo label="Nombre del combo *">
                                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required placeholder="Ej: Prote y Crea One Fit" className={input} />
                            </Campo>
                            <Campo label="Descripción">
                                <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows={4} placeholder="Ej: Proteína más creatina de la marca One Fit" className={`${input} resize-y leading-relaxed`} />
                            </Campo>
                        </div>
                    </Seccion>

                    <Seccion n="2" titulo="Imagen del combo">
                        {!formData.imagen_url && (
                            <ImageUploader
                                onImageUploaded={(url) => setFormData((prev) => ({ ...prev, imagen_url: url }))}
                                currentImages={[]}
                                onDeleteImage={() => {}}
                            />
                        )}
                        {formData.imagen_url && (
                            <div className="relative w-40 overflow-hidden rounded-xl border-2 border-[#e8e4dc] bg-white">
                                <img src={formData.imagen_url} alt="Imagen del combo" className="h-32 w-full object-contain" />
                                <span className="absolute left-1 top-1 rounded bg-[#a8763e] px-2 py-0.5 text-xs font-semibold text-white">Principal</span>
                                <button type="button" title="Quitar imagen" onClick={() => setFormData((prev) => ({ ...prev, imagen_url: '' }))}
                                    className="absolute right-1 top-1 h-7 w-7 rounded-full bg-white/90 text-red-600 shadow hover:bg-red-600 hover:text-white">✕</button>
                            </div>
                        )}
                    </Seccion>

                    <Seccion
                        n="3"
                        titulo="Productos del combo *"
                        extra={<span className="whitespace-nowrap text-xs font-semibold text-gray-500">{itemsCombo.length} {itemsCombo.length === 1 ? 'elegido' : 'elegidos'}</span>}
                    >
                        {itemsCombo.length === 0 ? (
                            <p className="mb-3 rounded-lg border border-dashed border-[#d9d5cb] p-3 text-center text-sm text-gray-500">
                                Todavía no agregaste productos. Buscalos acá abajo.
                            </p>
                        ) : (
                            <ul className="mb-3 space-y-2">
                                {itemsCombo.map((item, index) => {
                                    const mismoId = (p) => String(p?.producto_id) === String(item.producto_id);
                                    // Si ya no está en el catálogo, usa los datos que trae el combo
                                    const prod = productos.find(mismoId) || editingCombo?.productos?.map((cp) => cp.producto).find(mismoId);
                                    const cantidad = parseInt(item.cantidad, 10) || 0;
                                    const nombre = prod?.nombre || `Producto #${item.producto_id}`;
                                    return (
                                        <li key={item.producto_id} className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e8e4dc] p-2">
                                            <Miniatura producto={prod} />
                                            <div className="min-w-[140px] flex-1">
                                                <p className="break-words text-sm font-semibold text-[#111]">{nombre}</p>
                                                <p className="text-xs text-gray-500">{moneda(prod?.precio)} c/u · Subtotal {moneda((Number(prod?.precio) || 0) * cantidad)}</p>
                                            </div>
                                            <div className="ml-auto flex flex-none items-center gap-1">
                                                <button type="button" onClick={() => cambiarCantidad(index, Math.max(1, cantidad - 1))} disabled={cantidad <= 1}
                                                    className="h-8 w-8 rounded-lg border border-[#e4e1da] font-bold hover:border-[#a8763e] disabled:opacity-30" aria-label={`Restar una unidad de ${nombre}`}>−</button>
                                                <input type="number" min="1" step="1" value={item.cantidad}
                                                    onChange={(e) => cambiarCantidad(index, e.target.value)}
                                                    onBlur={() => cambiarCantidad(index, Math.max(1, cantidad))}
                                                    onKeyDown={frenarEnter}
                                                    aria-label={`Cantidad de ${nombre}`}
                                                    className="h-8 w-14 rounded-lg border border-[#e4e1da] text-center text-sm focus:border-[#a8763e] focus:outline-none" />
                                                <button type="button" onClick={() => cambiarCantidad(index, cantidad + 1)}
                                                    className="h-8 w-8 rounded-lg border border-[#e4e1da] font-bold hover:border-[#a8763e]" aria-label={`Sumar una unidad de ${nombre}`}>+</button>
                                                <button type="button" onClick={() => quitarItem(index)}
                                                    className="ml-1 h-8 w-8 rounded-full text-red-600 hover:bg-red-600 hover:text-white" aria-label={`Quitar ${nombre}`}>✕</button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        <SelectorProductos productos={productos} items={itemsCombo} onAgregar={agregarProducto} />
                    </Seccion>

                    <Seccion n="4" titulo="Precio del combo">
                        <Campo label="Precio especial ($) *">
                            <input type="number" name="precio_combo" value={formData.precio_combo} onChange={handleInputChange} required min="0" step="0.01" placeholder="0.00" className={input} />
                        </Campo>
                        {resumenPrecio.sugerido > 0 && (
                            <div className="mt-3 rounded-xl border border-[#a8763e]/30 bg-[#a8763e]/5 p-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Suma de los productos</span>
                                    <span className="font-semibold text-[#111]">{moneda(resumenPrecio.sugerido)}</span>
                                </div>
                                {resumenPrecio.tienePrecio && (
                                    <>
                                        <div className="mt-1 flex justify-between">
                                            <span className="text-gray-600">Descuento</span>
                                            <span className={`font-bold ${resumenPrecio.ahorro >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                                {resumenPrecio.descuento.toFixed(2)}% OFF
                                            </span>
                                        </div>
                                        <div className="mt-1 flex justify-between">
                                            <span className="text-gray-600">{resumenPrecio.ahorro >= 0 ? 'Ahorro' : 'Diferencia (más caro que por separado)'}</span>
                                            <span className={`font-semibold ${resumenPrecio.ahorro >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                                {moneda(Math.abs(resumenPrecio.ahorro))}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </Seccion>

                    <Seccion
                        n="5"
                        titulo="Vigencia (opcional)"
                        extra={hayFechas && (
                            <button type="button" onClick={() => setFormData((prev) => ({ ...prev, fecha_inicio: '', fecha_fin: '' }))}
                                className="rounded border border-[#e4e1da] px-2 py-1 text-xs hover:border-[#a8763e] hover:text-[#a8763e]">Quitar fechas</button>
                        )}
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Campo label="Fecha de inicio">
                                <input type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleInputChange} max={formData.fecha_fin || undefined} className={input} />
                            </Campo>
                            <Campo label="Fecha de fin">
                                <input type="date" name="fecha_fin" value={formData.fecha_fin} onChange={handleInputChange} min={formData.fecha_inicio || undefined} className={input} />
                            </Campo>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            {hayFechas
                                ? 'Podés completar solo una de las dos fechas.'
                                : 'Sin fechas, el combo está vigente siempre mientras esté activo.'}
                        </p>
                    </Seccion>

                    <Seccion n="6" titulo="Visibilidad en la tienda">
                        <Interruptor
                            checked={formData.activo}
                            onChange={(v) => setFormData((prev) => ({ ...prev, activo: v }))}
                            titulo="Combo activo"
                            desc="Visible en la tienda"
                        />
                    </Seccion>

                    {/* Botones de acción */}
                    <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#e8e4dc] bg-white/95 py-3">
                        <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-[#d9d5cb] bg-white px-5 py-2 text-sm font-semibold hover:bg-[#f7f7f5]">Cancelar</button>
                        <button type="submit" disabled={guardando} className="rounded-lg bg-[#111] px-6 py-2 text-sm font-semibold text-white hover:bg-[#a8763e] disabled:opacity-60">
                            {guardando ? 'Guardando...' : editingCombo ? 'Guardar cambios' : 'Crear combo'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Vista previa de imagen */}
            <Modal isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} title="Vista Previa de Imagen" size="lg">
                {selectedImage && <img src={selectedImage} alt="Vista previa" className="h-auto w-full rounded-lg" />}
            </Modal>
        </div>
    );
}
