import { useEffect, useMemo, useState } from 'react';
import { clubEnMemoria, resolverClub } from '../services/clubService';
import { ClubContext } from './clubContextObject';

/**
 * Resuelve el club de este dominio al montar y lo provee a toda la app, junto con su marca
 * blanca. Va **por encima del AuthProvider**: el club existe antes de que haya sesión, y es lo
 * que las pantallas pre-login necesitan para saber a qué tenant le están hablando.
 *
 * **No bloquea el render**, a propósito. Lo único que de verdad depende de esta resolución son
 * las tres llamadas pre-login, que fallan con su propio error si el club no está; todo lo que
 * pasa después del login se resuelve con el claim del token, que el gateway propaga solo. Poner
 * una pantalla de espera acá dejaría a un empleado ya logueado sin poder trabajar porque el
 * catálogo de clubes tardó en responder.
 */
export function ClubProvider({ children }) {
  const [club, setClub] = useState(clubEnMemoria);
  const [cargandoClub, setCargandoClub] = useState(true);
  const [clubError, setClubError] = useState(null);

  useEffect(() => {
    let vigente = true;

    resolverClub()
      .then((resuelto) => {
        if (!vigente) return;
        setClub(resuelto);
        setClubError(null);
      })
      .catch((fallo) => {
        if (!vigente) return;
        setClub(null);
        setClubError(fallo.message);
      })
      .finally(() => {
        if (vigente) setCargandoClub(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  // Los colores del club se publican como custom properties en `:root` para que el CSS existente
  // pueda irse enganchando a la marca blanca sin que este provider sepa nada de estilos. El
  // servicio ya filtró todo lo que no sea un hexadecimal.
  useEffect(() => {
    const raiz = document.documentElement;
    const { primario, secundario } = club?.colores ?? {};

    if (primario) raiz.style.setProperty('--club-color-primario', primario);
    else raiz.style.removeProperty('--club-color-primario');

    if (secundario) raiz.style.setProperty('--club-color-secundario', secundario);
    else raiz.style.removeProperty('--club-color-secundario');
  }, [club]);

  const value = useMemo(() => ({ club, cargandoClub, clubError }), [club, cargandoClub, clubError]);

  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>;
}
