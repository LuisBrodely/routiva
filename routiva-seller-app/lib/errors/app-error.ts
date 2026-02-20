const NETWORK_ERROR_PATTERNS = [
  'network request failed',
  'failed to fetch',
  'fetch failed',
  'networkerror',
  'socket',
  'timeout',
  'offline',
];

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const value = (error as { message?: unknown }).message;
    if (typeof value === 'string') return value;
  }
  return '';
}

export function isLikelyNetworkError(error: unknown): boolean {
  const message = extractMessage(error).toLowerCase();
  return NETWORK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

export function getErrorMessage(error: unknown, fallback = 'No se pudo completar la operación.'): string {
  const message = extractMessage(error);
  if (!message) return fallback;

  if (isLikelyNetworkError(error)) {
    return 'Sin conexión o red inestable. Verifica internet e intenta de nuevo.';
  }

  if (message.toLowerCase().includes('no se otorgo permiso de ubicacion')) {
    return 'Permiso de ubicación denegado. Actívalo para continuar.';
  }

  if (message.toLowerCase().includes('segundo plano')) {
    return 'Permiso de ubicación en segundo plano denegado. Actívalo para tracking continuo.';
  }

  return message;
}
