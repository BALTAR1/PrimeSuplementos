/**
 * Hook para gestión del carrito de compras
 * Utiliza localStorage para persistencia de datos
 */

const CART_KEY = 'mp_cart';
const CART_EVENT = 'mp_cart_updated';

/**
 * Compara dos items del carrito.
 * - Los combos se identifican por combo_id (no tienen producto_id numérico).
 * - Los productos se identifican por producto_id.
 * - En ambos casos también deben coincidir las características (sabor, etc.).
 */
function mismoItem(a, b) {
  const idA = a.combo_id ? `combo-${a.combo_id}` : a.producto_id;
  const idB = b.combo_id ? `combo-${b.combo_id}` : b.producto_id;
  return (
    idA === idB &&
    JSON.stringify(a.caracteristicas) === JSON.stringify(b.caracteristicas)
  );
}

/**
 * Obtiene el carrito actual del localStorage
 */
export function getCart() {
  if (typeof window === 'undefined') {
    return { items: [], totalItems: 0, totalPrice: 0 };
  }

  try {
    const raw = localStorage.getItem(CART_KEY);
    const cart = raw ? JSON.parse(raw) : { items: [], totalItems: 0, totalPrice: 0 };
    
    // Recalcular totales para mantener consistencia
    let totalItems = 0;
    let totalPrice = 0;
    
    if (cart.items && Array.isArray(cart.items)) {
      cart.items.forEach(item => {
        const qty = Number(item.cantidad) || 1;
        const price = Number(item.precio) || 0;
        totalItems += qty;
        totalPrice += price * qty;
      });
    }
    
    return {
      items: cart.items || [],
      totalItems,
      totalPrice: Math.round(totalPrice)
    };
  } catch (e) {
    return { items: [], totalItems: 0, totalPrice: 0 };
  }
}

/**
 * Guarda el carrito en localStorage y emite evento de actualización
 */
function saveCart(cart) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { cart } }));
  } catch (e) {
    // Error silencioso
  }
}

/**
 * Agrega un producto (o combo) al carrito
 */
export function addToCart(item) {
  if (!item || !item.nombre) {
    return;
  }

  const cart = getCart();
  
  // Buscar si el producto ya existe (por id y características)
  const existingIndex = cart.items.findIndex(existing => mismoItem(existing, item));

  if (existingIndex !== -1) {
    // Incrementar cantidad del producto existente
    cart.items[existingIndex].cantidad = (cart.items[existingIndex].cantidad || 1) + (item.cantidad || 1);
  } else {
    // Agregar nuevo producto
    cart.items.push({
      ...item,
      cantidad: item.cantidad || 1
    });
  }

  saveCart(cart);
  
  // Emitir evento específico de producto agregado
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mp_cart_added', { detail: { item } }));
  }
}

/**
 * Elimina un producto del carrito
 */
export function removeItem(item) {
  if (!item) return;
  
  const cart = getCart();
  cart.items = cart.items.filter(existing => !mismoItem(existing, item));
  
  saveCart(cart);
}

/**
 * Actualiza la cantidad de un producto
 */
export function updateItemQuantity(item, newQuantity) {
  if (!item || newQuantity < 1) return;
  
  const cart = getCart();
  const existingItem = cart.items.find(existing => mismoItem(existing, item));

  if (existingItem) {
    existingItem.cantidad = newQuantity;
    saveCart(cart);
  }
}

/**
 * Vacía completamente el carrito
 */
export function clearCart() {
  saveCart({ items: [], totalItems: 0, totalPrice: 0 });
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mp_cart_cleared'));
  }
}

/**
 * Suscribe un callback a los cambios del carrito.
 * Además del evento propio, vuelve a leer el carrito cuando:
 * - el navegador restaura la página al volver atrás (pageshow)
 * - se vuelve a la pestaña (visibilitychange)
 * - otra pestaña modifica el carrito (storage)
 */
export function subscribeCart(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleChange = () => callback(getCart());

  // Al volver atrás el navegador puede restaurar la página sin recargarla
  const handlePageShow = () => callback(getCart());

  // Al volver a la pestaña
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') callback(getCart());
  };

  // Cambios hechos desde otra pestaña
  const handleStorage = (e) => {
    if (e.key === CART_KEY || e.key === null) callback(getCart());
  };

  window.addEventListener(CART_EVENT, handleChange);
  window.addEventListener('pageshow', handlePageShow);
  window.addEventListener('storage', handleStorage);
  document.addEventListener('visibilitychange', handleVisibility);
  
  // Retornar función para cancelar suscripción
  return () => {
    window.removeEventListener(CART_EVENT, handleChange);
    window.removeEventListener('pageshow', handlePageShow);
    window.removeEventListener('storage', handleStorage);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}

/**
 * Obtiene el número total de productos en el carrito
 */
export function getCartCount() {
  return getCart().totalItems;
}

/**
 * Obtiene el precio total del carrito
 */
export function getCartTotal() {
  return getCart().totalPrice;
}
