import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ControlAccesoPage } from './ControlAccesoPage';
import { getEventosActivos } from '../../services/eventosService';

jest.mock('../../services/eventosService');

jest.mock('../../components/LectorAcceso/LectorAcceso', () => ({
  LectorAcceso: ({ idEvento }) => <div data-testid="lector-mock">Evento ID: {idEvento}</div>
}));

function hoyISO() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

describe('ControlAccesoPage - Selección de Eventos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('carga los eventos y el selector funciona correctamente', async () => {
    getEventosActivos.mockResolvedValue([
      { id: 'evento-123', nombre: 'Partido de Verano', dia: hoyISO() }
    ]);

    render(<ControlAccesoPage onVolver={jest.fn()} />);

    expect(screen.getByText('Cargando eventos...')).toBeInTheDocument();

    await waitForElementToBeRemoved(() => screen.queryByText('Cargando eventos...'));

    const select = screen.getByLabelText('Modo de Operación:');
    expect(select).not.toBeDisabled();
    
    expect(screen.getByText('Validar entrada: Partido de Verano')).toBeInTheDocument();

    expect(screen.getByTestId('lector-mock')).toHaveTextContent('Evento ID:');

    await userEvent.selectOptions(select, 'evento-123');

    expect(screen.getByTestId('lector-mock')).toHaveTextContent('Evento ID: evento-123');
  });

  test('maneja el error si falla la carga de eventos', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    getEventosActivos.mockRejectedValue(new Error('Network error'));

    render(<ControlAccesoPage onVolver={jest.fn()} />);

    await waitForElementToBeRemoved(() => screen.queryByText('Cargando eventos...'));

    const select = screen.getByLabelText('Modo de Operación:');
    expect(select).not.toBeDisabled();
    
    expect(screen.queryByText(/Validar entrada:/)).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  test('solo muestra en el selector eventos del día de hoy', async () => {
    getEventosActivos.mockResolvedValue([
      { id: 'evento-hoy', nombre: 'Partido de Verano', dia: hoyISO() },
      { id: 'evento-futuro', nombre: 'Torneo del mes que viene', dia: '2099-01-01' },
    ]);

    render(<ControlAccesoPage onVolver={jest.fn()} />);

    await waitForElementToBeRemoved(() => screen.queryByText('Cargando eventos...'));

    expect(screen.getByText('Validar entrada: Partido de Verano')).toBeInTheDocument();
    expect(screen.queryByText('Validar entrada: Torneo del mes que viene')).not.toBeInTheDocument();
  });
});