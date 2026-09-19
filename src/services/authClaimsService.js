import { fetchTo } from '../utils/utils';
import { idDeClubActual } from './clubService';

/**
 * Setea el claim `tipo:"acceso"` sobre la cuenta identificada por idToken
 * (self-service — ms-auth verifica el token y actúa sobre esa misma cuenta).
 * Idempotente si ya tiene el mismo tipo asignado.
 *
 * El club va en el path: este es el momento en que el token **todavía no** tiene el claim
 * `club_id`, así que el gateway no tiene nada que propagar. Del otro lado, si el claim ya
 * estuviera, le gana al path.
 * @throws {Error} 'club-desconocido' | 'servicio-no-disponible'
 */
export async function asignarTipoClaim(idToken, tipo) {
  const clubId = await idDeClubActual();
  const res = await fetchTo(
    `/api/v1/auth/clubes/${encodeURIComponent(clubId)}/claims/tipo`,
    'POST',
    { id_token: idToken, tipo },
  );
  if (!res.ok) throw new Error('Error al asignar el tipo de cuenta');
  return res.json();
}
