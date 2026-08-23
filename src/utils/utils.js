import { auth } from '../firebase';

const API_URL = import.meta.env.VITE_APP_API_BASE_URL;
const FETCH_TIMEOUT_MS = 15000;

/** Arma la URL completa; rechaza rutas absolutas/externas para no salir de `API_URL`. */
function buildUrl(path) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
    throw new Error('Ruta de API inválida');
  }
  return `${API_URL}${path}`;
}

/** Wrapper de `fetch` con abort automático a los `FETCH_TIMEOUT_MS`. */
async function fetchConTimeout(url, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('La solicitud tardó demasiado. Intentá de nuevo.');
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** POST/GET/etc. autenticado con el JWT de Firebase; sin sesión, omite el header Authorization. */
export async function fetchTo(path, method, body = null) {
  const token = await auth.currentUser?.getIdToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetchConTimeout(buildUrl(path), {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
}

/** Igual que `fetchTo` pero sin JWT, para endpoints públicos previos al login. */
export async function fetchWithOutAuth(path, method, body = null) {
  return fetchConTimeout(buildUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : null,
  });
}
