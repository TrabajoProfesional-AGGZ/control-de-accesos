import { useState } from 'react';
import { Hash, IdCard, Mail, Lock, Eye, EyeOff, AlertCircle, LogOut } from 'lucide-react';
import { ModalOverlay } from '../../components/createForm/ModalOverlay';
import { useCambiarContrasenia } from '../../hooks/useCambiarContrasenia';
import { MAX_LEN, validarFortalezaPassword } from '../../utils/formValidators';
import './PerfilPage.css';

/** Iniciales de nombre y apellido para el avatar (ej. "Carlos Gomez" → "CG"). */
function iniciales(nombre, apellido) {
  return `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase();
}

/** Input de contraseña con botón para mostrar/ocultar el valor. */
function PasswordInput({ id, value, onChange, onBlur, autoComplete, required, error }) {
  const [mostrar, setMostrar] = useState(false);
  return (
    <div className="perfil-password-wrapper">
      <input
        id={id}
        type={mostrar ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        required={required}
        maxLength={MAX_LEN.PASSWORD}
        className={`csf-input${error ? ' csf-input--error' : ''}`}
      />
      <button
        type="button"
        className="perfil-toggle-password"
        onClick={() => setMostrar((v) => !v)}
        aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

/** Modal de cambio de contraseña, con validación de fortaleza en tiempo real. */
function CambiarContraseniaModal({ cerrarSesion, onClose }) {
  const {
    actual, setActual, nueva, setNueva, confirmar, setConfirmar, error, loading, handleSubmit,
  } = useCambiarContrasenia(cerrarSesion);

  const [nuevaTocada, setNuevaTocada] = useState(false);
  const nuevaError = nuevaTocada ? validarFortalezaPassword(nueva) : undefined;

  return (
    <ModalOverlay onClose={onClose}>
      <div className="csf-outer-card">
        <div className="csf-header">
          <h1>Cambiar contraseña</h1>
        </div>
        <div className="csf-card">
          <form onSubmit={handleSubmit}>
            <div className="csf-fields">
              <div className="csf-field">
                <label className="csf-label" htmlFor="perfil-actual">
                  <Lock size={13} strokeWidth={2} />
                  Contraseña actual
                </label>
                <PasswordInput
                  id="perfil-actual"
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="csf-field">
                <label className="csf-label" htmlFor="perfil-nueva">
                  <Lock size={13} strokeWidth={2} />
                  Nueva contraseña
                </label>
                <PasswordInput
                  id="perfil-nueva"
                  value={nueva}
                  onChange={(e) => setNueva(e.target.value)}
                  onBlur={() => setNuevaTocada(true)}
                  autoComplete="new-password"
                  required
                  error={!!nuevaError}
                />
                {nuevaError ? (
                  <span className="csf-error">
                    <AlertCircle size={14} /> {nuevaError}
                  </span>
                ) : (
                  <p className="csf-hint">Mínimo 10 caracteres, con mayúscula, minúscula y número.</p>
                )}
              </div>
              <div className="csf-field">
                <label className="csf-label" htmlFor="perfil-confirmar">
                  <Lock size={13} strokeWidth={2} />
                  Confirmar nueva contraseña
                </label>
                <PasswordInput
                  id="perfil-confirmar"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              {error && <p className="csf-form-error" role="alert">{error}</p>}
            </div>
            <div className="csf-nav csf-nav--between">
              <button type="button" className="csf-btn-back" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="csf-btn-submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalOverlay>
  );
}

/** Datos del empleado (legajo, DNI, mail) + cambiar contraseña + cerrar sesión. */
export function PerfilPage({ empleado, cerrarSesion }) {
  const [modalAbierto, setModalAbierto] = useState(false);

  const datos = [
    { icon: Hash, label: 'Legajo', valor: empleado.legajo },
    { icon: IdCard, label: 'DNI', valor: empleado.dni },
    { icon: Mail, label: 'Email', valor: empleado.mail },
  ].filter((dato) => dato.valor);

  return (
    <>
      <section className="perfil-card">
        <div className="perfil-card-top">
          <div className="perfil-avatar-wrapper">
            <span className="perfil-avatar" aria-hidden="true">
              {iniciales(empleado.nombre, empleado.apellido)}
            </span>
          </div>
          <div className="perfil-card-top-text">
            <h2 className="perfil-card-nombre">{empleado.nombre} {empleado.apellido}</h2>
          </div>
        </div>

        {datos.length > 0 && (
          <div className="perfil-datos-list">
            {datos.map(({ icon: Icon, label, valor }) => (
              <div className="perfil-dato-row" key={label}>
                <span className="perfil-dato-icon"><Icon size={18} /></span>
                <span className="perfil-dato-text">
                  <span className="perfil-dato-label">{label}</span>
                  <span className="perfil-dato-valor">{valor}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <button type="button" className="perfil-cambiar-button" onClick={() => setModalAbierto(true)}>
        Cambiar contraseña
      </button>

      <button type="button" className="perfil-cerrar-sesion" onClick={cerrarSesion}>
        <LogOut size={18} />
        Cerrar sesión
      </button>

      {modalAbierto && (
        <CambiarContraseniaModal cerrarSesion={cerrarSesion} onClose={() => setModalAbierto(false)} />
      )}
    </>
  );
}
