import { render, screen, act } from '@testing-library/react';
import { ClubProvider } from './ClubContext';
import { useClub } from '../hooks/useClub';
import { resolverClub } from '../services/clubService';

jest.mock('../services/clubService', () => ({
  resolverClub: jest.fn(),
  clubEnMemoria: jest.fn(() => null),
}));

const CLUB = {
  club_id: 'club-uno',
  slug: 'club-uno',
  nombre: 'Club Uno',
  colores: { primario: '#0A2A66', secundario: '#E8B400' },
  escudo: null,
};

function Sonda() {
  const { club, cargandoClub, clubError } = useClub();
  return (
    <div>
      <span>club: {club ? club.nombre : 'ninguno'}</span>
      <span>cargando: {cargandoClub ? 'si' : 'no'}</span>
      <span>error: {clubError ?? 'ninguno'}</span>
    </div>
  );
}

async function montar() {
  await act(async () => {
    render(
      <ClubProvider>
        <Sonda />
      </ClubProvider>,
    );
  });
}

describe('ClubProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.style.removeProperty('--club-color-primario');
    document.documentElement.style.removeProperty('--club-color-secundario');
  });

  test('expone el club del dominio y publica sus colores como custom properties', async () => {
    resolverClub.mockResolvedValue(CLUB);
    await montar();

    expect(screen.getByText('club: Club Uno')).toBeInTheDocument();
    expect(screen.getByText('cargando: no')).toBeInTheDocument();
    expect(document.documentElement.style.getPropertyValue('--club-color-primario')).toBe('#0A2A66');
    expect(document.documentElement.style.getPropertyValue('--club-color-secundario')).toBe('#E8B400');
  });

  test('si el dominio no tiene club, expone el error y no pinta ningún color', async () => {
    resolverClub.mockRejectedValue(new Error('club-desconocido'));
    await montar();

    expect(screen.getByText('club: ninguno')).toBeInTheDocument();
    expect(screen.getByText('error: club-desconocido')).toBeInTheDocument();
    expect(document.documentElement.style.getPropertyValue('--club-color-primario')).toBe('');
  });

  test('un club sin branding no rompe nada', async () => {
    resolverClub.mockResolvedValue({ ...CLUB, colores: { primario: null, secundario: null } });
    await montar();

    expect(screen.getByText('club: Club Uno')).toBeInTheDocument();
    expect(document.documentElement.style.getPropertyValue('--club-color-primario')).toBe('');
  });
});
