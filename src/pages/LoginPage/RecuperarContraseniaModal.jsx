import { useState } from 'react';
import { ModalOverlay } from '../../components/createForm/ModalOverlay';
import { resetPassword } from '../../utils/authService';
import { obtenerMailPorLegajo } from '../../services/empleadosService';
import { MAX_LEN, validarCredencialSegura } from '../../utils/formValidators';
import logoSocio from '../../assets/logo_socio.png';

/** Modal para pedir el mail de recuperación de contraseña por email o legajo. */
export function RecuperarContraseniaModal({ onClose }) {
  const [identificador, setIdentificador] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const identificadorLimpio = identificador.trim();
    const errorIdentificador = validarCredencialSegura(identificadorLimpio, MAX_LEN.EMAIL);
    if (errorIdentificador) {
      setError(errorIdentificador);
      return;
    }

    setEnviando(true);
    try {
      const email = identificadorLimpio.includes('@')
        ? identificadorLimpio
        : await obtenerMailPorLegajo(identificadorLimpio);
      await resetPassword(email);
    } catch {
      // Mensaje final siempre igual (ver debajo) — no revela si el email/legajo existe.
    } finally {
      setEnviando(false);
      setEnviado(true);
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="csf-outer-card">
        <div className="csf-header">
          <div className="csf-success-logo-circle" style={{ margin: '0 auto 12px' }}>
            <img src={logoSocio} alt="SocioUnido" className="csf-success-logo" />
          </div>
          <h1>Recuperar contraseña</h1>
          {!enviado && <p>Ingresá tu email o legajo y te enviamos un mail para restablecerla.</p>}
        </div>

        <div className="csf-card">
          {enviado ? (
            <div className="csf-success">
              <p style={{ fontSize: '1.15rem' }}>
                Si el email o legajo ingresado tiene una cuenta, te enviamos un mail para
                restablecer tu contraseña. Si no lo encontrás, revisá la casilla de SPAM.
              </p>
              <div className="csf-nav csf-nav--end">
                <button type="button" className="csf-btn-submit" onClick={onClose}>
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={manejarSubmit}>
              <div className="csf-fields">
                <div className="csf-field">
                  <label className="csf-label" htmlFor="recuperar-identificador">Email o legajo</label>
                  <input
                    id="recuperar-identificador"
                    type="text"
                    className={`csf-input${error ? ' csf-input--error' : ''}`}
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    maxLength={MAX_LEN.EMAIL}
                    required
                    autoComplete="username"
                    autoCapitalize="none"
                  />
                  {error && <p className="csf-error">{error}</p>}
                </div>
              </div>

              <div className="csf-nav csf-nav--between">
                <button type="button" className="csf-btn-back" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="csf-btn-submit" disabled={enviando}>
                  {enviando ? 'Enviando...' : 'Recuperar contraseña'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}
