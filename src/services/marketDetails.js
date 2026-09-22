import axios from 'axios';

const TIMEFRAMES = {
  '1h': { binance: '1h', krakenSpot: 60, krakenFutures: '1h', hours: 72 },
  '4h': { binance: '4h', krakenSpot: 240, krakenFutures: '4h', hours: 240 },
  '1d': { binance: '1d', krakenSpot: 1440, krakenFutures: '1d', hours: 1440 }
};

export async function loadMarketCandles({ provider, marketType, providerSymbol, timeframe, spotRegion }) {
  const frame = TIMEFRAMES[timeframe] || TIMEFRAMES['1h'];
  if (provider === 'binance') {
    const url = marketType === 'futures'
      ? 'https://fapi.binance.com/fapi/v1/klines'
      : spotRegion === 'us'
        ? 'https://api.binance.us/api/v3/klines'
        : 'https://data-api.binance.vision/api/v3/klines';
    const { data } = await axios.get(url, {
      params: { symbol: providerSymbol, interval: frame.binance, limit: 72 },
      timeout: 8000
    });
    return data.map(candle => normalizeCandle({
      timestamp: candle[0], open: candle[1], high: candle[2], low: candle[3], close: candle[4], volume: candle[5]
    }));
  }

  if (marketType === 'futures') {
    const { data } = await axios.get(
      `https://futures.kraken.com/api/charts/v1/trade/${encodeURIComponent(providerSymbol)}/${frame.krakenFutures}`,
      { params: { count: 72 }, timeout: 8000 }
    );
    return (data.candles || []).map(normalizeCandle);
  }

  const since = Math.floor((Date.now() - frame.hours * 60 * 60 * 1000) / 1000);
  const { data } = await axios.get('https://api.kraken.com/0/public/OHLC', {
    params: { pair: providerSymbol, interval: frame.krakenSpot, since },
    timeout: 8000
  });
  if (data.error?.length) throw new Error(data.error.join(', '));
  const rows = Object.entries(data.result || {}).find(([key]) => key !== 'last')?.[1] || [];
  return rows.slice(-72).map(candle => normalizeCandle({
    timestamp: candle[0] * 1000,
    open: candle[1], high: candle[2], low: candle[3], close: candle[4], volume: candle[6]
  }));
}

export async function loadMarketNews(asset) {
  const { data } = await axios.get('/api/market-news', { params: { asset }, timeout: 10000 });
  return data.articles || [];
}

export async function loadAiInsight(payload) {
  const { data } = await axios.post('/api/market-insights', payload, { timeout: 60000 });
  return data;
}

export function getBaseAsset(symbol) {
  const compact = String(symbol).toUpperCase().replace(/[^A-Z0-9]/g, '');
  for (const quote of ['USDT', 'USDC', 'USD', 'EUR', 'BTC']) {
    if (compact.endsWith(quote) && compact.length > quote.length) return compact.slice(0, -quote.length);
  }
  return compact;
}

export function calculateMarketMetrics(book, candles) {
  const closes = candles.map(item => item.close).filter(Number.isFinite);
  const highs = candles.map(item => item.high).filter(Number.isFinite);
  const lows = candles.map(item => item.low).filter(Number.isFinite);
  const first = closes[0];
  const last = closes.at(-1);
  const rangeBase = Math.min(...lows);
  const changes = closes.slice(1).map((close, index) => Math.abs((close - closes[index]) / closes[index]) * 100);
  const bidDepth = (book.displayBids || []).reduce((sum, level) => sum + Number(level.quantity), 0);
  const askDepth = (book.displayAsks || []).reduce((sum, level) => sum + Number(level.quantity), 0);
  const totalDepth = bidDepth + askDepth;
  const trendChange = first ? ((last - first) / first) * 100 : 0;

  return {
    lastPrice: Number(book.lastPrice || book.midPrice || last),
    priceChangePercent: nullableNumber(book.priceChangePercent),
    rangePercent: rangeBase ? ((Math.max(...highs) - rangeBase) / rangeBase) * 100 : null,
    volatilityPercent: changes.length ? changes.reduce((sum, value) => sum + value, 0) / changes.length : null,
    spreadPercent: nullableNumber(book.spreadPercent),
    bookImbalancePercent: totalDepth ? (bidDepth / totalDepth) * 100 : null,
    trend: trendChange > 0.5 ? 'upward' : trendChange < -0.5 ? 'downward' : 'sideways'
  };
}

function normalizeCandle(candle) {
  return {
    timestamp: Number(candle.timestamp ?? candle.time),
    open: Number(candle.open),
    high: Number(candle.high),
    low: Number(candle.low),
    close: Number(candle.close),
    volume: Number(candle.volume)
  };
}

function nullableNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
