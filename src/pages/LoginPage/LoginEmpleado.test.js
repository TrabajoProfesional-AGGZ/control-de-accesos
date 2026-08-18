import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginEmpleado } from './LoginEmpleado';
import * as authService from '../../utils/authService';
import * as empleadosService from '../../services/empleadosService';
import { MAX_LEN } from '../../utils/formValidators';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../utils/authService', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  changePassword: jest.fn(),
  resetPassword: jest.fn(),
}));
jest.mock('../../services/empleadosService', () => ({
  obtenerMailPorLegajo: jest.fn(),
  validarEmpleado: jest.fn(),
  reclamarCuentaEmpleado: jest.fn(),
}));

let mockAuthState;
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

jest.mock('framer-motion', () => {
  const React = require('react');
  const passthrough = (Tag) => ({ children, ...props }) => {
    const { variants, initial, animate, transition, whileTap, ...rest } = props;
    return React.createElement(Tag, rest, children);
  };
  return {
    motion: new Proxy({}, { get: (_, tag) => passthrough(tag) }),
    useReducedMotion: () => true,
  };
});

describe('LoginEmpleado', () => {
  beforeEach(() => {
    mockAuthState = { empleado: null, authError: null, cerrarSesion: jest.fn().mockResolvedValue() };
    authService.login.mockClear();
    authService.resetPassword.mockClear();
    empleadosService.obtenerMailPorLegajo.mockClear();
  });

  test('renderiza los campos de email/legajo, contraseña y el botón de ingresar', () => {
    render(<LoginEmpleado irAReclamo={() => {}} />);
    expect(screen.getByLabelText('Email o legajo')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
  });

  test('loguea directo con Firebase si el identificador es un email', async () => {
    authService.login.mockResolvedValueOnce({ user: {} });
    render(<LoginEmpleado irAReclamo={() => {}} />);

    fireEvent.change(screen.getByLabelText('Email o legajo'), { target: { value: 'empleado@club.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave123' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => expect(authService.login).toHaveBeenCalledWith('empleado@club.com', 'clave123'));
    expect(empleadosService.obtenerMailPorLegajo).not.toHaveBeenCalled();
  });

  test('resuelve legajo -> mail antes de llamar a Firebase si el identificador no es un email', async () => {
    empleadosService.obtenerMailPorLegajo.mockResolvedValueOnce('empleado@club.com');
    authService.login.mockResolvedValueOnce({ user: {} });
    render(<LoginEmpleado irAReclamo={() => {}} />);

    fireEvent.change(screen.getByLabelText('Email o legajo'), { target: { value: '1234' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave123' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => expect(empleadosService.obtenerMailPorLegajo).toHaveBeenCalledWith('1234'));
    expect(authService.login).toHaveBeenCalledWith('empleado@club.com', 'clave123');
  });

  test('muestra "Credenciales incorrectas" si el legajo no resuelve a ningún empleado', async () => {
    empleadosService.obtenerMailPorLegajo.mockRejectedValueOnce(new Error('empleado-no-encontrado'));
    render(<LoginEmpleado irAReclamo={() => {}} />);

    fireEvent.change(screen.getByLabelText('Email o legajo'), { target: { value: '9999' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave123' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument();
    });
    expect(authService.login).not.toHaveBeenCalled();
  });

  test('muestra exactamente "Credenciales incorrectas" cuando Firebase rechaza por auth/invalid-credential', async () => {
    authService.login.mockRejectedValueOnce({ code: 'auth/invalid-credential' });
    render(<LoginEmpleado irAReclamo={() => {}} />);

    fireEvent.change(screen.getByLabelText('Email o legajo'), { target: { value: 'empleado@club.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'mala-clave' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument();
    });
  });

  test('muestra "Servicio no disponible" cuando falla por otro motivo (no de credenciales)', async () => {
    authService.login.mockRejectedValueOnce({ code: 'auth/network-request-failed', message: 'Error de red' });
    render(<LoginEmpleado irAReclamo={() => {}} />);

    fireEvent.change(screen.getByLabelText('Email o legajo'), { target: { value: 'empleado@club.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave123' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText('Servicio no disponible')).toBeInTheDocument();
    });
    expect(screen.queryByText('Credenciales incorrectas')).not.toBeInTheDocument();
  });

  test('llama a irAReclamo al hacer click en el link de primera vez', () => {
    const irAReclamo = jest.fn();
    render(<LoginEmpleado irAReclamo={irAReclamo} />);
    fireEvent.click(screen.getByText(/configurar mi cuenta/i));
    expect(irAReclamo).toHaveBeenCalledTimes(1);
  });

  test('rechaza el envío si el identificador supera la longitud máxima permitida, sin llamar a Firebase', async () => {
    render(<LoginEmpleado irAReclamo={() => {}} />);
    const identificadorDemasiadoLargo = `${'a'.repeat(MAX_LEN.EMAIL - 4)}@a.co`;

    fireEvent.change(screen.getByLabelText('Email o legajo'), { target: { value: identificadorDemasiadoLargo } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave123' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => {
      expect(screen.getByText(`Máximo ${MAX_LEN.EMAIL} caracteres`)).toBeInTheDocument();
    });
    expect(authService.login).not.toHaveBeenCalled();
  });

  test('el botón de mostrar/ocultar contraseña alterna el tipo del input', () => {
    render(<LoginEmpleado irAReclamo={() => {}} />);
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'text');

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
  });

  test('el botón "¿Olvidaste tu contraseña?" abre el formulario de recuperación, y se puede cerrar', async () => {
    render(<LoginEmpleado irAReclamo={() => {}} />);
    expect(screen.queryByRole('heading', { name: 'Recuperar contraseña' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /olvidaste tu contraseña/i }));
    expect(screen.getByRole('heading', { name: 'Recuperar contraseña' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Recuperar contraseña' })).not.toBeInTheDocument();
    });
  });

  test('llama a onIngresoCompleto una sola vez cuando el login es exitoso', async () => {
    const onIngresoCompleto = jest.fn();
    const { rerender } = render(<LoginEmpleado irAReclamo={() => {}} onIngresoCompleto={onIngresoCompleto} />);

    mockAuthState = { ...mockAuthState, empleado: { legajo: '1000' } };
    rerender(<LoginEmpleado irAReclamo={() => {}} onIngresoCompleto={onIngresoCompleto} />);

    await waitFor(() => expect(onIngresoCompleto).toHaveBeenCalledTimes(1));

    rerender(<LoginEmpleado irAReclamo={() => {}} onIngresoCompleto={onIngresoCompleto} />);
    expect(onIngresoCompleto).toHaveBeenCalledTimes(1);
  });
});
