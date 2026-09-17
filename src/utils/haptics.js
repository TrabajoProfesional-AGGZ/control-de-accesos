/** Háptico: se ignora en iOS (sin API) y en Chrome sin activación previa. */
export function vibrar(patron) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(patron);
    } catch {
      // no-op
    }
  }
}
