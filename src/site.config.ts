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
  // Incrementar cuando cambie el catálogo publicado para invalidar la
  // caché local `perfumes-data` en los navegadores de los visitantes.
  dataVersion: '4',
  instagramHandle: 'atomiza.cba',
  instagramUrl: 'https://instagram.com/atomiza.cba',
  tiktokHandle: 'atomiza.cba',
  tiktokUrl: 'https://www.tiktok.com/@atomiza.cba',
  whatsappNumber: '5493472559307',
  whatsappUrl: 'https://wa.me/5493472559307',
  whatsappMessage: 'Hola, quiero hacer un pedido',
  phoneDisplay: '54 9 3472 559307',
  currency: 'ARS',
  // Localización (Córdoba, Argentina) para SEO local y schema de negocio.
  addressLocality: 'Córdoba Capital',
  addressRegion: 'Córdoba',
  addressCountry: 'AR',
  geo: { latitude: -31.420083, longitude: -64.188776 },
  // Copy del hero de la home. Los perfumes son árabes originales, así que
  // el anclaje de precio va sobre el beneficio real (probar sin comprar el
  // frasco), no sobre un valor inflado que no corresponde.
  hero: {
    title: 'Probá perfumes árabes originales',
    titleHighlight: 'sin comprar el frasco completo',
    subtitle: 'Decants de 5ml de fragancias árabes de autor. Los probás sobre tu piel unos días y recién ahí decidís si querés el frasco entero.',
    priceNote: 'Decants de 5ml desde $6.000',
    ctaPrimary: 'Ver catálogo',
    ctaSecondary: 'Descubrí tu perfume',
    ctaTertiary: 'Elegí 3. Pagá menos.',
  },
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
