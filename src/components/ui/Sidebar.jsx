import { useState } from 'react';
// Importa la función para cerrar sesión
import { logout } from '../../utils/auth.js';

// Componente principal Sidebar
export default function Sidebar() {
    // Estado para controlar si el sidebar está abierto en mobile
    const [isOpen, setIsOpen] = useState(false);
    // Estado para swipe
    const [touchStartX, setTouchStartX] = useState(null);
    const [touchEndX, setTouchEndX] = useState(null);

    // Maneja el cierre de sesión con confirmación
    const handleLogout = () => {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            logout(); // Llama función de logout
        }
    };

    // Toggle del sidebar en mobile
    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    // Maneja el inicio del toque
    const handleTouchStart = (e) => {
        setTouchStartX(e.touches[0].clientX);
    };

    // Maneja el movimiento del toque
    const handleTouchMove = (e) => {
        setTouchEndX(e.touches[0].clientX);
    };

    // Maneja el final del toque y detecta swipe
    const handleTouchEnd = () => {
        if (touchStartX !== null && touchEndX !== null) {
            const distance = touchEndX - touchStartX;
            // Si el usuario desliza hacia la izquierda más de 60px, cierra el sidebar
            if (distance < -60) {
                setIsOpen(false);
            }
        }
        setTouchStartX(null);
        setTouchEndX(null);
    };

    // Renderiza el sidebar completo
    return (
        <>
            {/* Botón hamburguesa para mobile - DERECHA */}
            <button
                onClick={toggleSidebar}
                className="fixed top-4 right-4 z-50 lg:hidden bg-gray-900 text-white p-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
                aria-label="Abrir menú"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Overlay oscuro en mobile cuando el sidebar está abierto */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-40
                    w-64 bg-gray-900 text-white min-h-screen flex flex-col
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
                onTouchStart={isOpen ? handleTouchStart : undefined}
                onTouchMove={isOpen ? handleTouchMove : undefined}
                onTouchEnd={isOpen ? handleTouchEnd : undefined}
            >
                {/* Header con título y subtítulo */}
                <div className="p-6 border-b border-gray-700">
                    <div>
                        <h1 className="text-2xl font-bold">Prime Suplementos</h1>
                        <p className="text-sm text-gray-400 mt-1">Panel Administrativo</p>
                    </div>
                </div>

                {/* Navegación principal */}
                <nav className="flex-1 p-4 overflow-y-auto">
                    <ul className="space-y-2">
                        {/* Enlace a inicio */}
                        <li>
                            <a href="/dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span>Inicio</span>
                            </a>
                        </li>
                        {/* Enlace a productos */}
                        <li>
                            <a href="/dashboard/productos" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <span>Productos</span>
                            </a>
                        </li>
                        {/* Enlace a categorías */}
                        <li>
                            <a href="/dashboard/categorias" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span>Categorías</span>
                            </a>
                        </li>
                        {/* Separador de sección */}
                        <li className="pt-4 pb-2">
                            <div className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Marketing
                            </div>
                        </li>
                        {/* Enlace a banners */}
                        <li>
                            <a href="/dashboard/banners" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Banners</span>
                            </a>
                        </li>
                        {/* Separador de sección */}
                        <li className="pt-4 pb-2">
                            <div className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Promociones
                            </div>
                        </li>
                        {/* Enlace a ofertas */}
                        <li>
                            <a href="/dashboard/ofertas" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Ofertas</span>
                            </a>
                        </li>
                        {/* Enlace a combos */}
                        <li>
                            <a href="/dashboard/combos" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <span>Combos</span>
                            </a>
                        </li>
                    </ul>
                </nav>

                {/* Footer con botón de cerrar sesión */}
                <div className="p-4 border-t border-gray-700">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-600 transition bg-red-500"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
