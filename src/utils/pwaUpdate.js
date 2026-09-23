import { registerSW } from 'virtual:pwa-register';
import { logger } from './logger';

let listener = null;

/** Suscribe a "hay una versión nueva del service worker"; devuelve función de limpieza. */
export function suscribirActualizacionDisponible(callback) {
  listener = callback;
  return () => {
    if (listener === callback) listener = null;
  };
}

// Registro único a nivel de módulo (no dentro de un componente): en dev, StrictMode
// remonta los efectos y volvería a registrar el service worker innecesariamente.
const actualizarSW = registerSW({
  onNeedRefresh() {
    listener?.();
  },
  onOfflineReady() {
    logger.log('La app ya está lista para usarse sin conexión.');
  },
});

/** Descarta el service worker en espera y recarga con la versión nueva. */
export function aplicarActualizacion() {
  actualizarSW(true);
}
