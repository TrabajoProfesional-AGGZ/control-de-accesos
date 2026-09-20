import { fetchTo, fetchWithOutAuth } from '../utils/utils';
import { idDeClubActual } from './clubService';

/**
 * Valida legajo + mail + DNI contra el registro pre-cargado del empleado (sin sesión Firebase todavía).
 * Devuelve `{ ok, token }`: `token` es de un solo uso y hay que pasárselo después a
 * `reclamarCuentaEmpleado` (issue #249/A-01).
 *
 * El club va **en el path**: es una ruta pre-login, así que no hay token del que el gateway pueda
 * propagar el claim `club_id`. Es spoofeable por diseño —cualquiera puede probar con otro club— y
 * la mitigación es el rate limit por IP del gateway; el aislamiento no se relaja, porque del otro
 * lado el engine se resuelve igual contra el catálogo de clubes.
 * @throws {Error} 'empleado-no-encontrado' | 'cuenta-ya-registrada' | 'demasiados-intentos' | 'club-desconocido' | 'servicio-no-disponible'
 */
export async function validarEmpleado(legajo, mail, dni) {
  const clubId = await idDeClubActual();
  const res = await fetchWithOutAuth(`/api/v1/clubes/${encodeURIComponent(clubId)}/empleados/validar`, 'POST', { legajo, mail, dni });
  if (res.status === 404) throw new Error('empleado-no-encontrado');
  if (res.status === 409) throw new Error('cuenta-ya-registrada');
  if (res.status === 429) throw new Error('demasiados-intentos');
  if (!res.ok) throw new Error('Error al validar el empleado');
  return res.json();
}

/**
 * Marca la cuenta del empleado como reclamada, tras crear el usuario en Firebase. `token` es el
 * que devolvió `validarEmpleado`: ata el reclamo a esa validación puntual. Se manda siempre que
 * exista; el backend todavía lo acepta ausente mientras dure el rollout.
 * @throws {Error} 'cuenta-ya-registrada' | 'empleado-no-encontrado' | 'validacion-vencida'
 */
export async function reclamarCuentaEmpleado(legajo, token) {
  const cuerpo = token ? { token } : null;
  const res = await fetchTo(`/api/v1/empleados/por-legajo/${encodeURIComponent(legajo)}/reclamar`, 'POST', cuerpo);
  if (res.status === 409) throw new Error('cuenta-ya-registrada');
  if (res.status === 404) throw new Error('empleado-no-encontrado');
  if (res.status === 403) throw new Error('validacion-vencida');
  if (!res.ok) throw new Error('Error al reclamar la cuenta del empleado');
  return res.json();
}

/**
 * Resuelve legajo → mail (endpoint público, sin JWT) para poder loguear con Firebase.
 * Lleva el club en el path por el mismo motivo que `validarEmpleado`: corre antes del login.
 * @throws {Error} 'empleado-no-encontrado' | 'club-desconocido' | 'servicio-no-disponible'
 */
export async function obtenerMailPorLegajo(legajo) {
  const clubId = await idDeClubActual();
  const res = await fetchWithOutAuth(
    `/api/v1/clubes/${encodeURIComponent(clubId)}/empleados/mail-por-legajo/${encodeURIComponent(legajo)}`,
    'GET',
  );
  if (res.status === 404) throw new Error('empleado-no-encontrado');
  if (!res.ok) throw new Error('Error al buscar el empleado');
  const { mail } = await res.json();
  return mail;
}
