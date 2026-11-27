/** Minúsculas, sin acentos y sin espacios en los bordes. Para comparar texto libre
 *  (notas, familias, búsquedas): "Ámbar  Amaderado " → "ambar  amaderado". */
export function normalizeText(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/** Slug estable para URLs: normalizeText + todo lo no alfanumérico a guiones.
 *  Ej: "Parfums de Marly" → "parfums-de-marly". NO cambiar esta lógica: los slugs
 *  de /familias/<slug>/ y ?casa=<slug> están indexados. */
export function slugify(value: string): string {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
