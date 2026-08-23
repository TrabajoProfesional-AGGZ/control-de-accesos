export const MAX_LEN = {
  EMAIL: 254,
  PASSWORD: 128,
  LEGAJO: 20,
  DNI: 50,
};

// eslint-disable-next-line no-control-regex
const CARACTERES_DE_CONTROL = /[\x00-\x1F\x7F]/;

/** Rechaza caracteres de control y valores más largos que `maxLength`. */
export function validarCredencialSegura(value, maxLength) {
  if (CARACTERES_DE_CONTROL.test(value)) {
    return 'El valor contiene caracteres no permitidos';
  }
  if (value.length > maxLength) {
    return `Máximo ${maxLength} caracteres`;
  }
  return '';
}

/** Exige mínimo 10 caracteres con mayúscula, minúscula y número. */
export function validarFortalezaPassword(v) {
  if (!v || v.length < 10) return 'Mínimo 10 caracteres';
  if (v.length > MAX_LEN.PASSWORD) return `Máximo ${MAX_LEN.PASSWORD} caracteres`;
  if (!/[a-z]/.test(v)) return 'Debe incluir al menos una minúscula';
  if (!/[A-Z]/.test(v)) return 'Debe incluir al menos una mayúscula';
  if (!/\d/.test(v)) return 'Debe incluir al menos un número';
  return undefined;
}
