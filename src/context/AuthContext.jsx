import { useState, useEffect, useMemo, useCallback } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { fetchTo } from '../utils/utils';
import { AuthContext } from './authContextObject';

/**
 * Escucha el estado de sesión de Firebase y, si hay usuario logueado,
 * completa el perfil del empleado pidiéndolo a `ms-club` por email.
 */
export function AuthProvider({ children }) {
  const [empleado, setEmpleado] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const cargarEmpleado = useCallback(async (firebaseUser) => {
    try {
      await firebaseUser.getIdToken();
      const res = await fetchTo(`/api/v1/empleados/por-email/${encodeURIComponent(firebaseUser.email)}`, 'GET');

      if (res.ok) {
        const data = await res.json();
        setEmpleado(data);
        setAuthError(null);
      } else {
        setEmpleado(null);
        setAuthError('Servicio no disponible');
      }
    } catch (error) {
      console.error('Error al recuperar el perfil del empleado:', error);
      setEmpleado(null);
      setAuthError('No pudimos cargar tu perfil. Probá de nuevo en unos segundos.');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await cargarEmpleado(firebaseUser);
      } else {
        setEmpleado(null);
        setAuthError(null);
      }
      setCargandoAuth(false);
    });

    return () => unsubscribe();
  }, [cargarEmpleado]);

  const recargarEmpleado = useCallback(
    () => (auth.currentUser ? cargarEmpleado(auth.currentUser) : Promise.resolve()),
    [cargarEmpleado]
  );

  const cerrarSesion = useCallback(async () => {
    await signOut(auth);
    setEmpleado(null);
  }, []);

  const value = useMemo(
    () => ({ empleado, setEmpleado, cargandoAuth, authError, cerrarSesion, recargarEmpleado }),
    [empleado, cargandoAuth, authError, cerrarSesion, recargarEmpleado]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
