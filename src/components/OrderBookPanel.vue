<template>
  <div
    class="book-panel flex h-full min-h-[370px] flex-col items-center rounded-xl bg-gray-800/70 p-4 shadow-xl"
    :class="{ 'border-2 border-indigo-400 !bg-gray-700/90': editing }"
  >
    <div class="relative mx-auto mb-2 w-full max-w-xs">
      <input
        v-if="editing"
        ref="editInput"
        v-model="editSymbol"
        type="text"
        class="no-box"
        spellcheck="false"
        autocomplete="off"
        aria-label="Market symbol"
        @keyup.enter="finishEditing"
        @blur="saveSymbol"
        @keyup.escape="cancelEditing"
      />
      <div v-else class="relative mb-1 flex min-h-7 items-baseline justify-center gap-2">
        <button
          type="button"
          class="group inline-flex items-baseline gap-1.5 uppercase tracking-wide"
          :class="permanent ? 'cursor-default text-indigo-400' : 'cursor-pointer text-indigo-300 hover:text-indigo-200'"
          :disabled="permanent"
          :aria-label="permanent ? `${book.symbol}, fixed market` : `Change ${book.symbol} market`"
          @click="startEditing"
        >
          <span class="text-xl font-bold">{{ book.symbol }}</span>
          <span
            class="text-[10px] font-medium lowercase tracking-normal"
            :class="permanent ? 'text-gray-500' : 'text-indigo-400 group-hover:text-indigo-300'"
          >
            {{ permanent ? 'fixed' : 'change' }}
          </span>
        </button>
        <span
          v-if="book.priceChangePercent !== null"
          class="text-sm font-normal"
          :class="{ 'text-green-400': book.priceChangePercent > 0, 'text-red-400': book.priceChangePercent < 0 }"
        >
          {{ book.priceChangePercent > 0 ? '+' : '' }}{{ book.priceChangePercent }}%
        </span>
        <span v-if="book.error" class="absolute right-0 top-0 block text-xs text-red-400">
          {{ book.error }}
        </span>
      </div>
    </div>

    <div class="orderbook-table-container w-full max-w-xs rounded-lg bg-gray-900/80 p-1 pb-2 shadow">
      <table class="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th class="p-2 text-right text-gray-400">Price</th>
            <th class="p-2 text-right text-gray-400">Amount</th>
            <th class="p-2 text-right text-gray-400">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ask, index) in [...book.displayAsks].reverse()" :key="`ask-${ask.price}-${index}`">
            <td class="p-2 text-right font-bold text-red-400">{{ formatNumber(ask.price) }}</td>
            <td class="p-2 text-right">{{ formatNumber(ask.quantity) }}</td>
            <td class="p-2 text-right">{{ formatNumber(ask.total) }}</td>
          </tr>
          <tr v-if="book.midPrice || book.lastPrice" class="bg-gray-900/90">
            <td colspan="3" class="p-2 text-center">
              <div
                :key="book.priceUpdateSequence"
                class="mid-price text-base font-semibold text-green-300"
                :class="book.priceDirection ? `mid-price--${book.priceDirection}` : ''"
              >
                {{ formatNumber(book.midPrice || book.lastPrice) }}
              </div>
              <div class="mt-1 text-[10px] text-gray-400">
                <span v-if="book.lastPrice">Last {{ formatNumber(book.lastPrice) }}</span>
                <span v-if="book.spread !== null">
                  <span v-if="book.lastPrice"> · </span>Spread {{ formatNumber(book.spread) }} ({{ book.spreadPercent }}%)
                </span>
              </div>
              <div class="mt-1 text-[10px]" :class="lastUpdatedClass">
                {{ lastUpdatedLabel }}
              </div>
            </td>
          </tr>
          <tr v-for="(bid, index) in book.displayBids" :key="`bid-${bid.price}-${index}`">
            <td class="p-2 text-right font-bold text-green-400">{{ formatNumber(bid.price) }}</td>
            <td class="p-2 text-right">{{ formatNumber(bid.quantity) }}</td>
            <td class="p-2 text-right">{{ formatNumber(bid.total) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="book.loading" class="py-6 text-center text-indigo-400">
        <span class="loading-spinner inline-block"></span> Connecting...
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue';

const props = defineProps({
  book: { type: Object, required: true },
  now: { type: Number, required: true },
  permanent: { type: Boolean, default: false }
});
const emit = defineEmits(['change-symbol']);

const editing = ref(false);
const editSymbol = ref('');
const editInput = ref(null);

const updateAgeSeconds = computed(() => {
  if (!props.book.updatedAt) return null;
  const timestamp = typeof props.book.updatedAt === 'number'
    ? props.book.updatedAt
    : Date.parse(props.book.updatedAt);
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, Math.floor((props.now - timestamp) / 1000));
});
const lastUpdatedLabel = computed(() => {
  if (updateAgeSeconds.value === null) return 'Waiting for market data';
  if (updateAgeSeconds.value < 2) return 'Updated now';
  if (updateAgeSeconds.value < 60) return `Updated ${updateAgeSeconds.value}s ago`;
  return `Updated ${Math.floor(updateAgeSeconds.value / 60)}m ago`;
});
const lastUpdatedClass = computed(() =>
  updateAgeSeconds.value !== null && updateAgeSeconds.value < 5
    ? 'text-green-400/80'
    : 'text-gray-500'
);

function startEditing() {
  if (props.permanent) return;
  editSymbol.value = props.book.symbol;
  editing.value = true;
  nextTick(() => {
    editInput.value?.focus();
    editInput.value?.select();
  });
}

function finishEditing() {
  editInput.value?.blur();
}

function cancelEditing() {
  editing.value = false;
}

function saveSymbol() {
  if (!editing.value) return;
  editing.value = false;
  const symbol = editSymbol.value.trim().toUpperCase();
  if (symbol && symbol !== props.book.symbol) emit('change-symbol', symbol);
}

function formatNumber(number) {
  if (!number) return '0';
  const value = Number(number);
  if (!Number.isFinite(value) || value === 0) return '0';
  let decimals = 5;
  if (Math.abs(value) < 0.0001) decimals = 16;
  else if (Math.abs(value) < 1) decimals = 8;
  return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}
</script>

<style scoped>
.book-panel { transition: all 0.15s ease; }
.mid-price--up { animation: price-up 0.55s ease-out; }
.mid-price--down { animation: price-down 0.55s ease-out; }
.orderbook-table-container { box-shadow: 0 4px 12px #0004; }
input[type="text"].no-box {
  background: transparent !important; border: none !important; outline: none !important;
  box-shadow: none !important; caret-color: #818cf8; text-align: center;
  font-size: 1.25rem; font-weight: bold; text-transform: uppercase;
  color: #818cf8; letter-spacing: 0.1em; margin-bottom: 1rem; width: 100%;
}
input[type="text"].no-box:focus { outline: none !important; box-shadow: none !important; border: none !important; }
.loading-spinner {
  border: 4px solid #dbeafe; border-top: 4px solid #6366f1; border-radius: 50%;
  width: 28px; height: 28px; animation: spin 1.1s linear infinite;
  display: inline-block; vertical-align: middle;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes price-up {
  0% { background-color: rgb(34 197 94 / 35%); transform: scale(1.05); }
  100% { background-color: transparent; transform: scale(1); }
}
@keyframes price-down {
  0% { background-color: rgb(248 113 113 / 35%); transform: scale(1.05); }
  100% { background-color: transparent; transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .mid-price--up, .mid-price--down { animation: none; }
}
</style>
