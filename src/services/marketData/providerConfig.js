export const PREFERRED_PROVIDER = 'binance';
export const CURRENT_RUNTIME_PROVIDER = 'binance';
export const AVAILABLE_PROVIDERS = ['binance', 'kraken'];

export function resolveProvider(preferredProvider = PREFERRED_PROVIDER) {
  return AVAILABLE_PROVIDERS.includes(preferredProvider) ? preferredProvider : CURRENT_RUNTIME_PROVIDER;
}
