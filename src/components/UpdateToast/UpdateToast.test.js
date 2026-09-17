import { render, screen, fireEvent, act } from '@testing-library/react';
import { UpdateToast } from './UpdateToast';
import { aplicarActualizacion } from '../../utils/pwaUpdate';

let capturarCallback;
jest.mock('../../utils/pwaUpdate', () => ({
  suscribirActualizacionDisponible: jest.fn((callback) => {
    capturarCallback = callback;
    return () => {};
  }),
  aplicarActualizacion: jest.fn(),
}));

describe('UpdateToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('no muestra nada mientras no hay actualización disponible', () => {
    render(<UpdateToast />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('muestra el aviso cuando el service worker notifica onNeedRefresh', () => {
    render(<UpdateToast />);
    act(() => capturarCallback());

    expect(screen.getByRole('status')).toHaveTextContent('Hay una versión nueva');
  });

  test('el botón Actualizar llama a aplicarActualizacion', () => {
    render(<UpdateToast />);
    act(() => capturarCallback());

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
    expect(aplicarActualizacion).toHaveBeenCalledTimes(1);
  });
});
