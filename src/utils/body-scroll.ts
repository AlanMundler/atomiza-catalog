/**
 * Restaura el scroll del body solo cuando no queda ningún drawer ni modal
 * abierto. Compartido por Drawer y Modal (evita la lógica duplicada y que
 * uno pise al otro al cerrar).
 */
export function resetBodyOverflowIfClosed(): void {
  if (typeof document === 'undefined') return;
  if (!document.querySelector('.drawer--open') && !document.querySelector('dialog[open]')) {
    document.body.style.overflow = '';
  }
}
