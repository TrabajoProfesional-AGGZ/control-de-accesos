import { useEffect, useRef } from 'react';

/**
 * Mantiene la pantalla encendida mientras el componente está montado.
 * El sistema libera el lock al ocultar la página; se vuelve a pedir al
 * volver a `visible`. Si la API no existe (iOS < 16.4) o el sistema lo
 * rechaza (ahorro de energía), no hace nada: nunca bloquea el flujo.
 */
export function useWakeLock(activo = true) {
  const lockRef = useRef(null);

  useEffect(() => {
    if (!activo || typeof navigator === 'undefined' || !navigator.wakeLock) return undefined;
    let cancelado = false;

    async function pedir() {
      if (cancelado || document.visibilityState !== 'visible') return;
      try {
        lockRef.current = await navigator.wakeLock.request('screen');
        lockRef.current.addEventListener('release', () => {
          lockRef.current = null;
        });
      } catch {
        lockRef.current = null; // NotAllowedError: ahorro de energía, pestaña oculta, etc.
      }
    }
    function alCambiarVisibilidad() {
      if (document.visibilityState === 'visible' && !lockRef.current) pedir();
    }

    pedir();
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    return () => {
      cancelado = true;
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, [activo]);
}
