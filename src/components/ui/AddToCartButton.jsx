// Importa React y el hook useState
import React, { useState } from 'react';
// Importa la función para agregar productos al carrito
import { addToCart } from '../../hooks/useCart.js';

// Componente para agregar productos al carrito
export default function AddToCartButton({ 
  producto, // Producto a agregar
  cantidad = 1, // Cantidad por defecto
  caracteristicas = null, // Características adicionales
  className = "", // Clases CSS extra
  children = "Agregar al carrito" // Texto o contenido del botón
}) {
  // Estado para mostrar spinner de carga
  const [loading, setLoading] = useState(false);
  // Estado para mostrar feedback visual
  const [showFeedback, setShowFeedback] = useState(false);

  // Función que maneja el click en el botón
  const handleAddToCart = () => {
    setLoading(true); // Activa spinner

    // Construye el objeto del producto para el carrito
    const itemCarrito = {
      producto_id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio_con_descuento || producto.precio, // Usa precio con descuento si existe
      imagen: producto.imagen_url,
      cantidad: cantidad,
      caracteristicas: caracteristicas
    };

    // Agrega el producto al carrito
    addToCart(itemCarrito);

    // Muestra feedback visual de éxito
    setShowFeedback(true);
    setTimeout(() => {
      setShowFeedback(false); // Oculta feedback
      setLoading(false); // Desactiva spinner
    }, 2000); // Feedback por 2 segundos
  };

  // Renderiza el botón y el feedback visual
  return (
    <>
      {/* Botón principal para agregar al carrito */}
      <button
        onClick={handleAddToCart}
        disabled={loading}
        className={`relative bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {/* Si está cargando, muestra spinner y texto */}
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Agregando...
          </span>
        ) : (
          // Si no está cargando, muestra el contenido del botón
          children
        )}
      </button>

      {/* Feedback visual cuando se agrega el producto */}
      {showFeedback && (
        <div className="fixed top-20 right-6 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          Producto agregado al carrito
        </div>
      )}
    </>
  );
}
