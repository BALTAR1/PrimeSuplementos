// Importa React y hooks necesarios
import React, { useEffect, useState } from 'react';
// Importa funciones para obtener cantidad y suscribirse a cambios del carrito
import { getCartCount, subscribeCart } from '../../hooks/useCart.js';

// Componente que muestra el ícono del carrito y la cantidad de productos
export default function CartIcon() {
  // Estado para la cantidad de productos en el carrito
  const [cartCount, setCartCount] = useState(0);

  // Efecto para inicializar y suscribirse a cambios del carrito
  useEffect(() => {
    // Obtiene la cantidad inicial de productos en el carrito
    setCartCount(getCartCount());

    // Se suscribe a los cambios del carrito para actualizar el contador
    const unsubscribe = subscribeCart(() => {
      setCartCount(getCartCount());
    });

    // Limpia la suscripción al desmontar el componente
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Renderiza el ícono del carrito con contador
  return (
    // Enlace al carrito de compras
    <a 
      href="/carrito" 
      className="relative inline-flex items-center justify-center text-gray-800 hover:text-blue-600 transition-colors"
      title="Ver carrito de compras"
    >
      {/* Ícono SVG del carrito */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-6 w-6" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2" 
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
        />
      </svg>
      
      {/* Si hay productos en el carrito, muestra el contador */}
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-blue-600 rounded-full">
          {/* Si hay más de 99 productos, muestra '99+' */}
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </a>
  );
}
