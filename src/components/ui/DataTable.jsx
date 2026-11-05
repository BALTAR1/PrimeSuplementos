// Componente DataTable reutilizable
// Muestra datos en formato de tabla con acciones de editar y eliminar
// En mobile muestra cards en lugar de tabla

// Recibe columnas, datos y funciones de acción como props
import { useState } from 'react';

export default function DataTable({
	columns,
	data,
	onEdit,
	onDelete,
	mobileCollapsible = false,
	mobileSummaryKeys = [],
}) {
	const [expandedRows, setExpandedRows] = useState({});

	const toggleRow = (rowKey) => {
		setExpandedRows((previous) => ({
			...previous,
			[rowKey]: !previous[rowKey],
		}));
	};

	const renderColumn = (column, row) => (
		column.render
			? column.render(row[column.key], row)
			: row[column.key] || '-'
	);

	// Si no hay datos, muestra mensaje y sugerencia
	if (!data || data.length === 0) {
		return (
			<div className="bg-white rounded-lg shadow-md p-6 md:p-8 text-center">
				{/* Ícono SVG de tabla vacía */}
				<svg 
					className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-300 mb-4" 
					fill="none" 
					stroke="currentColor" 
					viewBox="0 0 24 24"
				>
					<path 
						strokeLinecap="round" 
						strokeLinejoin="round" 
						strokeWidth={2} 
						d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
					/>
				</svg>
				{/* Mensaje de tabla vacía */}
				<p className="text-gray-500 text-base md:text-lg">No hay datos para mostrar</p>
				<p className="text-gray-400 text-xs md:text-sm mt-2">Comienza agregando un nuevo registro</p>
			</div>
		);
	}

	// Si hay datos, renderiza la tabla (desktop) o cards (mobile)
	return (
		<div className="bg-[#e0f2fe] rounded-lg shadow-md overflow-hidden">
			{/* VISTA MOBILE - Cards */}
			<div className="block lg:hidden">
				<div className="space-y-3 p-3">
					{data.map((row, index) => (
						<div key={row.id || row.producto_id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
							{mobileCollapsible && (
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0 flex-1">
										{columns
											.filter((column) => mobileSummaryKeys.includes(column.key))
											.map((column) => (
												<div key={column.key} className="flex flex-col gap-1 py-2 first:pt-0 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
													<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider sm:mr-2">
														{column.label}
													</span>
													<span className="min-w-0 text-sm text-gray-900 break-words sm:flex-1 sm:text-right">
														{renderColumn(column, row)}
													</span>
												</div>
											))}
									</div>
									<button
										type="button"
										onClick={() => toggleRow(row.id || row.producto_id || index)}
										className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
										aria-expanded={Boolean(expandedRows[row.id || row.producto_id || index])}
									>
										{expandedRows[row.id || row.producto_id || index] ? 'Ocultar' : 'Ver detalles'}
									</button>
								</div>
							)}
							{/* Renderiza cada campo como fila en la card */}
							{columns
								.filter((column) => !mobileCollapsible || expandedRows[row.id || row.producto_id || index] || mobileSummaryKeys.includes(column.key))
								.map((column) => (
								<div
									key={column.key}
									className={`${mobileCollapsible && mobileSummaryKeys.includes(column.key) ? 'hidden' : ''} flex flex-col gap-1 py-2 border-b border-gray-100 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-3`}
								>
									<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider sm:mr-2">
										{column.label}
									</span>
									<span className="min-w-0 text-sm text-gray-900 break-words sm:flex-1 sm:text-right">
										{renderColumn(column, row)}
									</span>
								</div>
							))}
							{/* Acciones en mobile */}
							<div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-200">
								{onEdit && (
									<button
										onClick={() => onEdit(row)}
										className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"
										title="Editar"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
										</svg>
										<span className="text-xs font-medium">Editar</span>
									</button>
								)}
								{onDelete && (
									<button
										onClick={() => onDelete(row)}
										className="flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
										title="Eliminar"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
										<span className="text-xs font-medium">Eliminar</span>
									</button>
								)}
							</div>
						</div>
					))}
				</div>
				{/* Footer con contador de registros - mobile */}
				<div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
					<p className="text-xs text-gray-600 text-center">
						<span className="px-3 py-1 rounded bg-[#e0f2fe] text-gray-700 font-medium inline-block">
							<span className="font-bold">{data.length}</span> registro(s)
						</span>
					</p>
				</div>
			</div>

			{/* VISTA DESKTOP - Tabla */}
			<div className="hidden lg:block w-full min-w-0 overflow-x-auto overscroll-x-contain">
				<table className="w-full min-w-[1100px] divide-y divide-gray-200">
					<thead className="bg-[#e0f2fe]">
						<tr>
							{/* Renderiza encabezados de columnas */}
							{columns.map((column) => (
								<th
									key={column.key}
									className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider xl:px-4"
								>
									{column.label}
								</th>
							))}
							{/* Columna de acciones */}
							<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								Acciones
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{/* Renderiza filas de datos */}
						{data.map((row, index) => (
							<tr key={row.id || index} className="hover:bg-gray-50 transition-colors">
								{/* Renderiza cada celda según columna */}
								{columns.map((column) => (
									<td key={column.key} className="px-3 py-4 whitespace-nowrap text-sm text-gray-900 xl:px-4">
										{/* Si la columna tiene función render, la usa; si no, muestra el valor */}
										{column.render 
											? column.render(row[column.key], row) 
											: row[column.key] || '-'
										}
									</td>
								))}
								{/* Celda de acciones (editar/eliminar) */}
								<td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium xl:px-4">
									<div className="flex justify-end gap-2">
										{/* Botón editar si existe función onEdit */}
										{onEdit && (
											<button
												onClick={() => onEdit(row)}
												className="text-blue-600 hover:text-blue-800 transition-colors p-1"
												title="Editar"
											>
												<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
												</svg>
											</button>
										)}
										{/* Botón eliminar si existe función onDelete */}
										{onDelete && (
											<button
												onClick={() => onDelete(row)}
												className="text-red-600 hover:text-red-800 transition-colors p-1"
												title="Eliminar"
											>
												<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											</button>
										)}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{/* Footer con contador de registros - desktop */}
				<div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
					<p className="text-sm text-gray-600">
						<span className="px-3 py-1 rounded bg-[#e0f2fe] text-gray-700 font-medium inline-block">
							Mostrando <span className="font-bold">{data.length}</span> registro(s)
						</span>
					</p>
				</div>
			</div>
		</div>
	);
}
