import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import MarketDetailsModal from './MarketDetailsModal.vue';
import { createMarketBook } from '@/services/marketData/marketBook';
import { loadAiInsight } from '@/services/marketDetails';

vi.mock('@/services/marketDetails', async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    loadMarketCandles: vi.fn().mockResolvedValue([
      { timestamp: 1, open: 100, high: 103, low: 99, close: 102, volume: 10 },
      { timestamp: 2, open: 102, high: 105, low: 101, close: 104, volume: 12 }
    ]),
    loadMarketNews: vi.fn().mockResolvedValue([]),
    loadAiInsight: vi.fn().mockResolvedValue({
      insight: {
        outlook: 'bullish',
        summary: 'Momentum is positive.',
        signals: ['Price trend is upward.', 'Bid depth is supportive.'],
        risk: 'Volatility remains elevated.',
        wittyTake: 'The bulls remembered their running shoes.'
      }
    })
  };
});

describe('MarketDetailsModal', () => {
  it('shows the actionable Gemini error returned by the server', async () => {
    loadAiInsight.mockRejectedValueOnce({ response: { data: {
      code: 'UNAVAILABLE', error: 'Gemini is temporarily busy or unavailable. Please try again shortly.'
    } } });
    const book = createMarketBook({ symbol: 'BTCUSDT', providerSymbol: 'BTCUSDT' });
    book.lastPrice = '104';
    const wrapper = mount(MarketDetailsModal, {
      props: { book, provider: 'binance', marketType: 'spot', spotRegion: 'us' }
    });
    await flushPromises();
    expect(wrapper.text()).toContain('Gemini is temporarily busy or unavailable.');
    expect(wrapper.text()).toContain('Retry brief');
    wrapper.unmount();
  });
  it('loads the chart and visible AI brief, and closes with Escape', async () => {
    const book = createMarketBook({ symbol: 'BTCUSDT', providerSymbol: 'BTCUSDT' });
    book.lastPrice = '104';
    book.priceChangePercent = '2.5';
    const wrapper = mount(MarketDetailsModal, {
      attachTo: document.body,
      props: { book, provider: 'binance', marketType: 'spot', spotRegion: 'us' }
    });

    await flushPromises();
    expect(wrapper.text()).toContain('AI Market Brief');
    expect(wrapper.text()).toContain('Momentum is positive.');
    expect(wrapper.find('svg').exists()).toBe(true);

    await wrapper.trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('close')).toHaveLength(1);
    wrapper.unmount();
  });
});
