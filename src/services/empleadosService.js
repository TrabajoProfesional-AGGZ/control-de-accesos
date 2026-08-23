import { fetchTo, fetchWithOutAuth } from '../utils/utils';

/**
 * Valida legajo + mail + DNI contra el registro pre-cargado del empleado (sin sesión Firebase todavía).
 * @throws {Error} 'empleado-no-encontrado' | 'cuenta-ya-registrada'
 */
export async function validarEmpleado(legajo, mail, dni) {
  const res = await fetchWithOutAuth('/api/v1/empleados/validar', 'POST', { legajo, mail, dni });
  if (res.status === 404) throw new Error('empleado-no-encontrado');
  if (res.status === 409) throw new Error('cuenta-ya-registrada');
  if (!res.ok) throw new Error('Error al validar el empleado');
  return res.json();
}

/**
 * Marca la cuenta del empleado como reclamada, tras crear el usuario en Firebase.
 * @throws {Error} 'cuenta-ya-registrada' | 'empleado-no-encontrado'
 */
export async function reclamarCuentaEmpleado(legajo) {
  const res = await fetchTo(`/api/v1/empleados/por-legajo/${encodeURIComponent(legajo)}/reclamar`, 'POST');
  if (res.status === 409) throw new Error('cuenta-ya-registrada');
  if (res.status === 404) throw new Error('empleado-no-encontrado');
  if (!res.ok) throw new Error('Error al reclamar la cuenta del empleado');
  return res.json();
}

/**
 * Resuelve legajo → mail (endpoint público, sin JWT) para poder loguear con Firebase.
 * @throws {Error} 'empleado-no-encontrado'
 */
export async function obtenerMailPorLegajo(legajo) {
  const res = await fetchWithOutAuth(`/api/v1/empleados/mail-por-legajo/${encodeURIComponent(legajo)}`, 'GET');
  if (res.status === 404) throw new Error('empleado-no-encontrado');
  if (!res.ok) throw new Error('Error al buscar el empleado');
  const { mail } = await res.json();
  return mail;
}
