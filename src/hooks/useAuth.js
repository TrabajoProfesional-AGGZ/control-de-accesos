import { useContext } from 'react';
import { AuthContext } from '../context/authContextObject';

/** Acceso al `AuthContext` (empleado logueado, estado de carga, cerrar sesión). */
export function useAuth() {
  return useContext(AuthContext);
}
