<template>
  <div
    class="fixed inset-0 z-50 overflow-y-auto bg-gray-950/80 p-4 backdrop-blur-sm sm:p-8"
    role="presentation"
    @click.self="close"
  >
    <section
      class="mx-auto my-4 w-full max-w-4xl overflow-hidden rounded-2xl border border-indigo-300/20 bg-gray-900 shadow-2xl shadow-black/60 sm:my-10"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`${view}-title`"
    >
      <header class="flex items-center justify-between border-b border-gray-700/80 px-5 py-4 sm:px-8">
        <nav class="flex gap-1" aria-label="Project information">
          <button
            v-for="item in views"
            :key="item.id"
            type="button"
            class="rounded-md px-3 py-2 text-sm font-semibold transition-colors"
            :class="view === item.id ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'"
            @click="emit('change-view', item.id)"
          >
            {{ item.label }}
          </button>
        </nav>
        <button
          ref="closeButton"
          type="button"
          class="rounded-md px-3 py-2 text-xl leading-none text-gray-400 hover:bg-gray-800 hover:text-white"
          aria-label="Close project information"
          @click="close"
        >
          &times;
        </button>
      </header>

      <div v-if="view === 'about'" class="px-5 py-8 sm:px-10 sm:py-12">
        <p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-green-400">
          Real-time market monitoring
        </p>
        <h1 id="about-title" class="max-w-3xl text-3xl font-bold leading-tight text-white sm:text-5xl">
          One dashboard for the markets that demand attention.
        </h1>
        <p class="mt-6 max-w-3xl text-base leading-7 text-gray-300 sm:text-lg">
          This dashboard was created to solve a specific operational gap I encountered in my previous work.
          Before it existed, I used the Binance application and opened the small bid-and-ask window for each
          trading pair individually just to monitor price changes. With 30 to 50 open orders across spot and
          futures markets, repeating that process for every pair was slow and inefficient.
        </p>
        <p class="mt-4 max-w-3xl text-base leading-7 text-gray-300 sm:text-lg">
          That limitation led me to create a single-screen market monitor that brings live bids, asks, midpoint,
          spread, and price movement together in one place. This restored version preserves that original purpose
          while improving the architecture, reliability, regional market support, and presentation as a professional
          portfolio project.
        </p>

        <div class="mt-10 grid gap-4 sm:grid-cols-3">
          <article class="rounded-xl border border-gray-700 bg-gray-800/70 p-5">
            <p class="text-sm font-semibold text-indigo-300">Live order books</p>
            <p class="mt-2 text-sm leading-6 text-gray-400">Bid, ask, midpoint, spread, and market movement in one view.</p>
          </article>
          <article class="rounded-xl border border-gray-700 bg-gray-800/70 p-5">
            <p class="text-sm font-semibold text-indigo-300">Multiple providers</p>
            <p class="mt-2 text-sm leading-6 text-gray-400">Binance and Kraken feeds with regional spot-market routing.</p>
          </article>
          <article class="rounded-xl border border-gray-700 bg-gray-800/70 p-5">
            <p class="text-sm font-semibold text-indigo-300">Restored and modernized</p>
            <p class="mt-2 text-sm leading-6 text-gray-400">An earlier personal tool rebuilt into a reliable portfolio project.</p>
          </article>
        </div>

        <div class="mt-10 flex flex-wrap items-center gap-4">
          <button
            type="button"
            class="rounded-lg bg-green-500 px-5 py-3 font-bold text-gray-950 transition-colors hover:bg-green-400"
            @click="close"
          >
            Enter Dashboard
          </button>
          <p class="text-sm text-gray-500">Public market data only. No trading or account access.</p>
        </div>
      </div>

      <div v-else class="px-5 py-8 sm:px-10 sm:py-12">
        <p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-green-400">Restoration log</p>
        <h1 id="changelog-title" class="text-3xl font-bold text-white sm:text-4xl">What has changed</h1>
        <p class="mt-4 max-w-2xl leading-7 text-gray-400">
          The original dashboard is being improved in focused, documented milestones while preserving its purpose.
        </p>

        <ol class="mt-8 space-y-4">
          <li v-for="entry in changelog" :key="entry.title" class="rounded-xl border border-gray-700 bg-gray-800/60 p-5">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <h2 class="font-bold text-indigo-200">{{ entry.title }}</h2>
              <time class="text-xs text-gray-500">{{ entry.date }}</time>
            </div>
            <p class="mt-2 text-sm leading-6 text-gray-400">{{ entry.summary }}</p>
          </li>
        </ol>

        <button
          type="button"
          class="mt-8 rounded-lg bg-indigo-500 px-5 py-3 font-bold text-white transition-colors hover:bg-indigo-400"
          @click="close"
        >
          Back to Dashboard
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';

const props = defineProps({
  view: {
    type: String,
    required: true,
    validator: value => ['about', 'changelog'].includes(value)
  }
});
const emit = defineEmits(['close', 'change-view']);
const closeButton = ref(null);
const views = [
  { id: 'about', label: 'About' },
  { id: 'changelog', label: 'Changelog' }
];
const changelog = [
  {
    title: 'Connection recovery and provider fallback',
    date: 'September 21, 2026',
    summary: 'Added bounded retries, timeouts, clear connection errors, manual retry, and a user-controlled Kraken fallback.'
  },
  {
    title: 'Live-update visibility',
    date: 'September 19, 2026',
    summary: 'Added midpoint direction feedback and per-market last-updated indicators.'
  },
  {
    title: 'Binance and Kraken providers',
    date: 'September 19, 2026',
    summary: 'Added selectable providers, Binance.US regional spot routing, Binance Global futures, and region-aware markets.'
  },
  {
    title: 'Order-book architecture restoration',
    date: 'September 19, 2026',
    summary: 'Separated the interface, provider adapters, socket lifecycles, and normalized market-data model.'
  }
];

function close() {
  emit('close');
}

watch(() => props.view, () => nextTick(() => closeButton.value?.focus()));
onMounted(() => closeButton.value?.focus());
</script>
