const activo = !import.meta.env.PROD;

export const logger = {
  log: (...args) => { if (activo) console.log(...args); },
  warn: (...args) => { if (activo) console.warn(...args); },
  error: (...args) => { if (activo) console.error(...args); },
};
