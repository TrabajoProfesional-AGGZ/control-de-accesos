import { useContext } from 'react';
import { ClubContext } from '../context/clubContextObject';

/** Acceso al `ClubContext` (club de este dominio, su marca blanca y el estado de la resolución). */
export function useClub() {
  return useContext(ClubContext);
}
