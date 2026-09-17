import { render, screen, act } from '@testing-library/react';
import { AuthProvider } from './AuthContext';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../firebase';

jest.mock('../firebase', () => ({
  auth: { currentUser: null },
}));

let callbackAuthState;
const mockSignOut = jest.fn();
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: (auth, callback) => {
    callbackAuthState = callback;
    return () => {};
  },
  signOut: (...args) => mockSignOut(...args),
}));

jest.mock('../utils/utils', () => ({
  fetchTo: jest.fn(),
}));
import { fetchTo } from '../utils/utils';

function Sonda() {
  const { empleado, authError, recargarEmpleado } = useAuth();
  return (
    <div>
      <span>empleado: {empleado ? empleado.nombre : 'ninguno'}</span>
      <span>authError: {authError ?? 'ninguno'}</span>
      <button onClick={() => recargarEmpleado()}>recargar</button>
    </div>
  );
}

async function loguearEmpleado(firebaseUser = { email: 'empleado@example.com', getIdToken: async () => 'token' }) {
  fetchTo.mockResolvedValueOnce({ ok: true, json: async () => ({ nombre: 'Carlos' }) });
  await act(async () => {
    await callbackAuthState(firebaseUser);
  });
}

describe('AuthProvider — carga de perfil', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('carga el perfil del empleado tras un login exitoso', async () => {
    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>,
    );
    await loguearEmpleado();
    expect(await screen.findByText('empleado: Carlos')).toBeInTheDocument();
  });

  test('si el backend no puede resolver el perfil, expone un authError y deja empleado en null', async () => {
    fetchTo.mockResolvedValueOnce({ ok: false });
    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>,
    );
    await act(async () => {
      await callbackAuthState({ email: 'empleado@example.com', getIdToken: async () => 'token' });
    });

    expect(await screen.findByText('empleado: ninguno')).toBeInTheDocument();
  });

  test('recargarEmpleado vuelve a pedir el perfil y limpia authError', async () => {
    render(
      <AuthProvider>
        <Sonda />
      </AuthProvider>,
    );

    fetchTo.mockResolvedValueOnce({ ok: false });
    const firebaseUser = { email: 'empleado@example.com', getIdToken: async () => 'token' };
    await act(async () => {
      await callbackAuthState(firebaseUser);
    });
    expect(await screen.findByText('authError: Servicio no disponible')).toBeInTheDocument();

    auth.currentUser = firebaseUser;
    fetchTo.mockResolvedValueOnce({ ok: true, json: async () => ({ nombre: 'Carlos' }) });
    await act(async () => {
      screen.getByText('recargar').click();
    });

    expect(await screen.findByText('empleado: Carlos')).toBeInTheDocument();
    expect(await screen.findByText('authError: ninguno')).toBeInTheDocument();
  });
});
