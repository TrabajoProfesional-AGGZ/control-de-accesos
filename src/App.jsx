// src/App.jsx
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LoginEmpleado } from './pages/LoginPage/LoginEmpleado';
import { ReclamarCuentaEmpleadoForm } from './pages/Registropage/ReclamarCuentaEmpleadoForm';
import { HomePage } from './pages/HomePage/HomePage';
import './control-theme.css';
import { useAuth } from './hooks/useAuth';

/**
 * Componente raíz: enruta entre login/reclamo de cuenta y el dashboard
 * según el estado de autenticación (sin react-router-dom, con `useState`).
 */
export default function App() {
  const [mostrarReclamo, setMostrarReclamo] = useState(false);
  const [vista, setVista] = useState('auth');

  const { empleado, cargandoAuth, cerrarSesion } = useAuth();

  const mostrarDashboard = vista === 'app' && Boolean(empleado);

  if (cargandoAuth) {
    return <div style={{ height: '100dvh', backgroundColor: '#111111' }} />;
  }

  if (!mostrarDashboard) {
    return (
      <AnimatePresence mode="wait">
        {mostrarReclamo ? (
          <ReclamarCuentaEmpleadoForm
            key="reclamo"
            onSuccess={() => { setMostrarReclamo(false); setVista('app'); }}
            onCancel={() => setMostrarReclamo(false)}
          />
        ) : (
          <LoginEmpleado
            key="login"
            irAReclamo={() => setMostrarReclamo(true)}
            onIngresoCompleto={() => setVista('app')}
          />
        )}
      </AnimatePresence>
    );
  }

  return (
    <HomePage
      empleado={empleado}
      cerrarSesion={cerrarSesion}
    />
  );
}
