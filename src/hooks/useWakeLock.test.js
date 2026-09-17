import { renderHook } from '@testing-library/react';
import { useWakeLock } from './useWakeLock';

function mockWakeLock() {
  const release = jest.fn().mockResolvedValue();
  const addEventListener = jest.fn();
  const request = jest.fn().mockResolvedValue({ release, addEventListener });
  Object.defineProperty(navigator, 'wakeLock', {
    value: { request },
    configurable: true,
  });
  return { request, release, addEventListener };
}

function setVisibility(valor) {
  Object.defineProperty(document, 'visibilityState', {
    value: valor,
    configurable: true,
  });
}

describe('useWakeLock', () => {
  afterEach(() => {
    delete navigator.wakeLock;
    setVisibility('visible');
    jest.restoreAllMocks();
  });

  test('pide el wake lock al montar', async () => {
    const { request } = mockWakeLock();
    renderHook(() => useWakeLock());
    await Promise.resolve();
    await Promise.resolve();
    expect(request).toHaveBeenCalledWith('screen');
  });

  test('libera el wake lock al desmontar', async () => {
    const { release } = mockWakeLock();
    const { unmount } = renderHook(() => useWakeLock());
    await Promise.resolve();
    await Promise.resolve();
    unmount();
    expect(release).toHaveBeenCalled();
  });

  test('vuelve a pedir el wake lock al volver a visible', async () => {
    const { request } = mockWakeLock();
    setVisibility('hidden');
    renderHook(() => useWakeLock());
    await Promise.resolve();
    await Promise.resolve();
    expect(request).not.toHaveBeenCalled();

    setVisibility('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    await Promise.resolve();
    expect(request).toHaveBeenCalledWith('screen');
  });

  test('no explota si navigator.wakeLock no existe', () => {
    delete navigator.wakeLock;
    expect(() => renderHook(() => useWakeLock())).not.toThrow();
  });

  test('no pide el lock si activo es false', async () => {
    const { request } = mockWakeLock();
    renderHook(() => useWakeLock(false));
    await Promise.resolve();
    await Promise.resolve();
    expect(request).not.toHaveBeenCalled();
  });
});
