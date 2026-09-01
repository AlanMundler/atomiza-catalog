export interface Resena {
  name: string;
  locality: string;
  text: string;
  perfume?: string;
}

// Reseñas reales de Google Business. Vacío por defecto: la sección de la home
// y el schema AggregateRating NO aparecen hasta que haya reseñas reales.
// Cuando el usuario pase las reseñas de Google, se cargan acá tal cual (nombre
// real o inicial, texto y valoración reales). Nunca inventar testimonios.
export const resenas: Resena[] = [];

export const resenasRating = {
  ratingValue: 0,
  reviewCount: 0,
};

export const hasResenas = resenas.length > 0;