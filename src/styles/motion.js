/**
 * Tokens de movimiento para framer-motion. Espejo de --ease-* en tokens.css.
 * `default`/`quick` para todo lo que no viene de un gesto. `momentum` solo tras
 * un arrastre con velocidad (no hay ninguno en control-de-acceso; queda por paridad).
 * `celebrate` es la única excepción con rebote sin gesto (check de éxito).
 */
export const SPRING = {
  default:   { type: 'spring', bounce: 0,    duration: 0.35 },
  quick:     { type: 'spring', bounce: 0,    duration: 0.22 },
  momentum:  { type: 'spring', bounce: 0.2,  duration: 0.4 },
  celebrate: { type: 'spring', bounce: 0.25, duration: 0.5 },
};
export const EASE = { out: [0.16, 1, 0.3, 1], in: [0.7, 0, 0.84, 0], inOut: [0.76, 0, 0.24, 1] };
/** Variantes de slide direccional para pasos (custom = ±1). */
export const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 24 : -24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -24 : 24, opacity: 0 }),
};
