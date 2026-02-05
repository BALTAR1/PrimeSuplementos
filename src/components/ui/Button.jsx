// Componente Button reutilizable
// Proporciona diferentes variantes de botones con estilos consistentes

// Recibe props para personalizar el botón
export default function Button({ 
	children, // Contenido del botón
	onClick, // Función al hacer click
	variant = 'primary', // Variante de estilo
	type = 'button', // Tipo de botón (button, submit, etc)
	disabled = false, // Si está deshabilitado
	className = '', // Clases CSS extra
	...props // Otros props
}) {
	// Estilos base para todos los botones
	const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
	// Variantes de estilos según el tipo de botón
	const variants = {
		primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
		secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
		success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
		danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
		warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
		outline: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500',
	};
  
	// Selecciona los estilos según la variante
	const variantStyles = variants[variant] || variants.primary;
  
	// Renderiza el botón con los estilos y props correspondientes
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			className={`${baseStyles} ${variantStyles} ${className}`}
			{...props}
		>
			{/* Contenido del botón */}
			{children}
		</button>
	);
}
