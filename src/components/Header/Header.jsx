import { CircleUserRound } from 'lucide-react';
import logoTexto from '../../assets/texto.png';
import './Header.css';

/** Barra superior fija: ícono de perfil, logo centrado y spacer para balancear el layout. */
export function Header({ onPerfil }) {
  return (
    <header className="app-header">
      <button onClick={onPerfil} className="app-header-perfil hit-area" aria-label="Mi perfil">
        <CircleUserRound size={24} />
      </button>
      <img src={logoTexto} alt="SocioUnido" className="app-header-logo" />
      {/* Mismo ancho que el botón de perfil, para que el logo quede centrado */}
      <span className="app-header-spacer" aria-hidden="true" />
    </header>
  );
}
