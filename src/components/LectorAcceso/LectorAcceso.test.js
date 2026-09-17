import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { LectorAcceso } from './LectorAcceso';
import { fetchTo } from '../../utils/utils';
import { Html5Qrcode } from 'html5-qrcode';

jest.mock('html5-qrcode');
jest.mock('../../utils/utils', () => ({
  fetchTo: jest.fn(),
}));

jest.mock('html5-qrcode', () => {
  const instancias = [];
  return {
    __instancias: instancias,
    Html5Qrcode: jest.fn().mockImplementation(function () {
      instancias.push(this);
      this.start = jest.fn((_camera, _config, onScanSuccess) => {
        this.onScanSuccess = onScanSuccess;
        return Promise.resolve();
      });
      this.pause = jest.fn();
      this.resume = jest.fn();
      this.stop = jest.fn().mockResolvedValue();
      this.clear = jest.fn();
    }),
  };
});

function ultimaInstanciaDelScanner() {
  const { __instancias } = jest.requireMock('html5-qrcode');
  return __instancias[__instancias.length - 1];
}

async function simularEscaneo(qrData) {
  const scanner = ultimaInstanciaDelScanner();
  await act(async () => {
    await scanner.onScanSuccess(qrData);
  });
}

describe('LectorAcceso', () => {
  beforeEach(() => {
    fetchTo.mockClear();
  });

  test('renderiza el contenedor de la cámara', () => {
    render(<LectorAcceso />);
    expect(document.getElementById('qr-reader')).toBeInTheDocument();
  });

  test('acceso válido: muestra el nombre del socio debajo de la cámara', async () => {
    fetchTo.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'ingreso_aprobado',
        socio_id: 'socio-123',
        nombre: 'Juan Pérez',
        estado_financiero: 'Activo',
        mensaje: 'Acceso permitido. Molinete liberado.',
      }),
    });

    render(<LectorAcceso />);
    await simularEscaneo('socio-123|123456');

    expect(fetchTo).toHaveBeenCalledWith('/api/v1/accesos/validar', 'POST', {
      qr_data: 'socio-123|123456',
    });
    expect(screen.getByText('Acceso permitido')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    // El estado financiero es el "motivo del rechazo": no corresponde mostrarlo en un acceso válido.
    expect(screen.queryByText(/Estado financiero/)).not.toBeInTheDocument();

    const scanner = ultimaInstanciaDelScanner();
    expect(scanner.pause).toHaveBeenCalledWith();
  });

  test('acceso inválido: muestra nombre y estado financiero como motivo', async () => {
    fetchTo.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        detail: {
          mensaje: 'Código QR inválido o expirado',
          socio_id: 'socio-123',
          nombre: 'Juan Pérez',
          estado_financiero: 'Moroso',
        },
      }),
    });

    render(<LectorAcceso />);
    await simularEscaneo('socio-123|000000');

    expect(screen.getByText('Código QR inválido o expirado')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Estado financiero: Moroso')).toBeInTheDocument();
  });

  test('QR con formato no reconocido: error sin nombre (ms-acceso no pudo identificar al socio)', async () => {
    fetchTo.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Formato de QR inválido' }),
    });

    render(<LectorAcceso />);
    await simularEscaneo('texto_sin_pipe');

    expect(screen.getByText('Formato de QR inválido')).toBeInTheDocument();
    expect(screen.queryByText(/Estado financiero/)).not.toBeInTheDocument();
  });

  test('el botón "Ok" cierra el resultado y reanuda el escaneo', async () => {
    fetchTo.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'ingreso_aprobado',
        socio_id: 'socio-123',
        nombre: 'Juan Pérez',
        estado_financiero: 'Activo',
        mensaje: 'Acceso permitido. Molinete liberado.',
      }),
    });

    render(<LectorAcceso />);
    await simularEscaneo('socio-123|123456');

    expect(screen.getByText('Acceso permitido')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ok' }));

    expect(screen.queryByText('Acceso permitido')).not.toBeInTheDocument();
    const scanner = ultimaInstanciaDelScanner();
    expect(scanner.resume).toHaveBeenCalled();
  });

  test('error de red: muestra un mensaje genérico', async () => {
    fetchTo.mockRejectedValueOnce(new Error('network error'));

    render(<LectorAcceso />);
    await simularEscaneo('socio-123|123456');

    expect(screen.getByText('Error procesando el código.')).toBeInTheDocument();
  });
});

describe('LectorAcceso - Inyección de id_evento', () => {
  let mockStart, mockPause, mockStop, mockClear;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configuramos los mocks de la cámara
    mockStart = jest.fn().mockResolvedValue();
    mockPause = jest.fn();
    mockStop = jest.fn().mockResolvedValue();
    mockClear = jest.fn();

    Html5Qrcode.mockImplementation(() => ({
      start: mockStart,
      pause: mockPause,
      stop: mockStop,
      clear: mockClear
    }));

    // Mockeamos la respuesta exitosa del backend
    fetchTo.mockResolvedValue({
      ok: true,
      json: async () => ({ nombre: 'Test', estado_financiero: 'Al día' })
    });
  });

  test('NO inyecta id_evento en el payload si es un ingreso normal (string vacío)', async () => {
    render(<LectorAcceso idEvento="" />);

    // Obtenemos la función "onScanSuccess" que el componente le pasa a la librería de QR
    const onScanSuccess = mockStart.mock.calls[0][2];

    // Simulamos una lectura de QR
    await waitFor(() => {
      onScanSuccess('hash-del-socio|123456');
    });

    // Verificamos que se llamó a la API SIN id_evento
    expect(fetchTo).toHaveBeenCalledWith('/api/v1/accesos/validar', 'POST', {
      qr_data: 'hash-del-socio|123456'
    });
  });

  test('inyecta id_evento en el payload si hay un evento seleccionado', async () => {
    render(<LectorAcceso idEvento="uuid-del-evento-999" />);

    const onScanSuccess = mockStart.mock.calls[0][2];

    await waitFor(() => {
      onScanSuccess('hash-del-socio|123456');
    });

    // Verificamos que se llamó a la API CON id_evento
    expect(fetchTo).toHaveBeenCalledWith('/api/v1/accesos/validar', 'POST', {
      qr_data: 'hash-del-socio|123456',
      id_evento: 'uuid-del-evento-999'
    });
  });

  test('captura el valor más reciente de idEvento si cambia sin reiniciar la cámara (Stale Closure)', async () => {
    // 1. Renderizamos con ingreso normal
    const { rerender } = render(<LectorAcceso idEvento="" />);
    
    // 2. Cambiamos la prop en caliente (simulando que el usuario usó el select)
    rerender(<LectorAcceso idEvento="evento-nuevo-456" />);

    const onScanSuccess = mockStart.mock.calls[0][2];

    // 3. Simulamos lectura
    await waitFor(() => {
      onScanSuccess('hash-del-socio|123456');
    });

    // 4. Si el useRef funcionó bien, el payload tiene que tener el evento nuevo, no el vacío
    expect(fetchTo).toHaveBeenCalledWith('/api/v1/accesos/validar', 'POST', {
      qr_data: 'hash-del-socio|123456',
      id_evento: 'evento-nuevo-456'
    });
    
    // Aseguramos que la cámara no se reinició por cambiar la prop
    expect(mockStart).toHaveBeenCalledTimes(1); 
  });
});