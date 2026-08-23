import { fetchTo } from '../utils/utils';

/** Trae los eventos activos (no vencidos, filtro server-side) para el selector de modo de operación. */
export const getEventosActivos = async () => {
  const response = await fetchTo(`/api/v1/eventos`,"GET");

  if (!response.ok) {
    throw new Error("No se pudieron obtener los eventos");
  }

  return response.json();
};