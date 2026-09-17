import { fetchTo } from '../utils/utils';

/**
 * Trae los eventos activos (no vencidos, filtro server-side) para el selector de modo de
 * operación, junto con la fecha del servidor (header HTTP estándar `Date`, siempre expuesto
 * por CORS) para que quien filtre "eventos de hoy" no dependa del reloj/huso horario del
 * dispositivo (una tablet mal configurada mostraría los eventos equivocados).
 */
export const getEventosActivos = async () => {
  const response = await fetchTo(`/api/v1/eventos`,"GET");

  if (!response.ok) {
    throw new Error("No se pudieron obtener los eventos");
  }

  const eventos = await response.json();
  const fechaHeader = response.headers?.get?.('Date');
  const fechaServidor = fechaHeader ? new Date(fechaHeader) : null;

  return { eventos, fechaServidor };
};