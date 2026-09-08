import { fetchTo } from '../utils/utils';

/**
 * Setea el claim `tipo:"empleado"` sobre la cuenta identificada por idToken
 * (self-service — ms-auth verifica el token y actúa sobre esa misma cuenta).
 * Idempotente si ya tiene el mismo tipo asignado.
 */
export async function asignarTipoClaim(idToken, tipo) {
  const res = await fetchTo('/api/v1/auth/claims/tipo', 'POST', { id_token: idToken, tipo });
  if (!res.ok) throw new Error('Error al asignar el tipo de cuenta');
  return res.json();
}
