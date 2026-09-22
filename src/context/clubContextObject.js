import { createContext } from 'react';

// Default seguro para consumidores renderizados fuera de un ClubProvider (ej. tests unitarios de
// componentes que no envuelven con el provider) — mismo criterio que `authContextObject`.
export const ClubContext = createContext({
  club: null,
  cargandoClub: true,
  clubError: null,
});
