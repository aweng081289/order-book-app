<template>
  <div class="relative h-64 w-full" role="img" :aria-label="`${symbol} candlestick chart with ${candles.length} candles`">
    <svg v-if="geometry.length" class="h-full w-full overflow-visible" :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none">
      <line
        v-for="line in gridLines"
        :key="line"
        x1="0" :x2="width" :y1="line" :y2="line"
        stroke="rgb(75 85 99 / 45%)" stroke-width="1"
      />
      <g v-for="candle in geometry" :key="candle.timestamp">
        <line
          :x1="candle.x" :x2="candle.x" :y1="candle.highY" :y2="candle.lowY"
          :stroke="candle.up ? '#4ade80' : '#f87171'" stroke-width="1.2"
        />
        <rect
          :x="candle.x - candleWidth / 2" :y="candle.bodyY"
          :width="candleWidth" :height="candle.bodyHeight"
          :fill="candle.up ? '#22c55e' : '#ef4444'" rx="0.6"
        />
      </g>
    </svg>
    <div v-else class="flex h-full items-center justify-center text-sm text-gray-500">No candle data available</div>
    <div v-if="priceRange" class="pointer-events-none absolute right-1 top-1 text-[10px] text-gray-400">
      {{ formatPrice(priceRange.max) }}
    </div>
    <div v-if="priceRange" class="pointer-events-none absolute bottom-1 right-1 text-[10px] text-gray-400">
      {{ formatPrice(priceRange.min) }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  candles: { type: Array, default: () => [] },
  symbol: { type: String, required: true }
});

const width = 900;
const height = 250;
const gridLines = [50, 100, 150, 200];
const visibleCandles = computed(() => props.candles.slice(-60));
const priceRange = computed(() => {
  if (!visibleCandles.value.length) return null;
  const min = Math.min(...visibleCandles.value.map(item => item.low));
  const max = Math.max(...visibleCandles.value.map(item => item.high));
  return { min, max, span: max - min || max * 0.01 || 1 };
});
const candleWidth = computed(() => Math.max(2, (width / Math.max(visibleCandles.value.length, 1)) * 0.58));
const geometry = computed(() => {
  if (!priceRange.value) return [];
  const padding = 8;
  const plotHeight = height - padding * 2;
  const y = price => padding + ((priceRange.value.max - price) / priceRange.value.span) * plotHeight;
  const step = width / visibleCandles.value.length;
  return visibleCandles.value.map((candle, index) => {
    const openY = y(candle.open);
    const closeY = y(candle.close);
    return {
      ...candle,
      x: step * index + step / 2,
      highY: y(candle.high),
      lowY: y(candle.low),
      bodyY: Math.min(openY, closeY),
      bodyHeight: Math.max(1.5, Math.abs(closeY - openY)),
      up: candle.close >= candle.open
    };
  });
});

function formatPrice(value) {
  return value.toLocaleString(undefined, { maximumFractionDigits: value < 1 ? 6 : 2 });
}
</script>
