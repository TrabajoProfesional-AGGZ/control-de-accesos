import { useState } from 'react';
import { QrCode } from 'lucide-react';
import { Header } from '../../components/Header/Header';
import { WelcomeCard } from '../../components/WelcomeCard/WelcomeCard';
import { PerfilPage } from '../PerfilPage/PerfilPage';
import { ControlAccesoPage } from '../ControlAccesoPage/ControlAccesoPage';
import '../../control-theme.css';
import './HomePage.css';

/** Dashboard del empleado: togglea entre inicio, perfil y control de acceso (sin router). */
export function HomePage({ empleado, cerrarSesion }) {
  const [vista, setVista] = useState('inicio');

  return (
    <div>
      <Header
        onPerfil={() => setVista(vista === 'perfil' ? 'inicio' : 'perfil')}
      />

      <main className="home-page">
        {vista === 'perfil' && (
          <PerfilPage empleado={empleado} cerrarSesion={cerrarSesion} />
        )}

        {vista === 'control-acceso' && (
          <ControlAccesoPage onVolver={() => setVista('inicio')} />
        )}

        {vista === 'inicio' && (
          <>
            <WelcomeCard empleado={empleado} />

            <div className="main-action-container">
              <button
                onClick={() => setVista('control-acceso')}
                className="btn-escanear-principal"
              >
                <QrCode size={48} strokeWidth={1.75} />
                Escanear QR de socio
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
