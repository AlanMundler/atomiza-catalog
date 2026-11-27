/**
 * Ancho/alto reales de cada avif, generados por `node scripts/image-dims.mjs`
 * y claveados por la ruta relativa sin base path ni barra inicial
 * (ej. `images/perfumes/9pm.avif`). Se usan en width/height de las <img>
 * para que el navegador reserve el espacio: sin CLS aunque las fotos de
 * originales tengan proporciones distintas entre sí.
 */
import imageDimsRaw from '@/data/image-dims.json';

export interface ImageDims {
  width: number;
  height: number;
}

export const FALLBACK_DIMS: ImageDims = { width: 400, height: 400 };

const imageDims = imageDimsRaw as Record<string, ImageDims>;

const normalize = (relSrc: string): string => relSrc.replace(/^\/+/, '');

export function dimsFor(relSrc?: string): ImageDims {
  if (!relSrc) return FALLBACK_DIMS;
  return imageDims[normalize(relSrc)] ?? FALLBACK_DIMS;
}

export function hasDims(relSrc?: string): boolean {
  if (!relSrc) return false;
  return normalize(relSrc) in imageDims;
}
