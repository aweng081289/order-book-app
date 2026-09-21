<template>
  <div>
    <div
      v-if="connectionIssue"
      class="mb-6 flex flex-col gap-3 rounded-lg border border-red-400/50 bg-red-950/40 p-4 text-sm text-red-100 sm:flex-row sm:items-center sm:justify-between"
      role="alert"
    >
      <div>
        <p class="font-semibold">Market-data connection failed</p>
        <p class="mt-1 text-red-200/80">{{ connectionIssue }}</p>
      </div>
      <div class="flex shrink-0 gap-2">
        <button
          type="button"
          class="min-h-11 rounded-md border border-red-300/50 px-3 py-2 font-semibold hover:bg-red-900/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-200"
          @click="retryConnections"
        >
          Retry
        </button>
        <button
          v-if="provider === 'binance'"
          type="button"
          class="min-h-11 rounded-md bg-indigo-500 px-3 py-2 font-semibold text-white hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-200"
          @click="emit('select-provider', 'kraken')"
        >
          Switch to Kraken
        </button>
      </div>
    </div>

    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-bold text-indigo-400">Spot Markets</h2>
        <span v-if="provider === 'binance'" class="text-xs text-gray-400">
          {{ spotVenueLabel }}
        </span>
      </div>
      <span
        class="connection-status"
        :class="`connection-status--${spotConnectionStatus}`"
        role="status"
        aria-live="polite"
        :aria-label="`Spot market connection: ${connectionLabel(spotConnectionStatus)}`"
      >
        {{ connectionLabel(spotConnectionStatus) }}
      </span>
    </div>
    <div class="grid h-full w-full grid-cols-1 gap-4 mb-10 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
      <OrderBookPanel
        v-for="(book, index) in spotBooks"
        :key="`spot-${index}`"
        :book="book"
        :now="now"
        :permanent="index < 2"
        @change-symbol="changeSymbol(index, 'spot', $event)"
      />
    </div>

    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-bold text-indigo-400">Futures Markets</h2>
        <span v-if="provider === 'binance'" class="text-xs text-gray-400">Binance Global</span>
      </div>
      <span
        class="connection-status"
        :class="`connection-status--${futuresConnectionStatus}`"
        role="status"
        aria-live="polite"
        :aria-label="`Futures market connection: ${connectionLabel(futuresConnectionStatus)}`"
      >
        {{ connectionLabel(futuresConnectionStatus) }}
      </span>
    </div>
    <div class="grid h-full w-full grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
      <OrderBookPanel
        v-for="(book, index) in futuresBooks"
        :key="`futures-${index}`"
        :book="book"
        :now="now"
        @change-symbol="changeSymbol(index, 'futures', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import OrderBookPanel from './OrderBookPanel.vue';
import { useBinanceOrderBooks } from '@/composables/useBinanceOrderBooks';
import { useKrakenOrderBooks } from '@/composables/useKrakenOrderBooks';
import { AVAILABLE_PROVIDERS } from '@/services/marketData/providerConfig';

const props = defineProps({
  provider: {
    type: String,
    required: true,
    validator: value => AVAILABLE_PROVIDERS.includes(value)
  },
  depth: {
    type: Number,
    default: 5,
    validator: value => [5, 10, 20].includes(value)
  }
});
const emit = defineEmits(['select-provider']);

const providerAdapters = {
  binance: useBinanceOrderBooks,
  kraken: useKrakenOrderBooks
};
const useOrderBooks = providerAdapters[props.provider];

const {
  spotBooks,
  futuresBooks,
  spotConnectionStatus,
  futuresConnectionStatus,
  spotRegion,
  retryConnections,
  changeSymbol
} = useOrderBooks(props.depth);

const connectionIssue = computed(() => {
  const failedFeeds = [];
  if (spotConnectionStatus.value === 'error') failedFeeds.push('spot');
  if (futuresConnectionStatus.value === 'error') failedFeeds.push('futures');
  if (!failedFeeds.length) return '';

  const providerName = props.provider === 'binance' ? 'Binance' : 'Kraken';
  const feeds = failedFeeds.length === 2 ? 'spot and futures feeds' : `${failedFeeds[0]} feed`;
  return `${providerName} ${feeds} could not connect after several attempts. You can retry without reloading the page.`;
});

const spotVenueLabel = computed(() => {
  if (!spotRegion) return '';
  if (spotRegion.value === 'detecting') return 'Detecting region';
  return spotRegion.value === 'us' ? 'Binance.US' : 'Binance Global';
});

const now = ref(Date.now());
let clockTimer = null;

onMounted(() => {
  clockTimer = setInterval(() => { now.value = Date.now(); }, 1000);
});

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
});

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
