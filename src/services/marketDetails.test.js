import { describe, expect, it } from 'vitest';
import { calculateMarketMetrics, getBaseAsset } from './marketDetails';

describe('market details helpers', () => {
  it('extracts the base asset from spot and futures symbols', () => {
    expect(getBaseAsset('ETHBTC')).toBe('ETH');
    expect(getBaseAsset('SOLUSDT')).toBe('SOL');
    expect(getBaseAsset('XRPUSD')).toBe('XRP');
  });

  it('calculates grounded chart and order-book metrics', () => {
    const metrics = calculateMarketMetrics({
      lastPrice: '105',
      priceChangePercent: '2.50',
      spreadPercent: '0.10',
      displayBids: [{ quantity: '6' }],
      displayAsks: [{ quantity: '4' }]
    }, [
      { open: 100, high: 102, low: 99, close: 101 },
      { open: 101, high: 106, low: 100, close: 105 }
    ]);

    expect(metrics.trend).toBe('upward');
    expect(metrics.bookImbalancePercent).toBe(60);
    expect(metrics.rangePercent).toBeCloseTo(7.07, 1);
    expect(metrics.lastPrice).toBe(105);
  });
});
