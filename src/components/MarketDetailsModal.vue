<template>
  <div
    class="fixed inset-0 z-50 overflow-y-auto bg-gray-950/85 p-3 backdrop-blur-sm sm:p-6"
    role="presentation"
    @click.self="close"
    @keydown="handleKeydown"
  >
    <section
      ref="dialogPanel"
      class="mx-auto my-2 w-full max-w-6xl overflow-hidden rounded-2xl border border-indigo-300/20 bg-gray-900 shadow-2xl shadow-black/70 sm:my-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="market-details-title"
    >
      <header class="flex items-start justify-between gap-4 border-b border-gray-700/80 px-5 py-4 sm:px-7">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h2 id="market-details-title" class="text-2xl font-bold tracking-wide text-white">{{ book.symbol }}</h2>
            <span class="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              {{ provider }} {{ marketType }}
            </span>
          </div>
          <div class="mt-2 flex flex-wrap items-baseline gap-3">
            <span class="text-2xl font-semibold text-green-300">{{ formatPrice(metrics.lastPrice) }}</span>
            <span v-if="metrics.priceChangePercent !== null" :class="metrics.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'">
              {{ metrics.priceChangePercent >= 0 ? '+' : '' }}{{ metrics.priceChangePercent.toFixed(2) }}%
            </span>
          </div>
        </div>
        <button
          ref="closeButton" type="button"
          class="min-h-11 min-w-11 rounded-lg text-2xl text-gray-400 hover:bg-gray-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
          aria-label="Close market details" @click="close"
        >&times;</button>
      </header>

      <div class="grid gap-5 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
        <div class="space-y-5">
          <section class="rounded-xl border border-gray-700 bg-gray-950/60 p-4" aria-labelledby="chart-title">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 id="chart-title" class="font-bold text-gray-100">Price action</h3>
                <p class="text-xs text-gray-500">Recent OHLC candles from {{ provider }}</p>
              </div>
              <div class="inline-flex rounded-lg bg-gray-800 p-1" role="group" aria-label="Chart timeframe">
                <button
                  v-for="option in timeframes" :key="option" type="button"
                  class="min-h-9 rounded-md px-3 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-300"
                  :class="timeframe === option ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'"
                  :aria-pressed="timeframe === option" @click="changeTimeframe(option)"
                >{{ option.toUpperCase() }}</button>
              </div>
            </div>
            <div v-if="loadingCandles" class="flex h-64 items-center justify-center text-sm text-indigo-300" role="status">Loading chart…</div>
            <div v-else-if="candleError" class="flex h-64 flex-col items-center justify-center gap-3 text-center text-sm text-gray-400">
              <p>{{ candleError }}</p>
              <button type="button" class="retry-button" @click="loadCandles">Retry chart</button>
            </div>
            <CandlestickChart v-else :candles="candles" :symbol="book.symbol" />
          </section>

          <section aria-labelledby="metrics-title">
            <h3 id="metrics-title" class="sr-only">Market statistics</h3>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <article v-for="stat in metricCards" :key="stat.label" class="rounded-xl border border-gray-700 bg-gray-800/60 p-4">
                <p class="text-[10px] font-bold uppercase tracking-wider text-gray-500">{{ stat.label }}</p>
                <p class="mt-2 text-sm font-semibold text-gray-100">{{ stat.value }}</p>
              </article>
            </div>
          </section>

          <section class="rounded-xl border border-violet-400/25 bg-gradient-to-br from-violet-950/55 to-indigo-950/45 p-5" aria-labelledby="ai-title">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">Powered by Gemini</p>
                <h3 id="ai-title" class="mt-1 text-lg font-bold text-white">✦ AI Market Brief</h3>
              </div>
              <span v-if="insight" class="rounded-full border px-2 py-1 text-[10px] font-bold uppercase" :class="outlookClass">
                {{ insight.outlook }}
              </span>
            </div>
            <div v-if="loadingInsight" class="py-10 text-center text-sm text-violet-200" role="status">AI is reading the market…</div>
            <div v-else-if="insightError" class="py-8 text-center text-sm text-gray-300">
              <p>{{ insightError }}</p>
              <button type="button" class="retry-button mt-3" :disabled="!candles.length" @click="loadInsight">Retry brief</button>
            </div>
            <div v-else-if="insight" class="mt-4 space-y-4 text-sm leading-6 text-gray-200">
              <p>{{ insight.summary }}</p>
              <ul class="space-y-2">
                <li v-for="signal in insight.signals" :key="signal" class="flex gap-2"><span class="text-violet-300">◆</span><span>{{ signal }}</span></li>
              </ul>
              <div class="rounded-lg bg-gray-950/40 p-3"><span class="font-bold text-amber-300">Risk:</span> {{ insight.risk }}</div>
              <p class="border-l-2 border-violet-400 pl-3 italic text-violet-100">“{{ insight.wittyTake }}”</p>
              <p class="text-[10px] uppercase tracking-wider text-gray-500">Automated commentary · Not financial advice</p>
            </div>
          </section>
        </div>

        <aside class="rounded-xl border border-gray-700 bg-gray-950/50 p-4 sm:p-5" aria-labelledby="news-title">
          <div class="flex items-center justify-between gap-2">
            <div>
              <h3 id="news-title" class="font-bold text-white">Crypto News</h3>
              <p class="text-xs text-gray-500">Coverage related to {{ baseAsset }}</p>
            </div>
            <button type="button" class="text-xs font-semibold text-indigo-300 hover:text-indigo-200" @click="loadNews">Refresh</button>
          </div>
          <div v-if="loadingNews" class="py-16 text-center text-sm text-indigo-300" role="status">Loading coverage…</div>
          <div v-else-if="newsError" class="py-12 text-center text-sm text-gray-400"><p>{{ newsError }}</p><button type="button" class="retry-button mt-3" @click="loadNews">Retry news</button></div>
          <div v-else-if="!articles.length" class="py-16 text-center text-sm text-gray-500">No recent coverage found.</div>
          <ol v-else class="mt-4 divide-y divide-gray-800">
            <li v-for="article in articles" :key="article.id || article.url" class="py-4 first:pt-0">
              <a :href="article.url" target="_blank" rel="noopener noreferrer" class="block !p-0 !text-gray-100 hover:!bg-transparent hover:!text-indigo-200">
                <h4 class="font-semibold leading-6">{{ article.title }}</h4>
              </a>
              <p v-if="article.summary" class="mt-2 line-clamp-3 text-xs leading-5 text-gray-400">{{ article.summary }}</p>
              <div class="mt-3 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-gray-500">
                <span>{{ article.source }}</span><span>·</span><time>{{ relativeTime(article.publishedAt) }}</time>
                <span v-if="article.sentiment" class="rounded-full border border-gray-700 px-1.5 py-0.5">{{ article.sentiment }}</span>
              </div>
            </li>
          </ol>
          <p class="mt-4 border-t border-gray-800 pt-3 text-[10px] text-gray-600">Headlines provided by Marketaux. Articles open at their original source.</p>
        </aside>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import CandlestickChart from './CandlestickChart.vue';
import { calculateMarketMetrics, getBaseAsset, loadAiInsight, loadMarketCandles, loadMarketNews } from '@/services/marketDetails';

const props = defineProps({
  book: { type: Object, required: true },
  provider: { type: String, required: true },
  marketType: { type: String, required: true },
  spotRegion: { type: String, default: null }
});
const emit = defineEmits(['close']);
const timeframes = ['1h', '4h', '1d'];
const timeframe = ref('1h');
const candles = ref([]);
const articles = ref([]);
const insight = ref(null);
const loadingCandles = ref(true);
const loadingNews = ref(true);
const loadingInsight = ref(false);
const candleError = ref('');
const newsError = ref('');
const insightError = ref('');
const closeButton = ref(null);
const dialogPanel = ref(null);
const baseAsset = computed(() => getBaseAsset(props.book.symbol));
const metrics = computed(() => calculateMarketMetrics(props.book, candles.value));
const metricCards = computed(() => [
  { label: 'Trend', value: metrics.value.trend },
  { label: 'Range', value: formatPercent(metrics.value.rangePercent) },
  { label: 'Avg movement', value: formatPercent(metrics.value.volatilityPercent) },
  { label: 'Bid depth', value: metrics.value.bookImbalancePercent === null ? '—' : `${metrics.value.bookImbalancePercent.toFixed(0)}%` }
]);
const outlookClass = computed(() => ({
  bullish: 'border-green-400/50 text-green-300', bearish: 'border-red-400/50 text-red-300',
  mixed: 'border-amber-400/50 text-amber-300', neutral: 'border-gray-500 text-gray-300'
}[insight.value?.outlook] || 'border-gray-500 text-gray-300'));

async function loadCandles() {
  loadingCandles.value = true; candleError.value = ''; insight.value = null;
  try {
    candles.value = await loadMarketCandles({ provider: props.provider, marketType: props.marketType, providerSymbol: props.book.providerSymbol, timeframe: timeframe.value, spotRegion: props.spotRegion });
    if (!candles.value.length) throw new Error('No candle data');
  } catch {
    candleError.value = 'Chart data is temporarily unavailable.';
    insightError.value = 'The AI brief needs candle data before it can run.';
  } finally { loadingCandles.value = false; }
}
async function loadNews() {
  loadingNews.value = true; newsError.value = '';
  try { articles.value = await loadMarketNews(baseAsset.value); }
  catch { newsError.value = 'Recent crypto coverage is temporarily unavailable.'; }
  finally { loadingNews.value = false; }
}
async function loadInsight() {
  if (!candles.value.length || loadingInsight.value) return;
  loadingInsight.value = true; insightError.value = '';
  try {
    const data = await loadAiInsight({ symbol: props.book.symbol, marketType: props.marketType, timeframe: timeframe.value, metrics: metrics.value, headlines: articles.value.map(article => article.title) });
    insight.value = data.insight;
  } catch (error) {
    insightError.value = error.response?.data?.code
      ? error.response.data.error
      : 'The market brief request failed. Please try again shortly.';
  }
  finally { loadingInsight.value = false; }
}
async function changeTimeframe(value) {
  if (value === timeframe.value) return;
  timeframe.value = value;
  await loadCandles();
  if (candles.value.length) await loadInsight();
}
function close() { emit('close'); }
function handleKeydown(event) {
  if (event.key === 'Escape') { event.preventDefault(); close(); return; }
  if (event.key !== 'Tab') return;
  const focusable = [...dialogPanel.value.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')];
  const first = focusable[0]; const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}
function formatPrice(value) { return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: value < 1 ? 8 : 2 }) : '—'; }
function formatPercent(value) { return value === null || !Number.isFinite(value) ? '—' : `${value.toFixed(2)}%`; }
function relativeTime(value) {
  const hours = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 3600000));
  if (hours < 1) return 'Less than 1h ago';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

onMounted(async () => {
  closeButton.value?.focus();
  await Promise.all([loadCandles(), loadNews()]);
  if (candles.value.length && !insight.value) await loadInsight();
});
</script>

<style scoped>
.retry-button { border: 1px solid rgb(129 140 248 / 50%); border-radius: 0.5rem; color: #c7d2fe; min-height: 2.5rem; padding: 0.45rem 0.8rem; }
.retry-button:hover { background: rgb(79 70 229 / 20%); }
.retry-button:focus-visible { outline: 2px solid #a5b4fc; outline-offset: 2px; }
</style>
