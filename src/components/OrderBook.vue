<template>
  <div>
    <div class="mb-4 flex items-center justify-between gap-3">
      <h2 class="text-xl font-bold text-indigo-400">Spot Markets</h2>
      <span class="connection-status" :class="`connection-status--${spotConnectionStatus}`">
        {{ connectionLabel(spotConnectionStatus) }}
      </span>
    </div>
    <div class="grid h-full w-full grid-cols-1 gap-4 mb-10 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
      <OrderBookPanel
        v-for="(book, index) in spotBooks"
        :key="`spot-${index}`"
        :book="book"
        :permanent="index < 2"
        @change-symbol="changeSymbol(index, 'spot', $event)"
      />
    </div>

    <div class="mb-4 flex items-center justify-between gap-3">
      <h2 class="text-xl font-bold text-indigo-400">Futures Markets</h2>
      <span class="connection-status" :class="`connection-status--${futuresConnectionStatus}`">
        {{ connectionLabel(futuresConnectionStatus) }}
      </span>
    </div>
    <div class="grid h-full w-full grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
      <OrderBookPanel
        v-for="(book, index) in futuresBooks"
        :key="`futures-${index}`"
        :book="book"
        @change-symbol="changeSymbol(index, 'futures', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import OrderBookPanel from './OrderBookPanel.vue';
import { useKrakenOrderBooks } from '@/composables/useKrakenOrderBooks';
import { PREFERRED_PROVIDER, resolveProvider } from '@/services/marketData/providerConfig';

const props = defineProps({
  depth: {
    type: Number,
    default: 5,
    validator: value => [5, 10, 20].includes(value)
  }
});

// Binance is the preferred provider. Kraken remains the runtime fallback until
// the Binance adapter and exchange selector are implemented.
const runtimeProvider = resolveProvider(PREFERRED_PROVIDER);
if (runtimeProvider !== 'kraken') throw new Error(`Unsupported runtime provider: ${runtimeProvider}`);

const {
  spotBooks,
  futuresBooks,
  spotConnectionStatus,
  futuresConnectionStatus,
  changeSymbol
} = useKrakenOrderBooks(props.depth);

function connectionLabel(status) {
  return {
    idle: 'Not connected',
    connecting: 'Connecting',
    connected: 'Live',
    reconnecting: 'Reconnecting',
    error: 'Connection issue'
  }[status] || 'Not connected';
}
</script>

<style scoped>
.connection-status {
  border: 1px solid currentColor; border-radius: 9999px; padding: 0.15rem 0.55rem;
  font-size: 0.7rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
}
.connection-status--connected { color: #4ade80; }
.connection-status--connecting, .connection-status--reconnecting { color: #facc15; }
.connection-status--error { color: #f87171; }
.connection-status--idle { color: #9ca3af; }
</style>
