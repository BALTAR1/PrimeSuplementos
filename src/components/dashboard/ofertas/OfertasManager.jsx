// Importa los hooks de React y componentes UI reutilizables
import { useState, useEffect, useMemo } from 'react';
import DataTable from '../../ui/DataTable.jsx';
import Modal from '../../ui/Modal.jsx';
import Button from '../../ui/Button.jsx';
import Toast from '../../ui/Toast.jsx';
import { ofertasService } from '../../../services/ofertasService.js';
import { productosService } from '../../../services/apiServices.js';

// Estilos del formulario (marca Prime: negro #111, bronce #a8763e, crema #f7f7f5)
const input = 'w-full rounded-lg border border-[#e4e1da] bg-white px-3 py-2 text-[15px] shadow-sm focus:border-[#a8763e] focus:outline-none focus:ring-2 focus:ring-[#a8763e]/30';

const FORM_VACIO = {
    producto_id: '',
    descuento: '',
    fecha_inicio: '',
    fecha_fin: '',
    activo: true,
    tipo_oferta: '',
};

// Catálogo de tipos de oferta para el select y la tabla
const tiposOferta = [
    { value: '', label: 'Sin especificar' },
    { value: 'temporada', label: 'Temporada' },
    { value: 'liquidacion', label: 'Liquidación' },
    { value: 'oferta_flash', label: 'Oferta Flash' },
    { value: 'black_friday', label: 'Black Friday' },
    { value: 'cyber_monday', label: 'Cyber Monday' },
    { value: 'aniversario', label: 'Aniversario' },
];

const moneda = (n) => `$${(Number(n) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
// Los <input type="date"> necesitan YYYY-MM-DD (la base puede devolver un timestamp completo)
const soloFecha = (v) => (v ? String(v).slice(0, 10) : '');
const formatoFecha = (v) => (v ? soloFecha(v).split('-').reverse().join('/') : '');
// La marca puede venir como texto o dentro de la relación "marcas"
const nombreMarca = (p) => p?.marcas?.nombre || p?.marca || '';

// Una oferta está vigente si hoy cae dentro del rango. Una fecha vacía = sin límite en ese extremo.
function estaVigente(oferta) {
    const hoy = new Date().toISOString().slice(0, 10);
    const ini = soloFecha(oferta.fecha_inicio);
    const fin = soloFecha(oferta.fecha_fin);
    return (!ini || hoy >= ini) && (!fin || hoy <= fin);
}

function textoVigencia(oferta) {
    const ini = formatoFecha(oferta.fecha_inicio);
    const fin = formatoFecha(oferta.fecha_fin);
    if (!ini && !fin) return 'Sin límite';
    if (ini && fin) return `${ini} al ${fin}`;
    if (ini) return `Desde ${ini}`;
    return `Hasta ${fin}`;
}

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

export default function OfertasManager() {
    const [ofertas, setOfertas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingOferta, setEditingOferta] = useState(null);
    const [formData, setFormData] = useState(FORM_VACIO);
    const [notificacion, setNotificacion] = useState(null);

    function mostrarNotificacion(message, type = 'success') {
        setNotificacion({ message, type });
    }

    // Columnas de la tabla
    const columns = [
        { key: 'oferta_id', label: 'ID' },
        {
            key: 'producto',
            label: 'Producto',
            render: (producto) => {
                if (!producto) return <span className="text-gray-400">Sin producto</span>;
                return (
                    <div className="flex min-w-[180px] items-center gap-2">
                        {producto.imagen_url && (
                            <img src={producto.imagen_url} alt={producto.nombre} className="h-10 w-10 flex-none rounded border border-gray-200 object-cover" />
                        )}
                        <div>
                            <div className="font-medium text-gray-900">{producto.nombre}</div>
                            <div className="text-xs text-gray-500">{nombreMarca(producto)}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'precio_original',
            label: 'Precio original',
            render: (_, row) => (
                <span className="whitespace-nowrap">{row.producto ? moneda(row.producto.precio) : '-'}</span>
            ),
        },
        {
            key: 'descuento',
            label: 'Descuento',
            render: (value, row) => {
                const precioFinal = (row.producto?.precio || 0) * (1 - value / 100);
                return (
                    <div className="whitespace-nowrap">
                        <span className="font-bold text-red-600">{value}% OFF</span>
                        <div className="text-xs font-medium text-green-700">{moneda(precioFinal)}</div>
                    </div>
                );
            },
        },
        {
            key: 'tipo_oferta',
            label: 'Tipo',
            render: (value) => {
                if (!value) return <span className="text-gray-400">-</span>;
                const tipo = tiposOferta.find((t) => t.value === value);
                return (
                    <span className="whitespace-nowrap rounded-full bg-[#a8763e]/10 px-2 py-1 text-xs font-medium text-[#111]">
                        {tipo?.label || value}
                    </span>
                );
            },
        },
        {
            key: 'fecha_inicio',
            label: 'Vigencia',
            render: (_, row) => {
                const vigente = estaVigente(row);
                return (
                    <div className="whitespace-nowrap text-xs">
                        <div className={vigente ? 'font-medium text-green-700' : 'text-gray-600'}>{textoVigencia(row)}</div>
                        {vigente && <span className="font-bold text-green-600">● Vigente</span>}
                    </div>
                );
            },
        },
        {
            key: 'activo',
            label: 'Estado',
            render: (value, row) => (
                <button
                    onClick={() => handleToggle(row)}
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
            const [ofertasData, productosData] = await Promise.all([
                ofertasService.obtenerTodas({ limit: 100 }),
                productosService.obtenerTodos(), // sin límite, igual que en ProductosManager
            ]);
            setOfertas(ofertasData);
            setProductos(productosData);
        } catch (error) {
            mostrarNotificacion('Error al cargar los datos: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    // Filtro por producto o tipo de oferta
    const ofertasFiltradas = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return ofertas;
        return ofertas.filter((o) =>
            o.producto?.nombre?.toLowerCase().includes(q) ||
            nombreMarca(o.producto).toLowerCase().includes(q) ||
            (tiposOferta.find((t) => t.value === o.tipo_oferta)?.label || '').toLowerCase().includes(q)
        );
    }, [ofertas, busqueda]);

    // Vista previa del precio con descuento
    const precios = useMemo(() => {
        if (!formData.producto_id || !formData.descuento) return null;
        const producto = productos.find((p) => String(p.producto_id) === String(formData.producto_id));
        const desc = parseFloat(formData.descuento);
        if (!producto || isNaN(desc)) return null;
        const final = producto.precio * (1 - desc / 100);
        return { original: producto.precio, final, ahorro: producto.precio - final };
    }, [formData.producto_id, formData.descuento, productos]);

    function handleInputChange(e) {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }

    function handleCreate() {
        setEditingOferta(null);
        setFormData(FORM_VACIO);
        setModalOpen(true);
    }

    function handleEdit(oferta) {
        setEditingOferta(oferta);
        setFormData({
            producto_id: oferta.producto_id || '',
            descuento: oferta.descuento ?? '',
            fecha_inicio: soloFecha(oferta.fecha_inicio),
            fecha_fin: soloFecha(oferta.fecha_fin),
            activo: oferta.activo !== undefined ? oferta.activo : true,
            tipo_oferta: oferta.tipo_oferta || '',
        });
        setModalOpen(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (guardando) return;

        if (!formData.producto_id) {
            mostrarNotificacion('Tenés que seleccionar un producto', 'error');
            return;
        }
        const descuento = parseFloat(formData.descuento);
        if (!descuento || descuento <= 0 || descuento > 100) {
            mostrarNotificacion('El descuento debe estar entre 0 y 100', 'error');
            return;
        }
        // Las fechas son opcionales: solo se valida el orden si hay ambas
        if (formData.fecha_inicio && formData.fecha_fin && formData.fecha_fin < formData.fecha_inicio) {
            mostrarNotificacion('La fecha de fin no puede ser anterior a la de inicio', 'error');
            return;
        }

        setGuardando(true);
        try {
            const data = {
                producto_id: parseInt(formData.producto_id, 10),
                descuento,
                tipo_oferta: formData.tipo_oferta || null,
                // Fecha vacía => null (sin límite)
                fecha_inicio: formData.fecha_inicio || null,
                fecha_fin: formData.fecha_fin || null,
                activo: formData.activo,
            };

            if (editingOferta) {
                await ofertasService.actualizar(editingOferta.oferta_id, data);
            } else {
                await ofertasService.crear(data);
            }

            mostrarNotificacion(editingOferta ? 'Oferta actualizada correctamente' : 'Oferta creada correctamente');
            setModalOpen(false);
            cargarDatos(false);
        } catch (error) {
            mostrarNotificacion('Error al guardar la oferta: ' + error.message, 'error');
        } finally {
            setGuardando(false);
        }
    }

    async function handleDelete(oferta) {
        if (!confirm(`¿Estás seguro de eliminar la oferta del producto "${oferta.producto?.nombre || 'N/A'}"?`)) return;
        try {
            await ofertasService.eliminar(oferta.oferta_id);
            mostrarNotificacion('Oferta eliminada correctamente');
            setOfertas((prev) => prev.filter((o) => o.oferta_id !== oferta.oferta_id));
        } catch (error) {
            mostrarNotificacion('Error al eliminar la oferta: ' + error.message, 'error');
        }
    }

    async function handleToggle(oferta) {
        try {
            await ofertasService.toggle(oferta.oferta_id);
            mostrarNotificacion(`Oferta ${oferta.activo ? 'desactivada' : 'activada'} correctamente`);
            setOfertas((prev) => prev.map((o) => (o.oferta_id === oferta.oferta_id ? { ...o, activo: !o.activo } : o)));
        } catch (error) {
            mostrarNotificacion('Error al cambiar el estado: ' + error.message, 'error');
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
                <h2 className="text-xl font-bold text-gray-800 md:text-2xl">Gestión de Ofertas</h2>
                <p className="mt-1 text-sm text-gray-600 md:text-base">Administrá descuentos y promociones para productos</p>
            </div>

            {/* Barra de acciones */}
            <div className="mb-4 flex flex-col gap-3 md:mb-6">
                <Button onClick={handleCreate} className="w-full md:w-auto">+ Nueva Oferta</Button>

                <div className="relative min-w-0">
                    <label htmlFor="busqueda-ofertas" className="sr-only">Buscar ofertas</label>
                    <input
                        id="busqueda-ofertas"
                        type="text"
                        placeholder="Buscar por producto, marca o tipo..."
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
                    data={ofertasFiltradas}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>

            {/* Modal crear/editar */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingOferta ? 'Editar Oferta' : 'Nueva Oferta'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-[#f7f7f5] p-3">
                    <Seccion n="1" titulo="Producto">
                        <Campo label="Producto *" hint={editingOferta ? 'Podés cambiar el producto de esta oferta si lo necesitás.' : undefined}>
                            <select name="producto_id" value={formData.producto_id} onChange={handleInputChange} required className={input}>
                                <option value="">Elegí un producto</option>
                                {productos.map((p) => (
                                    <option key={p.producto_id} value={p.producto_id}>
                                        {p.nombre} - {moneda(p.precio)}{nombreMarca(p) ? ` (${nombreMarca(p)})` : ''}
                                    </option>
                                ))}
                            </select>
                        </Campo>
                    </Seccion>

                    <Seccion n="2" titulo="Descuento">
                        <Campo label="Porcentaje de descuento * (0-100)">
                            <div className="flex items-center gap-2">
                                <input type="number" name="descuento" value={formData.descuento} onChange={handleInputChange} step="0.01" min="0" max="100" required placeholder="10" className={`${input} flex-1`} />
                                <span className="font-medium text-gray-700">%</span>
                            </div>
                        </Campo>
                        {precios && (
                            <div className="mt-3 rounded-xl border border-[#a8763e]/30 bg-[#a8763e]/5 p-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Precio original</span>
                                    <span className="text-gray-500 line-through">{moneda(precios.original)}</span>
                                </div>
                                <div className="mt-1 flex justify-between">
                                    <span className="text-gray-600">Descuento</span>
                                    <span className="font-bold text-red-600">{formData.descuento}% OFF</span>
                                </div>
                                <div className="mt-2 flex justify-between border-t border-[#a8763e]/20 pt-2 text-base font-bold">
                                    <span className="text-green-700">Precio final</span>
                                    <span className="text-green-700">{moneda(precios.final)}</span>
                                </div>
                                <p className="mt-1 text-right text-xs font-medium text-green-700">Ahorro de {moneda(precios.ahorro)}</p>
                            </div>
                        )}
                    </Seccion>

                    <Seccion n="3" titulo="Tipo de oferta">
                        <Campo label="Tipo">
                            <select name="tipo_oferta" value={formData.tipo_oferta} onChange={handleInputChange} className={input}>
                                {tiposOferta.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </Campo>
                    </Seccion>

                    <Seccion
                        n="4"
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
                                : 'Sin fechas, la oferta está vigente siempre mientras esté activa.'}
                        </p>
                    </Seccion>

                    <Seccion n="5" titulo="Visibilidad en la tienda">
                        <Interruptor
                            checked={formData.activo}
                            onChange={(v) => setFormData((prev) => ({ ...prev, activo: v }))}
                            titulo="Oferta activa"
                            desc="Se aplica el descuento en la tienda"
                        />
                    </Seccion>

                    {/* Botones de acción */}
                    <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#e8e4dc] bg-white/95 py-3">
                        <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-[#d9d5cb] bg-white px-5 py-2 text-sm font-semibold hover:bg-[#f7f7f5]">Cancelar</button>
                        <button type="submit" disabled={guardando} className="rounded-lg bg-[#111] px-6 py-2 text-sm font-semibold text-white hover:bg-[#a8763e] disabled:opacity-60">
                            {guardando ? 'Guardando...' : editingOferta ? 'Guardar cambios' : 'Crear oferta'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
