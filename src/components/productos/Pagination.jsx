/**
 * Componente de paginación para navegar entre páginas de productos
 * Muestra botones de navegación y páginas numeradas
 */
export default function Pagination({ 
    paginaActual = 1, 
    totalPaginas = 1, 
    onCambioPagina 
}) {
    // No mostrar paginación si solo hay una página
    if (totalPaginas <= 1) {
        return null;
    }

    // Función para generar los números de página a mostrar
    const generarPaginas = () => {
        const paginas = [];
        const maxPaginasVisibles = 5;
        
        // Si hay pocas páginas, mostrarlas todas
        if (totalPaginas <= maxPaginasVisibles) {
            for (let i = 1; i <= totalPaginas; i++) {
                paginas.push(i);
            }
        } else {
            // Lógica para mostrar páginas con puntos suspensivos
            if (paginaActual <= 3) {
                // Cerca del inicio
                for (let i = 1; i <= 4; i++) {
                    paginas.push(i);
                }
                paginas.push('...');
                paginas.push(totalPaginas);
            } else if (paginaActual >= totalPaginas - 2) {
                // Cerca del final
                paginas.push(1);
                paginas.push('...');
                for (let i = totalPaginas - 3; i <= totalPaginas; i++) {
                    paginas.push(i);
                }
            } else {
                // En el medio
                paginas.push(1);
                paginas.push('...');
                for (let i = paginaActual - 1; i <= paginaActual + 1; i++) {
                    paginas.push(i);
                }
                paginas.push('...');
                paginas.push(totalPaginas);
            }
        }
        
        return paginas;
    };

    const paginas = generarPaginas();

    // Función para manejar el cambio de página
    const handleCambioPagina = (nuevaPagina) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas && nuevaPagina !== paginaActual) {
            onCambioPagina(nuevaPagina);
            // Scroll suave al inicio de los productos
            window.scrollTo({ top: 300, behavior: 'smooth' });
        }
    };

    return (
        <div className="flex items-center justify-center gap-2 mt-8 mb-4">
            {/* Botón Anterior */}
            <button
                onClick={() => handleCambioPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className={`
                    px-4 py-2 rounded-lg font-semibold text-sm transition-all
                    ${paginaActual === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-blue-500'
                    }
                `}
                aria-label="Página anterior"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
                </svg>
            </button>

            {/* Números de página */}
            <div className="flex items-center gap-1">
                {paginas.map((pagina, index) => {
                    if (pagina === '...') {
                        return (
                            <span key={`dots-${index}`} className="px-3 py-2 text-gray-400">
                                ...
                            </span>
                        );
                    }

                    const esPaginaActual = pagina === paginaActual;

                    return (
                        <button
                            key={pagina}
                            onClick={() => handleCambioPagina(pagina)}
                            className={`
                                px-4 py-2 rounded-lg font-semibold text-sm transition-all
                                ${esPaginaActual
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-blue-500'
                                }
                            `}
                            aria-label={`Página ${pagina}`}
                            aria-current={esPaginaActual ? 'page' : undefined}
                        >
                            {pagina}
                        </button>
                    );
                })}
            </div>

            {/* Botón Siguiente */}
            <button
                onClick={() => handleCambioPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className={`
                    px-4 py-2 rounded-lg font-semibold text-sm transition-all
                    ${paginaActual === totalPaginas
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-blue-500'
                    }
                `}
                aria-label="Página siguiente"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                </svg>
            </button>

            {/* Información de página actual */}
            <span className="ml-4 text-sm text-gray-600">
                Página {paginaActual} de {totalPaginas}
            </span>
        </div>
    );
}
