import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PerfilPage } from './PerfilPage';

jest.mock('../../firebase', () => ({ auth: {} }));
jest.mock('../../utils/authService', () => ({ changePassword: jest.fn() }));

const empleado = {
  legajo: '1000',
  nombre: 'Carlos',
  apellido: 'Gomez',
  mail: 'carlos@club.com',
  dni: '30111222',
  cuenta_reclamada: true,
};

describe('PerfilPage', () => {
  test('muestra los datos del empleado', () => {
    render(<PerfilPage empleado={empleado} cerrarSesion={jest.fn()} />);
    expect(screen.getByText('Carlos Gomez')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('30111222')).toBeInTheDocument();
    expect(screen.getByText('carlos@club.com')).toBeInTheDocument();
  });

  test('muestra las iniciales en el avatar', () => {
    render(<PerfilPage empleado={empleado} cerrarSesion={jest.fn()} />);
    expect(screen.getByText('CG')).toBeInTheDocument();
  });

  test('llama a cerrarSesion al hacer click en "Cerrar sesión"', () => {
    const cerrarSesion = jest.fn();
    render(<PerfilPage empleado={empleado} cerrarSesion={cerrarSesion} />);
    fireEvent.click(screen.getByRole('button', { name: /cerrar sesión/i }));
    expect(cerrarSesion).toHaveBeenCalledTimes(1);
  });

  test('abre y cierra el modal de cambiar contraseña', async () => {
    render(<PerfilPage empleado={empleado} cerrarSesion={jest.fn()} />);
    expect(screen.queryByRole('heading', { name: 'Cambiar contraseña' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
    expect(screen.getByRole('heading', { name: 'Cambiar contraseña' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Cambiar contraseña' })).not.toBeInTheDocument()
    );
  });
});
