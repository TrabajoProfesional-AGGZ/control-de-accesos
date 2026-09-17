import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { suscribirActualizacionDisponible, aplicarActualizacion } from '../../utils/pwaUpdate';
import './UpdateToast.css';

/**
 * Aviso de "hay una versión nueva" del service worker (vite-plugin-pwa, `registerType:
 * 'autoUpdate'`): antes solo logueaba en consola, así que una tablet que nunca se recarga
 * corría la versión vieja indefinidamente. Actualiza recién cuando el empleado lo pide
 * (no solo — podría cortar un escaneo en curso).
 */
export function UpdateToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => suscribirActualizacionDisponible(() => setVisible(true)), []);

  if (!visible) return null;

  return (
    <div className="update-toast" role="status">
      <RefreshCw size={18} className="update-toast-icono" aria-hidden="true" />
      <span className="update-toast-texto">Hay una versión nueva</span>
      <button type="button" className="update-toast-btn" onClick={aplicarActualizacion}>
        Actualizar
      </button>
    </div>
  );
}
