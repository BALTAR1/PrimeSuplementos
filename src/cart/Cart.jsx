import React, { useEffect, useState } from 'react';
import { getCart, removeItem, clearCart, subscribeCart } from '../hooks/useCart.js';

export default function Cart() {
  const [cart, setCart] = useState({ items: [], totalItems: 0, totalPrice: 0 });
  const [toast, setToast] = useState(null);

  // Número de WhatsApp de la tienda (formato: código de país + número sin espacios)
  const WHATSAPP_NUMBER = '542646615213';

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', { 
      style: 'currency', 
      currency: 'ARS', 
      maximumFractionDigits: 0 
    }).format(amount);
  };

  // Formatear características del producto
  const formatCharacteristics = (chars) => {
    if (!chars) return '';
    if (typeof chars === 'string') return chars;
    try {
      return Object.entries(chars)
        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
        .join(' | ');
    } catch (e) {
      return '';
    }
  };

  // Construir URL de WhatsApp con el pedido
  const buildWhatsAppUrl = (cart) => {
    if (!cart || !cart.items || cart.items.length === 0) return '#';

    const lines = [];
    lines.push('Hola, quiero realizar el siguiente pedido:');
    lines.push('');
    lines.push('DETALLE DEL PEDIDO');
    lines.push('─────────────────');
    
    cart.items.forEach((item, index) => {
      const price = Number(item.precio || 0);
      const qty = Number(item.cantidad || 0);
      const subtotal = price * qty;
      
      lines.push(`${index + 1}. ${item.nombre}`);
      lines.push(`   Cantidad: ${qty}`);
      
      if (item.caracteristicas) {
        const chars = formatCharacteristics(item.caracteristicas);
        if (chars) lines.push(`   ${chars}`);
      }
      
      lines.push(`   Subtotal: ${formatCurrency(subtotal)}`);
      lines.push('');
    });
    
    lines.push('─────────────────');
    lines.push(`TOTAL: ${formatCurrency(cart.totalPrice || 0)}`);
    lines.push('');
    const text = lines.join('\n');
    const encoded = encodeURIComponent(text);
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
  };

  useEffect(() => {
    // Cargar carrito inicial
    setCart(getCart());

    // Suscribirse a cambios del carrito
    const unsubscribe = subscribeCart(() => {
      setCart(getCart());
    });

    // Listener para notificación de producto agregado
    const handleAdded = (e) => {
      const { item } = e?.detail || {};
      if (!item) return;
      
      showToast(`${item.nombre} agregado al carrito`);
      setCart(getCart());
    };

    window.addEventListener('mp_cart_added', handleAdded);

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      window.removeEventListener('mp_cart_added', handleAdded);
    };
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleRemove = (item) => {
    removeItem(item);
    setCart(getCart());
    showToast('Producto eliminado del carrito');
  };

  const handleClear = () => {
    if (!confirm('¿Está seguro que desea vaciar el carrito?')) return;
    clearCart();
    setCart(getCart());
    showToast('Carrito vaciado');
  };

  // Carrito vacío
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 md:py-12 px-4 md:px-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Carrito de Compras</h1>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12 text-center">
            <svg 
              className="mx-auto h-20 md:h-24 w-20 md:w-24 text-gray-300 mb-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="1.5" 
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
              />
            </svg>
            
            <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-3">
              Su carrito está vacío
            </h2>
            <p className="text-gray-500 mb-8 text-sm md:text-base">
              Agregue productos para continuar con su compra
            </p>
            
            <a 
              href="/productos" 
              className="inline-block bg-amber-500 text-white px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors text-sm md:text-base"
            >
              Ver Productos
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Carrito con productos
  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12 px-4 md:px-0">
      {/* Toast de notificación */}
      {toast && (
        <div className="fixed top-6 right-6 bg-gray-900 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg shadow-lg z-50 animate-fade-in text-sm md:text-base">
          {toast}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Carrito de Compras
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            {cart.totalItems} {cart.totalItems === 1 ? 'producto' : 'productos'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Lista de productos */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4">
            {cart.items.map((item, index) => {
              const itemSubtotal = (item.precio || 0) * (item.cantidad || 1);
              
              return (
                <div 
                  key={index} 
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-3 md:gap-6">
                    {/* Imagen del producto */}
                    <div className="flex-shrink-0">
                      <img 
                        src={item.imagen || '/images/placeholder.svg'} 
                        alt={item.nombre}
                        className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg border border-gray-200"
                      />
                    </div>

                    {/* Información del producto */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 md:mb-2 truncate">
                        {item.nombre}
                      </h3>
                      
                      {item.caracteristicas && (
                        <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3 line-clamp-2">
                          {formatCharacteristics(item.caracteristicas)}
                        </p>
                      )}

                      <div className="text-xs md:text-sm text-gray-600">
                        Cantidad: <span className="font-semibold text-gray-900">{item.cantidad}</span>
                      </div>
                    </div>

                    {/* Precio y botón eliminar */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">
                        {formatCurrency(itemSubtotal)}
                      </div>
                      <div className="text-xs md:text-sm text-gray-500 mb-2 md:mb-4">
                        {formatCurrency(item.precio)} c/u
                      </div>
                      <button
                        onClick={() => handleRemove(item)}
                        className="text-xs md:text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Botón vaciar carrito */}
            <button
              onClick={handleClear}
              className="w-full bg-white border-2 border-red-200 text-red-600 px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium hover:bg-red-50 transition-colors text-sm md:text-base"
            >
              Vaciar Carrito
            </button>
          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 sticky top-6 md:top-20">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6">
                Resumen del Pedido
              </h2>

              <div className="space-y-2 md:space-y-3 mb-4 md:mb-6 pb-4 md:pb-6 border-b border-gray-200">
                <div className="flex justify-between text-sm md:text-base text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(cart.totalPrice)}</span>
                </div>
              </div>

              <div className="flex justify-between text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6">
                <span>Total</span>
                <span>{formatCurrency(cart.totalPrice)}</span>
              </div>

              <a
                href={buildWhatsAppUrl(cart)}
                target="_blank"
                rel="noreferrer"
                className="block w-full bg-green-600 text-white px-4 md:px-6 py-3 md:py-4 rounded-lg font-semibold text-center hover:bg-green-700 transition-colors mb-2 md:mb-3 text-sm md:text-base"
              >
                Enviar Pedido por WhatsApp
              </a>

              <a
                href="/productos"
                className="block w-full bg-white border-2 border-gray-300 text-gray-700 px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium text-center hover:bg-gray-50 transition-colors text-sm md:text-base"
              >
                Seguir Comprando
              </a>

              <p className="text-xs text-gray-500 mt-3 md:mt-4 text-center">
                Al enviar el pedido será redirigido a WhatsApp para coordinar el pago.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
