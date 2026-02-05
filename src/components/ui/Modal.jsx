// Componente Modal reutilizable
// Muestra contenido en un overlay modal con animación

// Importa useEffect para efectos secundarios
import { useEffect } from 'react';

// Componente principal Modal
export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
	// Efecto para cerrar el modal con la tecla ESC
	useEffect(() => {
		const handleEscape = (e) => {
			if (e.key === 'Escape' && isOpen) {
				onClose(); // Llama función de cierre
			}
		};
		document.addEventListener('keydown', handleEscape);
		// Limpia el listener al desmontar
		return () => document.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	// Efecto para prevenir el scroll del body cuando el modal está abierto
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}
		// Limpia el estilo al desmontar
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isOpen]);

	// Si el modal no está abierto, no renderiza nada
	if (!isOpen) return null;

	// Clases de tamaño para el modal
	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-2xl',
		lg: 'max-w-4xl',
		xl: 'max-w-6xl',
	};

	// Renderiza el modal y su overlay
	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			{/* Overlay oscuro, cierra el modal al hacer click */}
			<div 
				className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
				onClick={onClose}
			/>

			{/* Contenedor del modal centrado */}
			<div className="flex min-h-full items-center justify-center p-4">
				<div 
					className={`relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} transform transition-all`}
					onClick={(e) => e.stopPropagation()} // Evita que el click en el modal cierre el overlay
				>
					{/* Header del modal con título y botón de cerrar */}
					<div className="flex items-center justify-between p-6 border-b border-gray-200">
						<h3 className="text-xl font-semibold text-gray-900">
							{title}
						</h3>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-gray-600 transition-colors"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					{/* Contenido del modal */}
					<div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}
