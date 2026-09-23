import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { createUserWithEmailAndPassword, deleteUser, getIdToken } from 'firebase/auth';
import { auth } from '../../firebase';
import { validarEmpleado, reclamarCuentaEmpleado } from '../../services/empleadosService';
import { asignarTipoClaim } from '../../services/authClaimsService';
import { useAuth } from '../../hooks/useAuth';
import { MAX_LEN, validarCredencialSegura, validarFortalezaPassword } from '../../utils/formValidators';
import { logger } from '../../utils/logger';
import logoSocio from '../../assets/logo_socio.png';
import '../../control-theme.css';
import '../../components/createForm/ModalOverlay.css';
import './ReclamarCuentaEmpleadoForm.css';

/** Campo de contraseña con label y botón para mostrar/ocultar el valor. */
function PasswordField({ id, label, value, onChange, autoComplete, error }) {
  const [mostrar, setMostrar] = useState(false);
  return (
    <div className="csf-field">
      <label className="csf-label" htmlFor={id}>{label}</label>
      <div className="login-password-wrapper">
        <input
          id={id}
          type={mostrar ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          maxLength={MAX_LEN.PASSWORD}
          className={`csf-input${error ? ' csf-input--error' : ''}`}
        />
        <button
          type="button"
          className="login-toggle-password hit-area"
          onClick={() => setMostrar((v) => !v)}
          aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {mostrar ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="csf-error">{error}</p>}
    </div>
  );
}

/** Reclamo de cuenta (legajo + DNI + mail + contraseña) en un solo paso, con Saga de rollback en Firebase. */
export function ReclamarCuentaEmpleadoForm({ onSuccess, onCancel }) {
  const { recargarEmpleado } = useAuth();
  const [legajo, setLegajo] = useState('');
  const [mail, setMail] = useState('');
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);

  // Evita setState tras desmontar (el onSuccess de más abajo dispara un setTimeout).
  const montadoRef = useRef(true);
  const timeoutRef = useRef(null);
  useEffect(() => () => {
    montadoRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const legajoLimpio = legajo.trim();
    const mailLimpio = mail.trim();
    const dniLimpio = dni.trim();

    if (!legajoLimpio || !mailLimpio || !dniLimpio) {
      setError('Completá todos los campos.');
      return;
    }
    const errorMail = validarCredencialSegura(mailLimpio, MAX_LEN.EMAIL);
    if (errorMail) {
      setError(errorMail);
      return;
    }
    const errorPassword = validarFortalezaPassword(password);
    if (errorPassword) {
      setError(errorPassword);
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    let usuarioCreado = null;
    try {
      // El token de un solo uso ata el reclamo de abajo a *esta* validación (issue #249/A-01).
      const { token } = await validarEmpleado(legajoLimpio, mailLimpio, dniLimpio);

      const userCredential = await createUserWithEmailAndPassword(auth, mailLimpio, password);
      usuarioCreado = userCredential.user;

      // El claim va antes del reclamo: si falla, el catch hace rollback (deleteUser)
      // sin fila reclamada en la base. Después se refresca el token cacheado para
      // que las llamadas siguientes (incluida la de recargarEmpleado) ya lo lleven.
      const tokenPrevioAlClaim = await getIdToken(usuarioCreado);
      await asignarTipoClaim(tokenPrevioAlClaim, 'acceso');
      await getIdToken(usuarioCreado, true);

      await reclamarCuentaEmpleado(legajoLimpio, token);
      await recargarEmpleado();

      setExito(true);
      timeoutRef.current = setTimeout(() => {
        if (montadoRef.current) onSuccess();
      }, 3000);
    } catch (err) {
      // Saga: si el usuario de Firebase se llegó a crear pero el reclamo en el
      // backend falla, se deshace el alta en Firebase para no dejar cuentas huérfanas.
      if (usuarioCreado) {
        try {
          await deleteUser(usuarioCreado);
        } catch (rollbackErr) {
          logger.error('Error crítico al intentar hacer rollback:', rollbackErr);
        }
      }
      if (err.message === 'cuenta-ya-registrada') {
        setError('Este empleado ya tiene una cuenta registrada. Iniciá sesión en su lugar.');
      } else if (err.message === 'empleado-no-encontrado') {
        setError('No pudimos validar tu identidad. Revisá los datos ingresados.');
      } else if (err.message === 'demasiados-intentos') {
        setError('Demasiados intentos de validación. Esperá unos minutos antes de volver a probar.');
      } else if (err.message === 'validacion-vencida') {
        setError('La validación expiró. Volvé a empezar el registro.');
      } else if (err.message === 'club-desconocido') {
        setError('No pudimos identificar el club de este sitio. Avisale al administrador.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('El email ya está en uso. Por favor, iniciá sesión.');
      } else {
        setError('Error al procesar el registro. Verificá tu conexión e intentá de nuevo.');
      }
    } finally {
      if (montadoRef.current) setCargando(false);
    }
  };

  return (
    <motion.div
      className="login-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="csf-outer-card reclamo-card">
        <div className="csf-header">
          <div className="csf-success-logo-circle" style={{ margin: '0 auto 12px' }}>
            <img src={logoSocio} alt="SocioUnido" className="csf-success-logo" />
          </div>
          <h1>Configurar mi cuenta</h1>
          {!exito && <p>Validá tu identidad de empleado y elegí una contraseña.</p>}
        </div>

        <div className="csf-card">
          {exito ? (
            <div className="csf-success">
              <h2>¡Cuenta configurada!</h2>
              <p>Ya podés empezar a usar la aplicación.</p>
              <button type="button" className="csf-btn-submit" onClick={onSuccess}>
                Empezar
              </button>
            </div>
          ) : (
            <form onSubmit={manejarSubmit}>
              <div className="csf-fields">
                <div className="csf-field">
                  <label className="csf-label" htmlFor="reclamo-legajo">Legajo</label>
                  <input
                    id="reclamo-legajo"
                    type="text"
                    className="csf-input"
                    value={legajo}
                    onChange={(e) => setLegajo(e.target.value)}
                    maxLength={MAX_LEN.LEGAJO}
                    required
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </div>
                <div className="csf-field">
                  <label className="csf-label" htmlFor="reclamo-dni">DNI</label>
                  <input
                    id="reclamo-dni"
                    type="text"
                    className="csf-input"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    maxLength={MAX_LEN.DNI}
                    required
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </div>
                <div className="csf-field">
                  <label className="csf-label" htmlFor="reclamo-mail">Email</label>
                  <input
                    id="reclamo-mail"
                    type="email"
                    className="csf-input"
                    value={mail}
                    onChange={(e) => setMail(e.target.value)}
                    maxLength={MAX_LEN.EMAIL}
                    required
                    autoComplete="email"
                    autoCapitalize="none"
                  />
                </div>
                <PasswordField
                  id="reclamo-password"
                  label="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <PasswordField
                  id="reclamo-confirmar"
                  label="Confirmar contraseña"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  autoComplete="new-password"
                />
                {error && <p className="csf-form-error" role="alert">{error}</p>}
              </div>

              <div className="csf-nav csf-nav--between">
                <button type="button" className="csf-btn-back" onClick={onCancel}>
                  Cancelar
                </button>
                <button type="submit" className="csf-btn-submit" disabled={cargando}>
                  {cargando ? 'Procesando...' : 'Completar registro'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}
