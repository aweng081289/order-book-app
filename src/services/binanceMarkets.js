import axios from 'axios';

export const BINANCE_GLOBAL_SPOT_WS = 'wss://stream.binance.com:9443/stream';
export const BINANCE_US_SPOT_WS = 'wss://stream.binance.us:9443/stream';
export const BINANCE_FUTURES_WS = 'wss://fstream.binance.com/stream';

const BINANCE_GLOBAL_SPOT_MARKETS_URL = 'https://data-api.binance.vision/api/v3/exchangeInfo';
const BINANCE_US_SPOT_MARKETS_URL = 'https://api.binance.us/api/v3/exchangeInfo';
const BINANCE_FUTURES_MARKETS_URL = 'https://fapi.binance.com/fapi/v1/exchangeInfo';

const DEFAULT_SPOT_SYMBOLS = [
  'BTCUSDT', 'ETHBTC', 'ETHUSDT', 'XRPBTC',
  'SOLUSDT', 'XRPUSDT', 'ADABTC', 'ADAUSDT'
];
const DEFAULT_FUTURES_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'SOLUSDT'];

function compactSymbol(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function addMarket(catalog, symbol) {
  const normalized = compactSymbol(symbol);
  catalog.set(normalized, { displaySymbol: normalized, providerSymbol: normalized });
}

function createFallbackCatalog(symbols) {
  const catalog = new Map();
  for (const symbol of symbols) addMarket(catalog, symbol);
  return catalog;
}

async function loadCatalog(url, fallbackSymbols, marketFilter, label) {
  const catalog = createFallbackCatalog(fallbackSymbols);
  try {
    const response = await axios.get(url);
    for (const market of response.data.symbols || []) {
      if (marketFilter(market)) addMarket(catalog, market.symbol);
    }
  } catch (error) {
    console.warn(`Binance ${label} catalog unavailable; using built-in markets.`, error);
  }
  return catalog;
}

export async function detectBinanceSpotRegion() {
  try {
    const response = await axios.get('/api/region', {
      headers: { Accept: 'application/json' },
      timeout: 3000
    });
    const country = response.data?.country;
    if (country === 'US') return 'us';
    if (/^[A-Z]{2}$/.test(country || '')) return 'global';
    return import.meta.env.DEV ? 'us' : 'global';
  } catch {
    return import.meta.env.DEV ? 'us' : 'global';
  }
}

export function getBinanceSpotWebSocket(region) {
  return region === 'us' ? BINANCE_US_SPOT_WS : BINANCE_GLOBAL_SPOT_WS;
}

export async function loadBinanceMarketCatalogs(spotRegion = 'global') {
  const [spot, futures] = await Promise.all([
    loadCatalog(
      spotRegion === 'us' ? BINANCE_US_SPOT_MARKETS_URL : BINANCE_GLOBAL_SPOT_MARKETS_URL,
      DEFAULT_SPOT_SYMBOLS,
      market => market.status === 'TRADING' && market.isSpotTradingAllowed !== false,
      'spot'
    ),
    loadCatalog(
      BINANCE_FUTURES_MARKETS_URL,
      DEFAULT_FUTURES_SYMBOLS,
      market => market.status === 'TRADING' && market.contractType === 'PERPETUAL',
      'futures'
    )
  ]);
  return { spot, futures };
}

export function resolveBinanceMarket(value, catalog) {
  return catalog.get(compactSymbol(value)) || null;
}
