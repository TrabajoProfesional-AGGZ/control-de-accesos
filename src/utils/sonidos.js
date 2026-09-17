let ctx = null;
const listeners = new Set();

function notificarDisponibilidad() {
  const disponible = ctx !== null && ctx.state === 'running';
  listeners.forEach((cb) => cb(disponible));
}

/** Crear/reanudar el AudioContext. Llamar desde un handler de toque (Chrome lo exige). */
export function desbloquearAudio() {
  if (typeof window === 'undefined') return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx ??= new AC();
  if (ctx.state === 'suspended') {
    ctx.resume().then(notificarDisponibilidad).catch(() => {});
  } else {
    notificarDisponibilidad();
  }
}

/**
 * Se suscribe a si hay un AudioContext arrancado (`running`) — el control de silencio de
 * LectorAcceso solo se muestra si sonarResultado puede sonar. Llama al callback de entrada
 * con el estado actual y en cada cambio; devuelve la función para desuscribirse.
 */
export function suscribirAudioDisponible(callback) {
  listeners.add(callback);
  callback(ctx !== null && ctx.state === 'running');
  return () => listeners.delete(callback);
}

function tono(freq, inicio, dur, tipo = 'sine', gain = 0.12) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = tipo;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, inicio);
  g.gain.linearRampToValueAtTime(gain, inicio + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
  o.connect(g).connect(ctx.destination);
  o.start(inicio);
  o.stop(inicio + dur + 0.02);
}

/** Dos notas ascendentes (aprobado) o un zumbido grave (rechazado). */
export function sonarResultado(aprobado) {
  if (!ctx || ctx.state !== 'running') return;
  if (localStorage.getItem('sonido_escaneo') === 'off') return;
  const t = ctx.currentTime;
  if (aprobado) {
    tono(660, t, 0.07);
    tono(880, t + 0.08, 0.09);
  } else {
    tono(220, t, 0.18, 'square', 0.06);
  }
}
