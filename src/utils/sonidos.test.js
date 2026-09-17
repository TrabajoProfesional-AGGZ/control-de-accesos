function mockAudioContext({ resumeResuelve = true } = {}) {
  const gainNode = {
    gain: {
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
    connect: jest.fn(() => gainNode),
  };
  const oscillator = {
    type: 'sine',
    frequency: { value: 0 },
    connect: jest.fn(() => gainNode),
    start: jest.fn(),
    stop: jest.fn(),
  };
  const ctxInstancia = {
    state: 'suspended',
    currentTime: 0,
    createOscillator: jest.fn(() => oscillator),
    createGain: jest.fn(() => gainNode),
    resume: jest.fn(() => {
      if (resumeResuelve) {
        ctxInstancia.state = 'running';
        return Promise.resolve();
      }
      return Promise.reject(new Error('no se pudo reanudar'));
    }),
  };
  window.AudioContext = jest.fn(() => ctxInstancia);
  return { ctxInstancia, oscillator };
}

describe('sonidos', () => {
  beforeEach(() => {
    jest.resetModules();
    delete window.AudioContext;
    delete window.webkitAudioContext;
    localStorage.clear();
  });

  test('desbloquearAudio crea el contexto y lo reanuda', async () => {
    const { ctxInstancia } = mockAudioContext();
    const { desbloquearAudio } = require('./sonidos');

    desbloquearAudio();

    expect(window.AudioContext).toHaveBeenCalled();
    await Promise.resolve();
    await Promise.resolve();
    expect(ctxInstancia.resume).toHaveBeenCalled();
  });

  test('desbloquearAudio no explota sin AudioContext en window', () => {
    const { desbloquearAudio } = require('./sonidos');
    expect(() => desbloquearAudio()).not.toThrow();
  });

  test('sonarResultado no suena si el contexto no está running', () => {
    const { ctxInstancia } = mockAudioContext();
    const { sonarResultado } = require('./sonidos');

    sonarResultado(true);

    expect(ctxInstancia.createOscillator).not.toHaveBeenCalled();
  });

  test('sonarResultado(true) toca dos tonos ascendentes tras desbloquear', async () => {
    const { ctxInstancia } = mockAudioContext();
    const { desbloquearAudio, sonarResultado } = require('./sonidos');

    desbloquearAudio();
    await Promise.resolve();
    await Promise.resolve();

    sonarResultado(true);

    expect(ctxInstancia.createOscillator).toHaveBeenCalledTimes(2);
  });

  test('sonarResultado(false) toca un solo tono grave', async () => {
    const { ctxInstancia } = mockAudioContext();
    const { desbloquearAudio, sonarResultado } = require('./sonidos');

    desbloquearAudio();
    await Promise.resolve();
    await Promise.resolve();

    sonarResultado(false);

    expect(ctxInstancia.createOscillator).toHaveBeenCalledTimes(1);
  });

  test('sonarResultado respeta "sonido_escaneo" = "off" en localStorage', async () => {
    const { ctxInstancia } = mockAudioContext();
    const { desbloquearAudio, sonarResultado } = require('./sonidos');

    desbloquearAudio();
    await Promise.resolve();
    await Promise.resolve();
    localStorage.setItem('sonido_escaneo', 'off');

    sonarResultado(true);

    expect(ctxInstancia.createOscillator).not.toHaveBeenCalled();
  });

  test('suscribirAudioDisponible notifica el estado actual y los cambios', async () => {
    mockAudioContext();
    const { desbloquearAudio, suscribirAudioDisponible } = require('./sonidos');

    const callback = jest.fn();
    const desuscribir = suscribirAudioDisponible(callback);
    expect(callback).toHaveBeenLastCalledWith(false);

    desbloquearAudio();
    await Promise.resolve();
    await Promise.resolve();

    expect(callback).toHaveBeenLastCalledWith(true);

    desuscribir();
  });
});
