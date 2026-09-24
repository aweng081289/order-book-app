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
      code: 'UNAVAILABLE',
      error: 'The AI integration reached Gemini successfully, but the model returned 503 Service Unavailable because it is temporarily overloaded.',
      provider: 'Gemini',
      providerStatus: 503
    } } });
    const book = createMarketBook({ symbol: 'BTCUSDT', providerSymbol: 'BTCUSDT' });
    book.lastPrice = '104';
    const wrapper = mount(MarketDetailsModal, {
      props: { book, provider: 'binance', marketType: 'spot', spotRegion: 'us' }
    });
    await flushPromises();
    expect(wrapper.text()).toContain('Gemini is temporarily overloaded');
    expect(wrapper.text()).toContain('integration reached Gemini successfully');
    expect(wrapper.text()).toContain('Provider: Gemini · Status: 503 UNAVAILABLE');
    expect(wrapper.text()).toContain('Retry brief');
    wrapper.unmount();
  });

  it('shows a distinct Gemini rate-limit error', async () => {
    loadAiInsight.mockRejectedValueOnce({ response: { data: {
      code: 'RATE_LIMITED',
      error: 'Gemini returned 429 Too Many Requests. Its rate limit or usage quota has been reached.',
      provider: 'Gemini',
      providerStatus: 429
    } } });
    const book = createMarketBook({ symbol: 'BTCUSDT', providerSymbol: 'BTCUSDT' });
    book.lastPrice = '104';
    const wrapper = mount(MarketDetailsModal, {
      props: { book, provider: 'binance', marketType: 'spot', spotRegion: 'us' }
    });
    await flushPromises();
    expect(wrapper.text()).toContain('Gemini rate limit reached');
    expect(wrapper.text()).toContain('Provider: Gemini · Status: 429 RATE_LIMITED');
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
    expect(wrapper.text()).toContain('Powered by Gemini · Free API tier');
    expect(wrapper.text()).toContain("Portfolio demonstration using Gemini's free API access");
    expect(wrapper.text()).toContain('Momentum is positive.');
    expect(wrapper.find('svg').exists()).toBe(true);

    await wrapper.trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('close')).toHaveLength(1);
    wrapper.unmount();
  });
});
