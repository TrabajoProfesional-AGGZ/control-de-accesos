import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReclamarCuentaEmpleadoForm } from './ReclamarCuentaEmpleadoForm';
import * as empleadosService from '../../services/empleadosService';
import * as authClaimsService from '../../services/authClaimsService';

jest.mock('../../firebase', () => ({ auth: {} }));

const mockCreateUser = jest.fn();
const mockDeleteUser = jest.fn();
const mockGetIdToken = jest.fn();
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: (...args) => mockCreateUser(...args),
  deleteUser: (...args) => mockDeleteUser(...args),
  getIdToken: (...args) => mockGetIdToken(...args),
}));

jest.mock('../../services/empleadosService', () => ({
  validarEmpleado: jest.fn(),
  reclamarCuentaEmpleado: jest.fn(),
}));

jest.mock('../../services/authClaimsService', () => ({
  asignarTipoClaim: jest.fn(),
}));

const mockRecargarEmpleado = jest.fn();
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ recargarEmpleado: mockRecargarEmpleado }),
}));

jest.mock('framer-motion', () => {
  const React = require('react');
  const passthrough = (Tag) => ({ children, ...props }) => {
    const { variants, initial, animate, transition, whileTap, exit, ...rest } = props;
    return React.createElement(Tag, rest, children);
  };
  return {
    motion: new Proxy({}, { get: (_, tag) => passthrough(tag) }),
  };
});

const usuarioFirebase = { uid: 'uid-1' };

function completarFormulario() {
  fireEvent.change(screen.getByLabelText('Legajo'), { target: { value: '1000' } });
  fireEvent.change(screen.getByLabelText('DNI'), { target: { value: '30111222' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'empleado@club.com' } });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'ClaveSegura123' } });
  fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'ClaveSegura123' } });
}

describe('ReclamarCuentaEmpleadoForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    empleadosService.validarEmpleado.mockResolvedValue({ token: 'tok-123' });
    mockCreateUser.mockResolvedValue({ user: usuarioFirebase });
    mockGetIdToken.mockImplementation((_user, forzar) => Promise.resolve(forzar ? 'token-con-claim' : 'token-sin-claim'));
    authClaimsService.asignarTipoClaim.mockResolvedValue({});
    empleadosService.reclamarCuentaEmpleado.mockResolvedValue({});
    mockRecargarEmpleado.mockResolvedValue();
  });

  test('llama a asignarTipoClaim antes que a reclamarCuentaEmpleado', async () => {
    render(<ReclamarCuentaEmpleadoForm onSuccess={() => {}} onCancel={() => {}} />);
    completarFormulario();
    fireEvent.click(screen.getByRole('button', { name: /completar registro/i }));

    await waitFor(() => expect(empleadosService.reclamarCuentaEmpleado).toHaveBeenCalled());

    const ordenClaim = authClaimsService.asignarTipoClaim.mock.invocationCallOrder[0];
    const ordenReclamo = empleadosService.reclamarCuentaEmpleado.mock.invocationCallOrder[0];
    expect(ordenClaim).toBeLessThan(ordenReclamo);
  });

  test('refresca el token con getIdToken(user, true) después del claim', async () => {
    render(<ReclamarCuentaEmpleadoForm onSuccess={() => {}} onCancel={() => {}} />);
    completarFormulario();
    fireEvent.click(screen.getByRole('button', { name: /completar registro/i }));

    await waitFor(() => expect(empleadosService.reclamarCuentaEmpleado).toHaveBeenCalled());
    expect(mockGetIdToken).toHaveBeenCalledWith(usuarioFirebase);
    expect(mockGetIdToken).toHaveBeenCalledWith(usuarioFirebase, true);
  });

  test('si el claim falla, hace deleteUser y no llama a reclamarCuentaEmpleado', async () => {
    authClaimsService.asignarTipoClaim.mockRejectedValueOnce(new Error('fallo claim'));
    render(<ReclamarCuentaEmpleadoForm onSuccess={() => {}} onCancel={() => {}} />);
    completarFormulario();
    fireEvent.click(screen.getByRole('button', { name: /completar registro/i }));

    await waitFor(() => expect(mockDeleteUser).toHaveBeenCalledWith(usuarioFirebase));
    expect(empleadosService.reclamarCuentaEmpleado).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Error al procesar el registro. Verificá tu conexión e intentá de nuevo.');
  });

  test('si el reclamo falla, hace deleteUser', async () => {
    empleadosService.reclamarCuentaEmpleado.mockRejectedValueOnce(new Error('empleado-no-encontrado'));
    render(<ReclamarCuentaEmpleadoForm onSuccess={() => {}} onCancel={() => {}} />);
    completarFormulario();
    fireEvent.click(screen.getByRole('button', { name: /completar registro/i }));

    await waitFor(() => expect(mockDeleteUser).toHaveBeenCalledWith(usuarioFirebase));
  });

  test('llama a recargarEmpleado antes de mostrar el éxito', async () => {
    render(<ReclamarCuentaEmpleadoForm onSuccess={() => {}} onCancel={() => {}} />);
    completarFormulario();
    fireEvent.click(screen.getByRole('button', { name: /completar registro/i }));

    await waitFor(() => expect(mockRecargarEmpleado).toHaveBeenCalled());
    expect(await screen.findByText('¡Cuenta configurada!')).toBeInTheDocument();
  });

  test('el botón "Empezar" llama a onSuccess antes de que venza el timeout automático', async () => {
    jest.useFakeTimers({ legacyFakeTimers: false });
    const onSuccess = jest.fn();
    const { unmount } = render(<ReclamarCuentaEmpleadoForm onSuccess={onSuccess} onCancel={() => {}} />);
    completarFormulario();
    fireEvent.click(screen.getByRole('button', { name: /completar registro/i }));

    await waitFor(() => expect(screen.getByText('¡Cuenta configurada!')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /empezar/i }));
    expect(onSuccess).toHaveBeenCalledTimes(1);

    // En la app real, onSuccess navega y desmonta este formulario — lo que dispara
    // el cleanup que hace clearTimeout. Se simula el desmontaje para verificarlo.
    unmount();
    jest.advanceTimersByTime(3000);
    expect(onSuccess).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  test('sin tocar "Empezar", onSuccess se llama solo tras 3000ms', async () => {
    jest.useFakeTimers({ legacyFakeTimers: false });
    const onSuccess = jest.fn();
    render(<ReclamarCuentaEmpleadoForm onSuccess={onSuccess} onCancel={() => {}} />);
    completarFormulario();
    fireEvent.click(screen.getByRole('button', { name: /completar registro/i }));

    await waitFor(() => expect(screen.getByText('¡Cuenta configurada!')).toBeInTheDocument());
    expect(onSuccess).not.toHaveBeenCalled();

    jest.advanceTimersByTime(3000);
    expect(onSuccess).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});
