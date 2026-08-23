import logoSocio from '../../assets/logo_socio.png';
import './LoadingScreen.css';

/** Spinner de carga genérico con el logo animado. */
export function LoadingScreen() {
  return (
    <output className="loading-screen" aria-label="Cargando">
      <img src={logoSocio} alt="SocioUnido" className="loading-logo" />
    </output>
  );
}
