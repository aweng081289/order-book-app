import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import OrderBook from './OrderBook.vue';

describe('OrderBook provider selection', () => {
  beforeEach(() => window.localStorage.clear());

  it('uses Binance by default', () => {
    const wrapper = shallowMount(OrderBook);

    expect(wrapper.get('button[aria-pressed="true"]').text()).toBe('binance');
    expect(wrapper.getComponent({ name: 'ProviderOrderBooks' }).props('provider')).toBe('binance');
  });

  it('switches providers and saves the visitor choice', async () => {
    const wrapper = shallowMount(OrderBook);
    const krakenButton = wrapper.findAll('button').find(button => button.text() === 'kraken');

    await krakenButton.trigger('click');

    expect(wrapper.getComponent({ name: 'ProviderOrderBooks' }).props('provider')).toBe('kraken');
    expect(window.localStorage.getItem('market-data-provider')).toBe('kraken');
  });

  it('restores a saved provider choice', () => {
    window.localStorage.setItem('market-data-provider', 'kraken');

    const wrapper = shallowMount(OrderBook);

    expect(wrapper.getComponent({ name: 'ProviderOrderBooks' }).props('provider')).toBe('kraken');
  });
});
