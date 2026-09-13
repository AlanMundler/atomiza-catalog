export interface Resena {
  name: string;
  locality: string;
  text: string;
  /** Estrellas de la reseña en Google (1-5). Se renderizan tal cual. */
  rating: number;
  perfume?: string;
}

// Reseñas reales de Google Business, textuales. Solo se muestran las que
// tienen texto; las de solo-estrellas igual cuentan en el promedio.
// Cuando lleguen más, se agregan acá tal cual. Nunca inventar testimonios.
export const resenas: Resena[] = [
  {
    name: 'Gabriel Adrian Martinez',
    locality: 'Córdoba',
    text: 'Excelente relacion precio /calidad .Excelente atencion. Y los productos bien armados y empaquetados.Recomiendo...',
    rating: 5,
  },
  {
    name: 'Santiago Carignano',
    locality: 'Córdoba',
    text: 'Encargué 3 decants el domingo y retiré el lunes. Muy buen detalle al packaging y todo entregado en excelentes condiciones. Un 10!',
    rating: 5,
  },
  {
    name: 'Simeoni 70',
    locality: 'Córdoba',
    text: 'Perfumes muy recomendables y de calidad. La atención es excelente.',
    rating: 5,
  },
  {
    name: 'Gonzalo Megale',
    locality: 'Córdoba',
    text: 'Perfumes árabes originales, excelente calidad de atomizadores y muy buena atención al cliente',
    rating: 5,
  },
];

export const resenasRating = {
  ratingValue: 5,
  // 6 reseñas de 5 estrellas en Google (4 con texto + Nico Corso y
  // Victoria Lopez solo-estrellas). Si el total de Google difiere,
  // actualizar acá.
  reviewCount: 6,
};

export const hasResenas = resenas.length > 0;
