import { Home, ScanLine, SlidersHorizontal } from 'lucide-react';
import { LectorAcceso } from '../../components/LectorAcceso/LectorAcceso';
import './ControlAccesoPage.css';
import { useState, useEffect, useCallback } from 'react';
import { getEventosActivos } from '../../services/eventosService';

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

  const fetchEventos = useCallback(async () => {
    try {
      setCargandoEventos(true);
      setErrorEventos(false);
      const data = await getEventosActivos();
      // GET /api/v1/eventos ya excluye eventos vencidos, pero puede seguir trayendo eventos
      // futuros. Acá solo se puede elegir un evento del día de hoy (ni antes ni después).
      setEventos(data.filter((evento) => evento.dia === hoyISO()));
    } catch (error) {
      console.error("Error al cargar eventos:", error);
      setErrorEventos(true);
    } finally {
      setCargandoEventos(false);
    }
  }, []);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  return (
    <div className="control-acceso-page">
      <div className="control-acceso-banner">
        <div className="control-acceso-banner-texture" aria-hidden="true" />

        <div className="control-acceso-banner-titulo">
          <ScanLine size={22} className="control-acceso-banner-icono" aria-hidden="true" />
          <h1>Control de Acceso</h1>
        </div>
        <p className="control-acceso-banner-subtitulo">
          Escaneá el QR del socio para validar su ingreso
        </p>
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
            onClick={() => setEventoSeleccionado('')}
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
              onClick={() => setEventoSeleccionado(evento.id)}
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
            <button type="button" className="modo-operacion-reintentar" onClick={fetchEventos}>
              Reintentar
            </button>
          </p>
        )}
      </div>

      <LectorAcceso idEvento={eventoSeleccionado} />

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
