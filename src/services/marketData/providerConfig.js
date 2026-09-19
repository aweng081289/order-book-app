export const PREFERRED_PROVIDER = 'binance';
export const CURRENT_RUNTIME_PROVIDER = 'kraken';

export function resolveProvider(preferredProvider = PREFERRED_PROVIDER) {
  return preferredProvider === CURRENT_RUNTIME_PROVIDER ? preferredProvider : CURRENT_RUNTIME_PROVIDER;
}
