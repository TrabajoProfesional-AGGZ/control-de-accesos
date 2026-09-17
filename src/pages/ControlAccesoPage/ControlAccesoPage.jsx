import { Home, ScanLine, SlidersHorizontal } from 'lucide-react';
import { LectorAcceso } from '../../components/LectorAcceso/LectorAcceso';
import './ControlAccesoPage.css';
import { useState, useEffect, useCallback } from 'react';
import { getEventosActivos } from '../../services/eventosService';
import { vibrar } from '../../utils/haptics';

/** Fecha de hoy en formato `YYYY-MM-DD`, para filtrar eventos del día. */
function hoyISO() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Página de escaneo: selector de modo (ingreso normal o validar entrada a un evento de hoy) + lector QR. */
export function ControlAccesoPage({ onVolver }) {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState("");
  const [cargandoEventos, setCargandoEventos] = useState(true);
  const [errorEventos, setErrorEventos] = useState(false);

  // silencioso=true: refetch en segundo plano (visibilitychange / intervalo). No toca el
  // skeleton ni el aviso de error de W2 — un aviso cada 5 min por una red intermitente
  // sería ruido en un puesto de entrada; se mantiene la lista anterior si falla.
  const fetchEventos = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) {
        setCargandoEventos(true);
        setErrorEventos(false);
      }
      const data = await getEventosActivos();
      // GET /api/v1/eventos ya excluye eventos vencidos, pero puede seguir trayendo eventos
      // futuros. Acá solo se puede elegir un evento del día de hoy (ni antes ni después).
      const deHoy = data.filter((evento) => evento.dia === hoyISO());
      setEventos(deHoy);
      setEventoSeleccionado((actual) => {
        if (actual && !deHoy.some((evento) => evento.id === actual)) {
          // el evento elegido terminó/se borró/cambió de día: el modo cambió sin que el
          // empleado lo pidiera, tiene que notarlo (el badge de LectorAcceso lo muestra).
          vibrar(15);
          return '';
        }
        return actual;
      });
    } catch (error) {
      console.error("Error al cargar eventos:", error);
      if (!silencioso) setErrorEventos(true);
    } finally {
      if (!silencioso) setCargandoEventos(false);
    }
  }, []);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  // Refresco en segundo plano: una tablet fija en el puesto queda horas en esta vista.
  useEffect(() => {
    function alVolverVisible() {
      if (document.visibilityState === 'visible') fetchEventos(true);
    }
    document.addEventListener('visibilitychange', alVolverVisible);
    const intervalo = setInterval(() => fetchEventos(true), 5 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', alVolverVisible);
      clearInterval(intervalo);
    };
  }, [fetchEventos]);

  const nombreEvento = eventos.find((e) => e.id === eventoSeleccionado)?.nombre ?? '';

  return (
    <div className="control-acceso-page">
      <div className="control-acceso-banner banner-oscuro">
        <div className="banner-oscuro-textura" aria-hidden="true" />

        <div className="control-acceso-banner-titulo">
          <ScanLine size={22} className="control-acceso-banner-icono" aria-hidden="true" />
          <h1>Control de Acceso</h1>
        </div>
      </div>

      <div className={`modo-operacion${eventoSeleccionado ? ' modo-operacion--evento' : ''}`}>
        <span className="modo-operacion-label">
          <SlidersHorizontal size={15} className="modo-operacion-label-icono" aria-hidden="true" />
          Modo de Operación:
        </span>
        <div className="modo-operacion-chips" role="radiogroup" aria-label="Modo de Operación">
          <button
            type="button"
            role="radio"
            aria-checked={eventoSeleccionado === ''}
            onClick={() => {
              vibrar(15);
              setEventoSeleccionado('');
            }}
            className={`modo-operacion-chip${eventoSeleccionado === '' ? ' modo-operacion-chip--selected' : ''}`}
          >
            Ingreso normal al club
          </button>
          {eventos.map((evento) => (
            <button
              key={evento.id}
              type="button"
              role="radio"
              aria-checked={eventoSeleccionado === evento.id}
              onClick={() => {
                vibrar(15);
                setEventoSeleccionado(evento.id);
              }}
              className={`modo-operacion-chip${eventoSeleccionado === evento.id ? ' modo-operacion-chip--selected' : ''}`}
            >
              Validar entrada: {evento.nombre}
            </button>
          ))}
          {cargandoEventos && (
            <span className="modo-operacion-chip modo-operacion-chip--skeleton" aria-hidden="true" />
          )}
        </div>
        {errorEventos && !cargandoEventos && (
          <p className="modo-operacion-error" role="alert">
            No se pudieron cargar los eventos de hoy.{' '}
            <button type="button" className="modo-operacion-reintentar" onClick={() => fetchEventos()}>
              Reintentar
            </button>
          </p>
        )}
      </div>

      <LectorAcceso idEvento={eventoSeleccionado} nombreEvento={nombreEvento} />

      <button
        onClick={onVolver}
        className="control-acceso-home-btn"
      >
        <Home size={20} />
        Ir al inicio
      </button>
    </div>
  );
}
