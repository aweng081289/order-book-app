import { describe, expect, it } from 'vitest';
import {
  getBinanceDefaultSpotSymbols,
  getBinanceSpotWebSocket,
  resolveBinanceMarket
} from '../binanceMarkets';
import { resolveKrakenMarket } from '../krakenMarkets';

describe('Binance market resolution', () => {
  it('uses region-aware default spot markets', () => {
    const globalMarkets = getBinanceDefaultSpotSymbols('global');
    const usMarkets = getBinanceDefaultSpotSymbols('us');

    expect(globalMarkets).toContain('XRPBTC');
    expect(globalMarkets).not.toContain('XRPUSD');
    expect(usMarkets).toContain('XRPUSD');
    expect(usMarkets).not.toContain('XRPBTC');
    expect(usMarkets.slice(0, 2)).toEqual(['BTCUSDT', 'ETHBTC']);
  });

  it('selects the correct regional spot WebSocket', () => {
    expect(getBinanceSpotWebSocket('us')).toContain('stream.binance.us');
    expect(getBinanceSpotWebSocket('global')).toContain('stream.binance.com');
  });

  it('accepts compact or separated input against a Binance catalog', () => {
    const market = { displaySymbol: 'XRPUSDT', providerSymbol: 'XRPUSDT' };
    const catalog = new Map([['XRPUSDT', market]]);

    expect(resolveBinanceMarket('xrp/usdt', catalog)).toBe(market);
    expect(resolveBinanceMarket('not-a-market', catalog)).toBeNull();
  });
});

describe('Kraken market resolution', () => {
  it('normalizes BTC aliases to Kraken XBT catalog keys', () => {
    const market = { displaySymbol: 'ETHBTC', providerSymbol: 'ETH/BTC' };
    const catalog = new Map([['ETHXBT', market]]);

    expect(resolveKrakenMarket('ETHBTC', catalog)).toBe(market);
    expect(resolveKrakenMarket('eth/btc', catalog)).toBe(market);
    expect(resolveKrakenMarket('ETHUSD', catalog)).toBeNull();
  });
});
