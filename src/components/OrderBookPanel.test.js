import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import OrderBookPanel from './OrderBookPanel.vue';
import { createMarketBook } from '@/services/marketData/marketBook';

function createBook(symbol = 'XRPUSD') {
  return createMarketBook({ symbol, providerSymbol: symbol });
}

describe('OrderBookPanel', () => {
  it('shows a small change label and emits compact edited symbols', async () => {
    const wrapper = mount(OrderBookPanel, {
      props: { book: createBook(), now: Date.now() }
    });

    const changeButton = wrapper.get('button[aria-label="Change XRPUSD market"]');
    expect(changeButton.text()).toContain('change');

    await changeButton.trigger('click');
    const input = wrapper.get('input[aria-label="Market symbol"]');
    await input.setValue('solusdt');
    await input.trigger('blur');

    expect(wrapper.emitted('change-symbol')).toEqual([['SOLUSDT']]);
  });

  it('marks permanent markets as fixed while allowing details to open', async () => {
    const wrapper = mount(OrderBookPanel, {
      props: { book: createBook('BTCUSDT'), now: Date.now(), permanent: true }
    });

    const detailsButton = wrapper.get('button[aria-label="View BTCUSDT market details"]');
    expect(wrapper.text()).toContain('fixed');
    expect(wrapper.find('button[aria-label="Change BTCUSDT market"]').exists()).toBe(false);
    await detailsButton.trigger('click');
    expect(wrapper.emitted('view-market')).toHaveLength(1);
    expect(wrapper.find('input[aria-label="Market symbol"]').exists()).toBe(false);
  });

  it('shows when normalized market data was updated', () => {
    const book = createBook();
    book.updatedAt = 10_000;
    book.lastPrice = '2.50';
    book.loading = false;

    const wrapper = mount(OrderBookPanel, {
      props: { book, now: 13_000 }
    });

    expect(wrapper.text()).toContain('Updated 3s ago');
  });
});
