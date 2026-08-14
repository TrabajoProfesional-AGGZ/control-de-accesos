import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { login } from '../../utils/authService';
import { useAuth } from '../../hooks/useAuth';
import { obtenerMailPorLegajo } from '../../services/empleadosService';
import { MAX_LEN, validarCredencialSegura } from '../../utils/formValidators';
import { RecuperarContraseniaModal } from './RecuperarContraseniaModal';
import logoAlt from '../../assets/logo_socio_login.png';
import '../../control-theme.css';

const formContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.8 } },
  exiting: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
};

const formItemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  exiting: { y: -20, opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } },
};

export function LoginEmpleado({ irAReclamo, onIngresoCompleto = () => {} }) {
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false);

  const [animStarted, setAnimStarted] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const ingresoCompletoLlamado = useRef(false);

  const { empleado, authError, cerrarSesion } = useAuth();

  const exiting = Boolean(empleado) && !shouldReduceMotion;

  useEffect(() => {
    if (shouldReduceMotion) return;
    const timer = setTimeout(() => setAnimStarted(true), 400);
    return () => clearTimeout(timer);
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (empleado && shouldReduceMotion && !ingresoCompletoLlamado.current) {
      ingresoCompletoLlamado.current = true;
      onIngresoCompleto();
    }
  }, [empleado, shouldReduceMotion, onIngresoCompleto]);

  useEffect(() => {
    if (authError && cargando) {
      cerrarSesion().finally(() => {
        setError(authError);
        setCargando(false);
      });
    }
  }, [authError, cargando, cerrarSesion]);

  const manejarBandaCompleta = () => {
    if (exiting && !ingresoCompletoLlamado.current) {
      ingresoCompletoLlamado.current = true;
      onIngresoCompleto();
    }
  };

  const manejarLogin = async (e) => {
    e.preventDefault();
    setError('');

    const identificadorLimpio = identificador.trim();
    const passwordLimpia = password.trim();

    const errorIdentificador = validarCredencialSegura(identificadorLimpio, MAX_LEN.EMAIL);
    if (errorIdentificador) {
      setError(errorIdentificador);
      return;
    }
    const errorPassword = validarCredencialSegura(passwordLimpia, MAX_LEN.PASSWORD);
    if (errorPassword) {
      setError(errorPassword);
      return;
    }

    setCargando(true);
    try {
      const email = identificadorLimpio.includes('@')
        ? identificadorLimpio
        : await obtenerMailPorLegajo(identificadorLimpio);
      await login(email, passwordLimpia);
    } catch (err) {
      const codigosCredencialesInvalidas = [
        'auth/invalid-credential',
        'auth/user-not-found',
        'auth/wrong-password',
      ];
      if (err.message === 'empleado-no-encontrado' || codigosCredencialesInvalidas.includes(err.code)) {
        setError('Credenciales incorrectas');
      } else {
        setError(err.message || 'Ocurrió un error al iniciar sesión.');
      }
      setCargando(false);
    }
  };

  let exitAnimation;
  if (shouldReduceMotion) {
    exitAnimation = { opacity: 0 };
  } else if (exiting) {
    exitAnimation = { opacity: 1 };
  } else {
    exitAnimation = { x: '-40%', opacity: 0, filter: 'blur(10px)' };
  }

  let formAnimateState;
  if (exiting) {
    formAnimateState = 'exiting';
  } else if (animStarted || shouldReduceMotion) {
    formAnimateState = 'visible';
  } else {
    formAnimateState = 'hidden';
  }

  return (
    <motion.div
      className="login-container"
      exit={exitAnimation}
      transition={{ duration: 0.45, ease: 'easeIn' }}
    >
      {!shouldReduceMotion && (
        <motion.div
          className="login-band"
          initial={{ height: '100%' }}
          animate={
            exiting
              ? { height: '100%', backgroundColor: ['#039F5D', '#4A4A4A', '#F5F5F5'] }
              : { height: animStarted ? '30%' : '100%' }
          }
          transition={
            exiting
              ? {
                  height: { duration: 0.5, ease: [0.76, 0, 0.24, 1] },
                  backgroundColor: { duration: 1, delay: 0.4, times: [0, 0.5, 1] },
                }
              : { duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.4 }
          }
          onAnimationComplete={manejarBandaCompleta}
        >
          <motion.img
            src={logoAlt}
            alt="SocioUnido"
            className="login-band-logo"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </motion.div>
      )}

      <motion.div
        variants={formContainerVariants}
        initial="hidden"
        animate={formAnimateState}
        className="login-form-wrapper"
      >
        <motion.h2 variants={formItemVariants} className="login-slogan">
          Control de acceso del club, gestionado por <b>SocioUnido</b>
        </motion.h2>

        <motion.form onSubmit={manejarLogin} variants={formItemVariants}>
          <div className="input-group">
            <label className="input-label" htmlFor="identificador">Email o legajo</label>
            <input
              id="identificador"
              type="text"
              required
              maxLength={MAX_LEN.EMAIL}
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              className="su-input"
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Contraseña</label>
            <div className="login-password-wrapper">
              <input
                id="password"
                type={mostrarPassword ? 'text' : 'password'}
                required
                maxLength={MAX_LEN.PASSWORD}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="su-input"
              />
              <button
                type="button"
                className="login-toggle-password"
                onClick={() => setMostrarPassword((v) => !v)}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="login-forgot-wrapper">
            <button
              type="button"
              className="login-forgot-btn"
              onClick={() => setMostrarRecuperar(true)}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={cargando} className="su-button login-submit-btn">
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </motion.form>

        <motion.div variants={formItemVariants} className="login-registro-link">
          <button type="button" onClick={irAReclamo} className="login-link-btn">
            ¿Es tu primera vez? Configurar mi cuenta
          </button>
        </motion.div>

      </motion.div>

      {mostrarRecuperar && (
        <RecuperarContraseniaModal onClose={() => setMostrarRecuperar(false)} />
      )}
    </motion.div>
  );
}
