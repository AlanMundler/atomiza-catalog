/** Serializa datos para un <script type="application/ld+json">.
 *  Escapa `<` para que un `</script>` dentro de un texto de dato no pueda
 *  cerrar el bloque (el escape \u003c es JSON válido y Google lo parsea igual). */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
