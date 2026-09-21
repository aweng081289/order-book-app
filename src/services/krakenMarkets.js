import axios from 'axios';

export const KRAKEN_SPOT_WS = 'wss://ws.kraken.com/v2';
export const KRAKEN_FUTURES_WS = 'wss://futures.kraken.com/ws/v1';

const KRAKEN_SPOT_PAIRS_URL = 'https://api.kraken.com/0/public/AssetPairs';
const KRAKEN_FUTURES_INSTRUMENTS_URL = 'https://futures.kraken.com/derivatives/api/v3/instruments';

function compactSymbol(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').replaceAll('BTC', 'XBT');
}

function displaySymbol(value) {
  return value.replaceAll('XBT', 'BTC').replace(/[^A-Z0-9]/g, '');
}

function addMarket(catalog, market, ...aliases) {
  for (const alias of aliases) catalog.set(compactSymbol(alias), market);
}


function createFallbackCatalogs() {
  const spot = new Map();
  const futures = new Map();

  for (const [display, provider] of [
    ['BTCUSDT', 'BTC/USDT'], ['ETHBTC', 'ETH/BTC'], ['ETHUSDT', 'ETH/USDT'],
    ['XRPBTC', 'XRP/BTC'], ['SOLUSDT', 'SOL/USDT'], ['XRPUSDT', 'XRP/USDT'],
    ['ADABTC', 'ADA/BTC'], ['ADAUSDT', 'ADA/USDT']
  ]) {
    addMarket(spot, { displaySymbol: display, providerSymbol: provider }, display, provider);
  }

  for (const [display, provider] of [
    ['BTCUSD', 'PF_XBTUSD'], ['ETHUSD', 'PF_ETHUSD'],
    ['XRPUSD', 'PF_XRPUSD'], ['SOLUSD', 'PF_SOLUSD']
  ]) {
    addMarket(futures, { displaySymbol: display, providerSymbol: provider }, display, provider);
  }

  return { spot, futures };
}


export async function loadKrakenMarketCatalogs() {
  const catalogs = createFallbackCatalogs();
  const [spotResult, futuresResult] = await Promise.allSettled([
    axios.get(KRAKEN_SPOT_PAIRS_URL, { timeout: 8000 }),
    axios.get(KRAKEN_FUTURES_INSTRUMENTS_URL, { timeout: 8000 })
  ]);

  if (spotResult.status === 'fulfilled') {
    for (const pair of Object.values(spotResult.value.data.result || {})) {
      if (!pair.wsname || pair.status !== 'online') continue;
      const market = {
        displaySymbol: displaySymbol(pair.wsname),
        providerSymbol: pair.wsname.replaceAll('XBT', 'BTC')
      };
      addMarket(catalogs.spot, market, pair.wsname, pair.altname);
    }
  } else {
    console.warn('Kraken spot catalog unavailable; using built-in markets.', spotResult.reason);
  }

  if (futuresResult.status === 'fulfilled') {
    for (const instrument of futuresResult.value.data.instruments || []) {
      if (!instrument.tradeable || !instrument.symbol.startsWith('PF_')) continue;
      const market = {
        displaySymbol: displaySymbol(instrument.pair),
        providerSymbol: instrument.symbol
      };
      addMarket(catalogs.futures, market, instrument.pair, instrument.symbol.replace(/^PF_/, ''));
    }
  } else {
    console.warn('Kraken futures catalog unavailable; using built-in markets.', futuresResult.reason);
  }

  return catalogs;
}

export function resolveKrakenMarket(value, catalog) {
  return catalog.get(compactSymbol(value)) || null;
}
