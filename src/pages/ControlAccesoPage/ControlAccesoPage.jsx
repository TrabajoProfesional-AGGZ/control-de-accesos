import { Home, ScanLine, SlidersHorizontal } from 'lucide-react';
import { LectorAcceso } from '../../components/LectorAcceso/LectorAcceso';
import './ControlAccesoPage.css';
import { useState, useEffect } from 'react';
import { getEventosActivos } from '../../services/eventosService';

function hoyISO() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function ControlAccesoPage({ onVolver }) {
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState("");
  const [cargandoEventos, setCargandoEventos] = useState(true);
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setCargandoEventos(true);
        const data = await getEventosActivos();
        // GET /api/v1/eventos ya excluye eventos vencidos (ver microservicio-club/CLAUDE.md,
        // feature LOGICA DE ENTRADAS PARA EVENTOS PASADOS), pero puede seguir trayendo eventos
        // futuros. Acá solo se puede elegir un evento del día de hoy (ni antes ni después).
        setEventos(data.filter((evento) => evento.dia === hoyISO()));
      } catch (error) {
        console.error("Error al cargar eventos:", error);
      } finally {
        setCargandoEventos(false);
      }
    };

    fetchEventos();
  }, []);

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
        <label htmlFor="select-evento" className="modo-operacion-label">
          <SlidersHorizontal size={15} className="modo-operacion-label-icono" aria-hidden="true" />
          Modo de Operación:
        </label>
        <div className="modo-operacion-select-wrapper">
          <select
            id="select-evento"
            className="modo-operacion-select"
            value={eventoSeleccionado}
            onChange={(e) => setEventoSeleccionado(e.target.value)}
            disabled={cargandoEventos}
          >
            <option value="">Ingreso normal al club</option>
            {eventos.map((evento) => (
              <option key={evento.id} value={evento.id}>
                Validar entrada: {evento.nombre}
              </option>
            ))}
          </select>
        </div>
        {cargandoEventos && <span className="modo-operacion-loading">Cargando eventos...</span>}
      </div>

      <LectorAcceso idEvento={eventoSeleccionado} />

      <button
        onClick={onVolver}
        className="control-acceso-home-btn"
        aria-label="Ir a la página principal"
      >
        <Home size={20} />
        Ir al inicio
      </button>
    </div>
  );
}
