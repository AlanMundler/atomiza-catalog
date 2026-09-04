// =============================================================
// PRECIO DE FRASCO COMPLETO (100ml) EN ARGENTINA
// -------------------------------------------------------------
// Datos reales de listados online (Mercado Libre + tiendas árabes
// argentinas, sept 2026). Se usan para el anclaje de precio en la
// ficha de producto: mostrar el valor del frasco entero para que el
// decant se lea como "probar antes de comprar", no como "perfume caro".
//
// REGLA: actualizar los valores manualmente cuando cambie el mercado.
// No inventar precios. Si un perfume no tiene dato verificado, se usa
// el "desde" de su marca (mínimos reales observados) y si la marca
// tampoco tiene, no se muestra anclaje.
// =============================================================

export interface FrascoPrecio {
  /** Mínimo real observado (ARS). */
  min: number;
  /** Máximo real observado (ARS). null = solo se muestra "desde". */
  max: number | null;
}

/** Perfumes con precio de frasco 100ml verificado (listados reales sept 2026). */
const frascoVerificado: Record<string, FrascoPrecio> = {
  // Maison Alhambra Luminous Sahara 100ml (Duty Store)
  'luminous-sahara': { min: 55900, max: 60000 },
  // Maison Alhambra Yeah! Man Parfum 100ml (Esencia de vida)
  yeah: { min: 52000, max: 65000 },
  // Lattafa Angham 100ml (MercadoLibre, ZetaShop, Perfumia, Cardales)
  angham: { min: 57799, max: 108000 },
  // Lattafa Mayar 100ml (Noor, Vemax, Fragancias de Oriente, La Parisienne)
  mayar: { min: 51210, max: 90809 },
  // Lattafa Qaed Al Fursan Untamed 100ml (Fragancias de Oriente)
  'qaed-al-fursan-untamed': { min: 54450, max: 60500 },
  // Lattafa Liam (Grey) 100ml (Ambrosia, Alkimias, Bagliore)
  liam: { min: 48000, max: 98500 },
  // Rasasi Hawas Ice 100ml (MercadoLibre, Brume, Alquimiah, Esencia de vida)
  'hawas-ice': { min: 75490, max: 103600 },
};

/** Piso real observado por marca (100ml). Variables no incluidas = sin dato, no anclar. */
const marcaBase: Record<string, FrascoPrecio> = {
  'Maison Alhambra': { min: 41600, max: null },
  'Lattafa Perfumes': { min: 41184, max: null },
  'Rasasi': { min: 67000, max: null },
};

export function getFrascoPrecio(slug: string, brand: string): FrascoPrecio | null {
  return frascoVerificado[slug] ?? marcaBase[brand] ?? null;
}