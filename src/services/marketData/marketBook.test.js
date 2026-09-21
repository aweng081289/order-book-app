import { describe, expect, it } from 'vitest';
import {
  applyOrderBookUpdates,
  createMarketBook,
  setMarketTicker,
  setOrderBookSnapshot
} from './marketBook';

describe('normalized market book', () => {
  it('creates an empty provider-neutral book', () => {
    const book = createMarketBook({ symbol: 'BTCUSDT', providerSymbol: 'BTC/USDT' });

    expect(book).toMatchObject({
      symbol: 'BTCUSDT',
      providerSymbol: 'BTC/USDT',
      bids: [],
      asks: [],
      loading: true,
      error: null
    });
  });

  it('normalizes a snapshot and calculates display totals, midpoint, and spread', () => {
    const book = createMarketBook({ symbol: 'BTCUSDT', providerSymbol: 'BTCUSDT' });

    setOrderBookSnapshot(book, {
      bids: [['99', '2'], ['98', '3']],
      asks: [{ price: '101', qty: '1.5' }, { price: '102', quantity: '4' }]
    }, 2);

    expect(book.displayBids).toEqual([
      { price: '99', quantity: '2', total: 2 },
      { price: '98', quantity: '3', total: 5 }
    ]);
    expect(book.displayAsks).toEqual([
      { price: '101', quantity: '1.5', total: 1.5 },
      { price: '102', quantity: '4', total: 5.5 }
    ]);
    expect(book.midPrice).toBe(100);
    expect(book.spread).toBe(2);
    expect(book.spreadPercent).toBe('2.000');
    expect(book.loading).toBe(false);
  });

  it('merges incremental levels, removes zero quantities, and tracks direction', () => {
    const book = createMarketBook({ symbol: 'ETHUSDT', providerSymbol: 'ETHUSDT' });
    setOrderBookSnapshot(book, {
      bids: [['99', '2'], ['98', '3']],
      asks: [['101', '1'], ['102', '2']]
    }, 2);

    applyOrderBookUpdates(book, {
      bids: [['99', '0'], ['100', '4']],
      asks: [['101', '0'], ['103', '5']]
    }, 2, 5);

    expect(book.bids).toEqual([
      { price: '100', quantity: '4' },
      { price: '98', quantity: '3' }
    ]);
    expect(book.asks).toEqual([
      { price: '102', quantity: '2' },
      { price: '103', quantity: '5' }
    ]);
    expect(book.midPrice).toBe(101);
    expect(book.priceDirection).toBe('up');
    expect(book.priceUpdateSequence).toBe(1);
  });

  it('normalizes ticker values without changing the order book', () => {
    const book = createMarketBook({ symbol: 'SOLUSDT', providerSymbol: 'SOLUSDT' });

    setMarketTicker(book, {
      lastPrice: 150.25,
      priceChangePercent: 1.234,
      updatedAt: 123456
    });

    expect(book.lastPrice).toBe('150.25');
    expect(book.priceChangePercent).toBe('1.23');
    expect(book.updatedAt).toBe(123456);
    expect(book.loading).toBe(true);
  });
});
