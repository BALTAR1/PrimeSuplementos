// src/config/whatsappMessages.js

export const whatsappConfig = {
  mayorista: {
    number: '5492646615213',
    message: 'Hola, estoy interesado en comprar al por mayor y me gustaría recibir asesoramiento personalizado. ¿Pueden ayudarme?'
  },
};

export function buildWhatsappUrl({ number, message }) {
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encodedMsg}`;
}
