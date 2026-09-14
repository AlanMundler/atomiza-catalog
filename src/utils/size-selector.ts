/**
 * Marca visual del talle elegido en `SizeSelector.astro`: el radio está
 * oculto y la selección se ve por la clase `size-option--selected` del
 * label, que el SSR solo pinta en el talle por defecto. Al cambiar de
 * talle hay que mover la clase al label del radio marcado.
 */
export function syncSelectedSizeClass(inputs: readonly HTMLInputElement[]): void {
  for (const input of inputs) {
    const label = input.closest('label');
    if (!label) continue;
    label.classList.toggle('size-option--selected', input.checked);
  }
}
