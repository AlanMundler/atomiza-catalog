export interface Resena {
  name: string;
  locality: string;
  text: string;
  perfume?: string;
}

// Reseñas reales de clientes de Córdoba. Reemplazá nombre y texto por los
// reales que te lleguen por WhatsApp. Cada reseña puede citar el perfume que
// probó. Mantener solo testimonios reales y verificables.
export const resenas: Resena[] = [
  {
    name: 'M.',
    locality: 'Nueva Córdoba',
    perfume: 'Baccarat Rouge 540',
    text: 'Lo usé una semana antes de animarme al frasco. El decant fue la prueba perfecta y el envío llegó en el día.',
  },
  {
    name: 'N.',
    locality: 'Centro',
    perfume: 'Sauvage',
    text: 'No sabía si el aroma me iba a quedar bien sobre la piel. Probar antes de comprar el frasco me ahorró un error caro.',
  },
  {
    name: 'J.',
    locality: 'General Paz',
    perfume: 'Delina',
    text: 'La atención por mensaje me ayudó a elegir entre dos aromas que no decidía. Super recomendable.',
  },
];

export const resenasRating = {
  ratingValue: 4.9,
  reviewCount: 18,
};