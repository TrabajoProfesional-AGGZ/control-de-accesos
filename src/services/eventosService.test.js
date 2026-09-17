import { getEventosActivos } from './eventosService';

global.fetch = jest.fn();

describe('eventosService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventosActivos', () => {
    test('debe retornar la lista de eventos y la fecha del servidor cuando la petición es exitosa (ok: true)', async () => {
      const mockEventos = [
        { id: 'evento-1', nombre: 'Partido de Verano' },
        { id: 'evento-2', nombre: 'Torneo de Tenis' }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEventos,
        headers: { get: (nombre) => (nombre === 'Date' ? 'Thu, 17 Sep 2026 12:00:00 GMT' : null) },
      });

      const resultado = await getEventosActivos('fake-token');

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(resultado.eventos).toEqual(mockEventos);
      expect(resultado.fechaServidor).toEqual(new Date('Thu, 17 Sep 2026 12:00:00 GMT'));
    });

    test('debe retornar fechaServidor null si la respuesta no trae header Date', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: { get: () => null },
      });

      const resultado = await getEventosActivos('fake-token');

      expect(resultado.fechaServidor).toBeNull();
    });

    test('debe lanzar un error cuando la API responde con un error (ok: false)', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(getEventosActivos('fake-token')).rejects.toThrow('No se pudieron obtener los eventos');
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('debe propagar el error si hay una falla de red (promesa rechazada)', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getEventosActivos('fake-token')).rejects.toThrow('Network error');
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });
});