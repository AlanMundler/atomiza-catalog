// =============================================================
// PRECIO DE FRASCO COMPLETO (100ml) EN ARGENTINA
// -------------------------------------------------------------
// Se usa para el anclaje de precio en la ficha de producto: mostrar
// el valor del frasco entero para que el decant se lea como "probar
// antes de comprar", no como "perfume caro".
//
// REGLA: SOLO como fuente principal la tienda oficial elegida por el
// usuario: Perfumia (https://www.perfumia.com.ar, asegura originales).
// NO usar Mercado Libre ni listados de dudosa procedencia.
// Si un perfume no está listado en Perfumia, NO se muestra anclaje
// (getFrascoPrecio devuelve null). Precios reales del listado del
// frasco de 100ml en Perfumia (sept 2026). Actualizar manualmente.
// =============================================================

export interface FrascoPrecio {
  /** Mínimo real observado (ARS). */
  min: number;
  /** Máximo real observado (ARS). Igual a min = precio único. */
  max: number;
}

/** Frascos 100ml listados en Perfumia (sept 2026). */
const frascoVerificado: Record<string, FrascoPrecio> = {
  // MAISON ALHAMBRA - Yeah! Parfum 100ml ($59.605, sin stock)
  yeah: { min: 59605, max: 59605 },
  // LATTAFA - Angham 100ml ($87.204, sin stock)
  angham: { min: 87204, max: 87204 },
  // LATTAFA - Mayar 100ml ($75.376, sin stock)
  mayar: { min: 75376, max: 75376 },
  // LATTAFA - Qaed Al Fursan Untamed 100ml ($47.776, con stock)
  'qaed-al-fursan-untamed': { min: 47776, max: 47776 },
  // RASASI - Hawas ice for Him 100ml ($92.470, sin stock)
  'hawas-ice': { min: 92470, max: 92470 },
};

export function getFrascoPrecio(slug: string): FrascoPrecio | null {
  return frascoVerificado[slug] ?? null;
}