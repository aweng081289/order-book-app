<template>
  <div>
    <div class="mb-6 flex justify-end">
      <div
        class="inline-flex rounded-lg border border-indigo-400/40 bg-gray-900/70 p-1"
        role="group"
        aria-label="Market-data provider"
      >
        <button
          v-for="provider in AVAILABLE_PROVIDERS"
          :key="provider"
          type="button"
          class="rounded-md px-4 py-2 text-sm font-semibold capitalize transition-colors"
          :class="selectedProvider === provider
            ? 'bg-indigo-500 text-white shadow'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'"
          :aria-pressed="selectedProvider === provider"
          @click="selectProvider(provider)"
        >
          {{ provider }}
        </button>
      </div>
    </div>

    <ProviderOrderBooks
      :key="selectedProvider"
      :provider="selectedProvider"
      :depth="depth"
      @select-provider="selectProvider"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ProviderOrderBooks from './ProviderOrderBooks.vue';
import {
  AVAILABLE_PROVIDERS,
  PREFERRED_PROVIDER,
  resolveProvider
} from '@/services/marketData/providerConfig';

defineProps({
  depth: {
    type: Number,
    default: 5,
    validator: value => [5, 10, 20].includes(value)
  }
});

const STORAGE_KEY = 'market-data-provider';
const savedProvider = window.localStorage.getItem(STORAGE_KEY);
const selectedProvider = ref(resolveProvider(savedProvider || PREFERRED_PROVIDER));

function selectProvider(provider) {
  if (provider === selectedProvider.value) return;
  selectedProvider.value = resolveProvider(provider);
  window.localStorage.setItem(STORAGE_KEY, selectedProvider.value);
}
</script>
