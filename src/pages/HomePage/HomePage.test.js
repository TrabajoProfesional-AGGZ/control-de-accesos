import { render, screen, fireEvent } from '@testing-library/react';
import { HomePage } from './HomePage';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../utils/authService', () => ({ changePassword: jest.fn() }));
jest.mock('../../utils/utils', () => ({ fetchTo: jest.fn() }));

// LectorAcceso monta html5-qrcode (requiere cámara real) — para HomePage solo nos
// interesa que la navegación a la pantalla dedicada funcione, no el escaneo en sí
// (eso lo cubre LectorAcceso.test.js).
jest.mock('html5-qrcode', () => ({
  Html5Qrcode: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(),
    pause: jest.fn(),
    resume: jest.fn(),
    stop: jest.fn().mockResolvedValue(),
    clear: jest.fn(),
  })),
}));

const empleado = {
  legajo: '1000',
  nombre: 'Carlos',
  apellido: 'Gomez',
  mail: 'carlos@club.com',
  dni: '30111222',
};

describe('HomePage', () => {
  test('muestra el banner de bienvenida con los datos del empleado, sin estado financiero', () => {
    render(<HomePage empleado={empleado} cerrarSesion={jest.fn()} />);
    expect(screen.getByText('Bienvenido, Carlos Gomez')).toBeInTheDocument();
    expect(screen.getByText('Legajo 1000')).toBeInTheDocument();
    expect(screen.queryByText(/estado/i)).not.toBeInTheDocument();
  });

  test('el ícono de perfil abre y cierra la vista de perfil', () => {
    render(<HomePage empleado={empleado} cerrarSesion={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /mi perfil/i }));
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /mi perfil/i }));
    expect(screen.getByText('Bienvenido, Carlos Gomez')).toBeInTheDocument();
  });

  test('el botón "Escanear QR de socio" navega a la pantalla de Control de Acceso y "Ir al inicio" regresa al inicio', () => {
    render(<HomePage empleado={empleado} cerrarSesion={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /escanear qr de socio/i }));

    expect(screen.getByRole('heading', { name: 'Control de Acceso' })).toBeInTheDocument();
    expect(screen.queryByText('Bienvenido, Carlos Gomez')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /ir a la página principal/i }));

    expect(screen.getByText('Bienvenido, Carlos Gomez')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Control de Acceso' })).not.toBeInTheDocument();
  });
});
