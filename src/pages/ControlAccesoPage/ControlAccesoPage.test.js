import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ControlAccesoPage } from './ControlAccesoPage';
import { getEventosActivos } from '../../services/eventosService';

jest.mock('../../services/eventosService');

jest.mock('../../components/LectorAcceso/LectorAcceso', () => ({
  LectorAcceso: ({ idEvento, nombreEvento }) => (
    <div data-testid="lector-mock">
      Evento ID: {idEvento} · Nombre: {nombreEvento}
    </div>
  ),
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

    const chipNormal = screen.getByRole('radio', { name: 'Ingreso normal al club' });
    expect(chipNormal).not.toBeDisabled();

    const chipEvento = await screen.findByRole('radio', { name: 'Validar entrada: Partido de Verano' });
    expect(chipEvento).toBeInTheDocument();

    expect(screen.getByTestId('lector-mock')).toHaveTextContent('Evento ID:');

    await userEvent.click(chipEvento);

    expect(screen.getByTestId('lector-mock')).toHaveTextContent('Evento ID: evento-123');
    expect(screen.getByTestId('lector-mock')).toHaveTextContent('Nombre: Partido de Verano');
    expect(chipEvento).toHaveAttribute('aria-checked', 'true');
  });

  test('el chip Ingreso normal está habilitado mientras carga', async () => {
    let resolverEventos;
    getEventosActivos.mockReturnValue(new Promise((resolve) => { resolverEventos = resolve; }));

    render(<ControlAccesoPage onVolver={jest.fn()} />);

    const chipNormal = screen.getByRole('radio', { name: 'Ingreso normal al club' });
    expect(chipNormal).not.toBeDisabled();

    resolverEventos([]);
    await waitFor(() => expect(getEventosActivos).toHaveBeenCalled());
  });

  test('maneja el error si falla la carga de eventos y muestra Reintentar', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    getEventosActivos.mockRejectedValue(new Error('Network error'));

    render(<ControlAccesoPage onVolver={jest.fn()} />);

    const chipNormal = screen.getByRole('radio', { name: 'Ingreso normal al club' });
    expect(chipNormal).not.toBeDisabled();

    expect(await screen.findByText('No se pudieron cargar los eventos de hoy.')).toBeInTheDocument();
    expect(screen.queryByText(/Validar entrada:/)).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  test('Reintentar vuelve a llamar getEventosActivos', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    getEventosActivos.mockRejectedValueOnce(new Error('Network error'));

    render(<ControlAccesoPage onVolver={jest.fn()} />);

    await screen.findByText('No se pudieron cargar los eventos de hoy.');
    expect(getEventosActivos).toHaveBeenCalledTimes(1);

    getEventosActivos.mockResolvedValueOnce([]);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => expect(getEventosActivos).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('No se pudieron cargar los eventos de hoy.')).not.toBeInTheDocument();
  });

  test('solo muestra en el selector eventos del día de hoy', async () => {
    getEventosActivos.mockResolvedValue([
      { id: 'evento-hoy', nombre: 'Partido de Verano', dia: hoyISO() },
      { id: 'evento-futuro', nombre: 'Torneo del mes que viene', dia: '2099-01-01' },
    ]);

    render(<ControlAccesoPage onVolver={jest.fn()} />);

    expect(await screen.findByText('Validar entrada: Partido de Verano')).toBeInTheDocument();
    expect(screen.queryByText('Validar entrada: Torneo del mes que viene')).not.toBeInTheDocument();
  });
});

describe('ControlAccesoPage - Refresco de eventos en segundo plano (W5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('refetchea cada 5 minutos mientras la vista está montada', async () => {
    jest.useFakeTimers();
    getEventosActivos.mockResolvedValue([]);

    render(<ControlAccesoPage onVolver={jest.fn()} />);
    await waitFor(() => expect(getEventosActivos).toHaveBeenCalledTimes(1));

    await jest.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(getEventosActivos).toHaveBeenCalledTimes(2);
  });

  test('refetchea al volver a visible', async () => {
    getEventosActivos.mockResolvedValue([]);

    render(<ControlAccesoPage onVolver={jest.fn()} />);
    await waitFor(() => expect(getEventosActivos).toHaveBeenCalledTimes(1));

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => expect(getEventosActivos).toHaveBeenCalledTimes(2));
  });

  test('un refetch silencioso fallido no muestra el aviso de error ni vacía la lista', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    getEventosActivos
      .mockResolvedValueOnce([{ id: 'evento-hoy', nombre: 'Partido de Verano', dia: hoyISO() }])
      .mockRejectedValueOnce(new Error('network error'));

    render(<ControlAccesoPage onVolver={jest.fn()} />);
    await screen.findByText('Validar entrada: Partido de Verano');

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => expect(getEventosActivos).toHaveBeenCalledTimes(2));
    expect(screen.getByText('Validar entrada: Partido de Verano')).toBeInTheDocument();
    expect(screen.queryByText('No se pudieron cargar los eventos de hoy.')).not.toBeInTheDocument();
  });

  test('si el evento elegido desaparece del refetch, vuelve a "Ingreso normal al club"', async () => {
    getEventosActivos
      .mockResolvedValueOnce([{ id: 'evento-hoy', nombre: 'Partido de Verano', dia: hoyISO() }])
      .mockResolvedValueOnce([]);
    Object.defineProperty(navigator, 'vibrate', { value: jest.fn(), configurable: true });

    render(<ControlAccesoPage onVolver={jest.fn()} />);
    const chipEvento = await screen.findByRole('radio', { name: 'Validar entrada: Partido de Verano' });
    await userEvent.click(chipEvento);
    expect(screen.getByTestId('lector-mock')).toHaveTextContent('Evento ID: evento-hoy');

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() =>
      expect(screen.getByRole('radio', { name: 'Ingreso normal al club' })).toHaveAttribute(
        'aria-checked',
        'true'
      )
    );
    expect(screen.getByTestId('lector-mock')).toHaveTextContent('Evento ID:');
    expect(screen.getByTestId('lector-mock')).not.toHaveTextContent('Evento ID: evento-hoy');

    delete navigator.vibrate;
  });
});