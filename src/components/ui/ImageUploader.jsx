// Componente ImageUploader
// Permite subir imágenes a Supabase Storage y obtener su URL pública

// Importa useState para manejar estados locales
import { useState } from 'react';
// Importa instancia de Supabase para subir imágenes
import { supabase } from '../../lib/supabaseCliente.js';

// Componente principal para subir imágenes
export default function ImageUploader({ onImageUploaded, currentImages = [], onDeleteImage }) {
	// Estado para mostrar spinner de carga
	const [uploading, setUploading] = useState(false);
	// Estado para mostrar progreso de subida
	const [uploadProgress, setUploadProgress] = useState(0);

	// Maneja la selección de archivo y la subida
	async function handleFileSelect(e) {
		const file = e.target.files?.[0]; // Obtiene el archivo seleccionado
		if (!file) return;

		// Validar tipo de archivo (solo imágenes)
		if (!file.type.startsWith('image/')) {
			alert('Por favor selecciona un archivo de imagen válido');
			return;
		}

		// Validar tamaño (máximo 5MB)
		if (file.size > 5 * 1024 * 1024) {
			alert('La imagen debe ser menor a 5MB');
			return;
		}

		try {
			setUploading(true); // Activa spinner
			setUploadProgress(10); // Progreso inicial

			// Crea nombre único para el archivo
			const fileExt = file.name.split('.').pop();
			const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
			const filePath = `productos/${fileName}`;

			setUploadProgress(30); // Progreso tras preparar nombre

			// Subir imagen a Supabase Storage
			const { data, error } = await supabase.storage
				.from('productos') // Nombre del bucket en Supabase Storage
				.upload(filePath, file, {
					cacheControl: '3600',
					upsert: false
				});

			if (error) {
				throw error;
			}

			setUploadProgress(70); // Progreso tras subir

			// Obtener URL pública de la imagen subida
			const { data: { publicUrl } } = supabase.storage
				.from('productos')
				.getPublicUrl(filePath);

			setUploadProgress(100); // Progreso final

			// Notifica al componente padre la URL subida
			if (onImageUploaded) {
				onImageUploaded(publicUrl);
			}

			// Resetea el input de archivo
			e.target.value = '';

		} catch (error) {
			alert('Error al subir la imagen: ' + error.message);
		} finally {
			setUploading(false); // Oculta spinner
			setUploadProgress(0); // Resetea progreso
		}
	}

	// Renderiza el uploader y la previsualización
	return (
		<div className="space-y-4">
			{/* Sección para subir imagen */}
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Imágenes del Producto
				</label>
				<div className="flex items-center gap-3">
					{/* Input de archivo oculto y botón visual */}
					<label className="relative cursor-pointer">
						<input
							type="file"
							accept="image/*"
							onChange={handleFileSelect}
							disabled={uploading}
							className="hidden"
						/>
						<div className={`
							px-4 py-2 border-2 border-dashed rounded-lg
							${uploading ? 'border-gray-300 bg-gray-50 cursor-not-allowed' : 'border-blue-300 hover:border-blue-500 bg-blue-50 hover:bg-blue-100'}
							transition-all duration-200
						`}>
							<div className="flex items-center gap-2 text-blue-600">
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
								</svg>
								<span className="font-medium">
									{uploading ? 'Subiendo...' : 'Agregar Imagen'}
								</span>
							</div>
						</div>
					</label>
					{/* Muestra el progreso en texto si está subiendo */}
					{uploading && (
						<span className="text-sm text-gray-600">
							{uploadProgress}%
						</span>
					)}
				</div>
				<p className="text-xs text-gray-500 mt-1">
					Formatos: JPG, PNG, GIF. Tamaño máximo: 5MB
				</p>
			</div>

			{/* Barra de progreso visual */}
			{uploading && (
				<div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
					<div 
						className="bg-blue-600 h-2 transition-all duration-300 ease-out"
						style={{ width: `${uploadProgress}%` }}
					/>
				</div>
			)}

			{/* Previsualización de imágenes subidas */}
			{currentImages.length > 0 && (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
					{currentImages.map((url, index) => (
						<div key={index} className="relative group">
							{/* Imagen subida */}
							<img
								src={url}
								alt={`Imagen ${index + 1}`}
								className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
							/>
							{/* Badge para indicar orden/principal */}
							<div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
								{index === 0 ? 'Principal' : `#${index + 1}`}
							</div>
							{/* Botón para eliminar imagen */}
							{onDeleteImage && (
								<button
									type="button"
									onClick={() => onDeleteImage(index)}
									className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
									title="Eliminar imagen"
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
