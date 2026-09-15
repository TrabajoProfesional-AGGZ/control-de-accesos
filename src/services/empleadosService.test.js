import { validarEmpleado, reclamarCuentaEmpleado, obtenerMailPorLegajo } from './empleadosService';
import { fetchTo, fetchWithOutAuth } from '../utils/utils';

jest.mock('../utils/utils', () => ({
  fetchTo: jest.fn(),
  fetchWithOutAuth: jest.fn(),
}));

describe('empleadosService', () => {
  beforeEach(() => {
    fetchTo.mockClear();
    fetchWithOutAuth.mockClear();
  });

  describe('validarEmpleado', () => {
    test('devuelve el empleado si la validación es exitosa', async () => {
      fetchWithOutAuth.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ legajo: '1000' }) });
      const resultado = await validarEmpleado('1000', 'a@a.com', '111');
      expect(fetchWithOutAuth).toHaveBeenCalledWith('/api/v1/empleados/validar', 'POST', {
        legajo: '1000',
        mail: 'a@a.com',
        dni: '111',
      });
      expect(resultado).toEqual({ legajo: '1000' });
    });

    test('lanza "empleado-no-encontrado" en 404', async () => {
      fetchWithOutAuth.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(validarEmpleado('1000', 'a@a.com', '111')).rejects.toThrow('empleado-no-encontrado');
    });

    test('lanza "cuenta-ya-registrada" en 409', async () => {
      fetchWithOutAuth.mockResolvedValueOnce({ ok: false, status: 409 });
      await expect(validarEmpleado('1000', 'a@a.com', '111')).rejects.toThrow('cuenta-ya-registrada');
    });

    test('lanza "demasiados-intentos" en 429', async () => {
      fetchWithOutAuth.mockResolvedValueOnce({ ok: false, status: 429 });
      await expect(validarEmpleado('1000', 'a@a.com', '111')).rejects.toThrow('demasiados-intentos');
    });
  });

  describe('reclamarCuentaEmpleado', () => {
    test('llama al endpoint autenticado con el legajo codificado', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ cuenta_reclamada: true }) });
      await reclamarCuentaEmpleado('legajo con espacio');
      expect(fetchTo).toHaveBeenCalledWith(
        '/api/v1/empleados/por-legajo/legajo%20con%20espacio/reclamar',
        'POST',
        null,
      );
    });

    test('manda el token de validación cuando lo hay', async () => {
      fetchTo.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ cuenta_reclamada: true }) });
      await reclamarCuentaEmpleado('1000', 'tok-123');
      expect(fetchTo).toHaveBeenCalledWith(
        '/api/v1/empleados/por-legajo/1000/reclamar',
        'POST',
        { token: 'tok-123' },
      );
    });

    test('lanza "validacion-vencida" en 403', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 403 });
      await expect(reclamarCuentaEmpleado('1000', 'tok-viejo')).rejects.toThrow('validacion-vencida');
    });

    test('lanza "cuenta-ya-registrada" en 409', async () => {
      fetchTo.mockResolvedValueOnce({ ok: false, status: 409 });
      await expect(reclamarCuentaEmpleado('1000')).rejects.toThrow('cuenta-ya-registrada');
    });
  });

  describe('obtenerMailPorLegajo', () => {
    test('devuelve solo el mail', async () => {
      fetchWithOutAuth.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ mail: 'a@a.com' }) });
      const mail = await obtenerMailPorLegajo('1000');
      expect(mail).toBe('a@a.com');
    });

    test('lanza "empleado-no-encontrado" en 404', async () => {
      fetchWithOutAuth.mockResolvedValueOnce({ ok: false, status: 404 });
      await expect(obtenerMailPorLegajo('no-existe')).rejects.toThrow('empleado-no-encontrado');
    });
  });
});
