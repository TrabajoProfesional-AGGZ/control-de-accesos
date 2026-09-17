import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle2, XCircle, CameraOff } from 'lucide-react';
import { fetchTo } from '../../utils/utils';
import { vibrar } from '../../utils/haptics';
import './LectorAcceso.css';

const ESTADO_INICIAL = { tipo: null, mensaje: '', nombre: null, estadoFinanciero: null };

/**
 * Lector de QR de acceso: arranca la cámara al montar, valida cada escaneo
 * contra `ms-acceso` y muestra el resultado superpuesto sobre la cámara.
 * @param {string} idEvento - id del evento a validar contra la entrada del socio (vacío = ingreso normal al club).
 * @param {string} nombreEvento - nombre del evento seleccionado ('' = ingreso normal al club).
 */
export const LectorAcceso = ({ idEvento, nombreEvento = '' }) => {
  const [resultado, setResultado] = useState(ESTADO_INICIAL);
  const [validando, setValidando] = useState(false);
  const [errorCamara, setErrorCamara] = useState(false);
  const [leido, setLeido] = useState(false);

  const scannerRef = useRef(null);
  const validandoRef = useRef(false);
  const idEventoRef = useRef(idEvento);
  const leidoTimeoutRef = useRef(null);

  useEffect(() => {
    idEventoRef.current = idEvento;
  }, [idEvento]);

  useEffect(() => {
    // html5-qrcode no awaitea su video.play() interno: si el video se desmonta con esa promesa
    // pendiente (doble montaje de StrictMode en dev), Chrome la rechaza con un AbortError que
    // no se puede capturar desde afuera. Se ignora puntualmente ese caso para no ensuciar la consola.
    function ignorarAbortDePlayInterrumpido(event) {
      if (
        event.reason instanceof DOMException &&
        event.reason.name === 'AbortError' &&
        event.reason.message.includes('play() request was interrupted')
      ) {
        event.preventDefault();
      }
    }
    window.addEventListener('unhandledrejection', ignorarAbortDePlayInterrumpido);

    let cancelado = false;
    const qrCode = new Html5Qrcode('qr-reader');
    scannerRef.current = qrCode;

    function detener() {
      try {
        qrCode.stop().then(() => qrCode.clear()).catch(() => {});
      } catch {
        // el escáner nunca llegó a estado "scanning" (permiso pendiente/denegado) — nada que detener
      }
    }

    qrCode
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        onScanFailure
      )
      .then(() => {
        // en StrictMode (dev) el efecto se monta, limpia y vuelve a montar antes de que
        // .start() resuelva — si ya nos limpiaron para cuando llega acá, hay que frenar
        // la cámara igual (si no, queda un stream de video huérfano).
        if (cancelado) detener();
      })
      .catch(() => {
        if (!cancelado) setErrorCamara(true);
      });

    async function onScanSuccess(decodedText) {
      if (validandoRef.current) return;
      validandoRef.current = true;
      vibrar(15);
      setLeido(true);
      leidoTimeoutRef.current = setTimeout(() => setLeido(false), 150);
      try {
        qrCode.pause();
      } catch {
        // el escáner puede no estar corriendo todavía si el usuario escanea muy rápido
      }
      setValidando(true);

      try {
        const payload = {qr_data: decodedText};
        if (idEventoRef.current !== "") {
          payload.id_evento = idEventoRef.current;
        }
        
        const res = await fetchTo('/api/v1/accesos/validar', 'POST', payload);
        const data = await res.json();

        if (res.ok) {
          vibrar(40);
          setResultado({
            tipo: 'exito',
            mensaje: 'Acceso permitido',
            nombre: data.nombre,
            estadoFinanciero: data.estado_financiero,
          });
        } else {
          const detalle = data.detail;
          const esDetalleEstructurado = detalle && typeof detalle === 'object';
          vibrar([40, 60, 40, 60, 40]);
          setResultado({
            tipo: 'error',
            mensaje: esDetalleEstructurado
              ? detalle.mensaje
              : (detalle || 'QR inválido o expirado.'),
            nombre: esDetalleEstructurado ? detalle.nombre : null,
            estadoFinanciero: esDetalleEstructurado ? detalle.estado_financiero : null,
          });
        }
      } catch {
        vibrar([40, 60, 40, 60, 40]);
        setResultado({
          tipo: 'error',
          mensaje: 'Error procesando el código.',
          nombre: null,
          estadoFinanciero: null,
        });
      } finally {
        setValidando(false);
      }
    }

    function onScanFailure() {
      // html5-qrcode llama esto en cada frame sin QR detectado: no es un error a mostrar.
    }

    return () => {
      cancelado = true;
      detener();
      clearTimeout(leidoTimeoutRef.current);
      window.removeEventListener('unhandledrejection', ignorarAbortDePlayInterrumpido);
    };
  }, []);

  const cerrarResultado = () => {
    setResultado(ESTADO_INICIAL);
    validandoRef.current = false;
    try {
      scannerRef.current?.resume();
    } catch {
      // no-op si el escáner no llegó a iniciar
    }
  };

  const eyebrow = nombreEvento ? `Entrada · ${nombreEvento}` : 'Ingreso al club';

  return (
    <div className="lector-container">
      <div className="lector-camara-wrapper">
        <div id="qr-reader" className={`lector-camara${leido ? ' lector-camara--leido' : ''}`} />

        <span
          className={`lector-modo${nombreEvento ? ' lector-modo--evento' : ''}`}
          aria-live="polite"
        >
          {nombreEvento ? `Entrada · ${nombreEvento}` : 'Ingreso normal'}
        </span>

        {errorCamara && (
          <div className="lector-overlay lector-overlay--error" role="alert">
            <CameraOff size={48} className="lector-overlay-icono" />
            <h3 className="lector-overlay-mensaje">No se pudo acceder a la cámara</h3>
            <p className="lector-overlay-nombre">Revisá los permisos de cámara del navegador.</p>
          </div>
        )}

        {validando && (
          <div className="lector-overlay lector-overlay--validando" aria-live="polite">
            <p>Validando credencial...</p>
          </div>
        )}

        {resultado.tipo && (
          <div
            className={`lector-overlay lector-resultado lector-resultado--${resultado.tipo}`}
            role="alert"
            onClick={cerrarResultado}
          >
            <p className="lector-resultado-eyebrow">{eyebrow}</p>
            {resultado.tipo === 'exito' ? (
              <CheckCircle2 size={64} className="lector-resultado-icono" aria-hidden="true" />
            ) : (
              <XCircle size={64} className="lector-resultado-icono" aria-hidden="true" />
            )}
            <p className="lector-resultado-veredicto">
              {resultado.tipo === 'exito' ? 'Permitido' : 'Rechazado'}
            </p>
            {resultado.nombre && (
              <h3 className="lector-resultado-nombre">{resultado.nombre}</h3>
            )}
            {resultado.tipo === 'error' && (
              <p className="lector-resultado-mensaje">{resultado.mensaje}</p>
            )}
            {resultado.tipo === 'error' && resultado.estadoFinanciero && (
              <p className="lector-resultado-estado-financiero">
                Estado financiero: {resultado.estadoFinanciero}
              </p>
            )}
            <button
              type="button"
              className="lector-resultado-ok"
              onClick={(e) => {
                e.stopPropagation();
                cerrarResultado();
              }}
              autoFocus
            >
              Ok
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
