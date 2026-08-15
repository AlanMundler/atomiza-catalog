// =============================================================
// CONFIGURACIÓN DEL EMPRENDIMIENTO
// -------------------------------------------------------------
// Para reutilizar este sitio en otro negocio, editá SOLO este
// archivo: nombre, redes, WhatsApp, textos del pedido y las
// claves de almacenamiento local.
//
// El base path (ruta base del sitio en GitHub Pages) sale de
// `astro.config.mjs` (env BASE_PATH); acá solo se expone via
// `import.meta.env.BASE_URL`, no hace falta tocarlo.
// =============================================================

export const site = {
  name: 'ΛTOMIZΛ',
  namePlain: 'ATOMIZA',
  tagline: 'Decants de autor',
  description: 'Boutique de perfumes de lujo en decants de 5ml.',
  locale: 'es_AR',
  basePath: import.meta.env.BASE_URL,
  instagramHandle: 'atomiza.cba',
  instagramUrl: 'https://instagram.com/atomiza.cba',
  whatsappNumber: '5493472559307',
  whatsappUrl: 'https://wa.me/5493472559307',
  whatsappMessage: 'Hola, quiero hacer un pedido',
  phoneDisplay: '54 9 3472 559307',
  currency: 'ARS',
  storage: {
    cart: 'atomiza-cart',
    perfumes: 'perfumes-data',
  },
} as const;

/** Resuelve una ruta de asset (ej. "images/…" o "/images/…") contra el base path. */
export function assetUrl(src: string | undefined): string {
  if (!src) return `${site.basePath}images/placeholder.svg`;
  if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(src)) return src;
  return site.basePath + src.replace(/^\//, '');
}
