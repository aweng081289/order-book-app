<template>
  <div>
    <h2 class="text-xl font-bold text-indigo-400 mb-4">Spot Markets</h2>
    <div class="books-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full h-full mb-10">
      <div
        v-for="(book, index) in spotBooks"
        :key="book.symbol + index"
        class="book-panel bg-gray-800/70 p-4 rounded-xl shadow-xl flex flex-col items-center h-full min-h-[370px]"
        :class="{
          'permanent-panel': isPermanentPanel(index),
          'border-2 border-indigo-400 !bg-gray-700/90': editingIndex === index
        }"
      >
        <div class="mb-2 w-full max-w-xs mx-auto relative">
          <template v-if="isPermanentPanel(index)">
            <h3 class="text-xl font-bold mb-1 text-indigo-400 uppercase tracking-wide relative">
              {{ book.symbol }}
              <span v-if="book.priceChangePercent !== null" class="ml-2 text-sm font-normal"
                    :class="{'text-green-400': book.priceChangePercent > 0, 'text-red-400': book.priceChangePercent < 0}">
                {{ book.priceChangePercent > 0 ? '+' : '' }}{{ book.priceChangePercent }}%
              </span>
              <span v-if="book.error" class="block text-xs text-red-400 absolute right-0 top-0">
                {{ book.error }}
              </span>
            </h3>
          </template>
          <template v-else>
            <template v-if="editingIndex === index">
              <input
                ref="editInput"
                v-model="editSymbol"
                type="text"
                class="no-box"
                spellcheck="false"
                autocomplete="off"
                @keyup.enter="saveSymbol(index, 'spot')"
                @blur="saveSymbol(index, 'spot')"
                @focus="selectInput"
              />
            </template>
            <template v-else>
              <h3
                class="text-xl font-bold mb-1 text-indigo-300 uppercase tracking-wide cursor-pointer relative"
                @click="startEdit(index, 'spot')"
              >
                {{ book.symbol }}
                <span v-if="book.priceChangePercent !== null" class="ml-2 text-sm font-normal"
                      :class="{'text-green-400': book.priceChangePercent > 0, 'text-red-400': book.priceChangePercent < 0}">
                  {{ book.priceChangePercent > 0 ? '+' : '' }}{{ book.priceChangePercent }}%
                </span>
                <span v-if="book.error" class="block text-xs text-red-400 absolute right-0 top-0">
                  {{ book.error }}
                </span>
              </h3>
            </template>
          </template>
        </div>


        <div class="orderbook-table-container w-full max-w-xs bg-gray-900/80 p-1 pb-2 rounded-lg shadow">
          <table class="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th class="p-2 text-right text-gray-400">Price</th>
                <th class="p-2 text-right text-gray-400">Amount</th>
                <th class="p-2 text-right text-gray-400">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ask, i) in [...book.formattedAsks].reverse()" :key="'ask-' + i + book.symbol">
                <td class="p-2 text-right font-bold text-red-400">{{ formatNumber(ask[0]) }}</td>
                <td class="p-2 text-right">{{ formatNumber(ask[1]) }}</td>
                <td class="p-2 text-right">{{ formatNumber(ask[2]) }}</td>
              </tr>
              <tr v-if="book.lastPrice" class="bg-gray-900/90">
                <td colspan="3" class="p-2 text-center text-base font-semibold text-green-300">
                  {{ formatNumber(book.lastPrice) }}
                </td>
              </tr>
              <tr v-for="(bid, i) in book.formattedBids" :key="'bid-' + i + book.symbol">
                <td class="p-2 text-right font-bold text-green-400">{{ formatNumber(bid[0]) }}</td>
                <td class="p-2 text-right">{{ formatNumber(bid[1]) }}</td>
                <td class="p-2 text-right">{{ formatNumber(bid[2]) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="book.loading" class="text-center py-6 text-indigo-400">
            <span class="loading-spinner inline-block"></span> Connecting...
          </div>
        </div>
      </div>
    </div>


    <h2 class="text-xl font-bold text-indigo-400 mb-4">Futures Markets</h2>
    <div class="books-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full h-full">
      <div
        v-for="(book, index) in futuresBooks"
        :key="book.symbol + index"
        class="book-panel bg-gray-800/70 p-4 rounded-xl shadow-xl flex flex-col items-center h-full min-h-[370px]"
        :class="{
          'border-2 border-indigo-400 !bg-gray-700/90': editingIndex === (index + spotBooks.length)
        }"
      >
        <div class="mb-2 w-full max-w-xs mx-auto relative">
          <template v-if="editingIndex === (index + spotBooks.length)">
            <input
              ref="editInput"
              v-model="editSymbol"
              type="text"
              class="no-box"
              spellcheck="false"
              autocomplete="off"
              @keyup.enter="saveSymbol(index, 'futures')"
              @blur="saveSymbol(index, 'futures')"
              @focus="selectInput"
            />
          </template>
          <template v-else>
            <h3
              class="text-xl font-bold mb-1 text-indigo-300 uppercase tracking-wide cursor-pointer relative"
              @click="startEdit(index, 'futures')"
            >
              {{ book.symbol }}
              <span v-if="book.priceChangePercent !== null" class="ml-2 text-sm font-normal"
                    :class="{'text-green-400': book.priceChangePercent > 0, 'text-red-400': book.priceChangePercent < 0}">
                {{ book.priceChangePercent > 0 ? '+' : '' }}{{ book.priceChangePercent }}%
              </span>
              <span v-if="book.error" class="block text-xs text-red-400 absolute right-0 top-0">
                {{ book.error }}
              </span>
            </h3>
          </template>
        </div>
        <div class="orderbook-table-container w-full max-w-xs bg-gray-900/80 p-1 pb-2 rounded-lg shadow">
          <table class="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th class="p-2 text-right text-gray-400">Price</th>
                <th class="p-2 text-right text-gray-400">Amount</th>
                <th class="p-2 text-right text-gray-400">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ask, i) in [...book.formattedAsks].reverse()" :key="'ask-' + i + book.symbol">
                <td class="p-2 text-right font-bold text-red-400">{{ formatNumber(ask[0]) }}</td>
                <td class="p-2 text-right">{{ formatNumber(ask[1]) }}</td>
                <td class="p-2 text-right">{{ formatNumber(ask[2]) }}</td>
              </tr>
              <tr v-if="book.lastPrice" class="bg-gray-900/90">
                <td colspan="3" class="p-2 text-center text-base font-semibold text-green-300">
                  {{ formatNumber(book.lastPrice) }}
                </td>
              </tr>
              <tr v-for="(bid, i) in book.formattedBids" :key="'bid-' + i + book.symbol">
                <td class="p-2 text-right font-bold text-green-400">{{ formatNumber(bid[0]) }}</td>
                <td class="p-2 text-right">{{ formatNumber(bid[1]) }}</td>
                <td class="p-2 text-right">{{ formatNumber(bid[2]) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="book.loading" class="text-center py-6 text-indigo-400">
            <span class="loading-spinner inline-block"></span> Connecting...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue';
import axios from 'axios';


const SPOT_REST = 'https://api.binance.com/api/v3';
const FUTURES_REST = 'https://fapi.binance.com/fapi/v1';
const SPOT_WS = 'wss://stream.binance.com:9443/stream?streams=';
const FUTURES_WS = 'wss://fstream.binance.com/stream?streams=';


const spotSymbols = ['BTCUSDT', 'ETHBTC', 'ETHUSDT', 'XRPBTC', 'SOLUSDT', 'XRPUSDT', 'ADABTC', 'ADAUSDT'];
const futuresSymbols = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'SOLUSDT'];


const spotBooks = reactive(spotSymbols.map(symbol => ({
  symbol, bids: [], asks: [], formattedBids: [], formattedAsks: [],
  lastPrice: null, priceChangePercent: null, loading: false, error: null, lastValidSymbol: symbol
})));


const futuresBooks = reactive(futuresSymbols.map(symbol => ({
  symbol, bids: [], asks: [], formattedBids: [], formattedAsks: [],
  lastPrice: null, priceChangePercent: null, loading: false, error: null, lastValidSymbol: symbol
})));


const editingIndex = ref(-1);
const editSymbol = ref('');
const editInput = ref([]);


let wsSpot = null;
let wsFutures = null;
let wsConnected = { spot: false, futures: false };


const RECONNECT_DELAY = 5000;


function isPermanentPanel(index) { return index < 2; }


function connectSpotWebSocket() {
  if (wsSpot && wsSpot.readyState === WebSocket.OPEN) return;
  if (wsSpot) try { wsSpot.close(); } catch(e) {}
  
  // Subscribe to both depth and ticker streams for spot
  const depthStreams = spotBooks.map(b => `${b.symbol.toLowerCase()}@depth5@1000ms`);
  const tickerStreams = spotBooks.map(b => `${b.symbol.toLowerCase()}@ticker`);
  const allStreams = [...depthStreams, ...tickerStreams].join('/');
  
  const url = `${SPOT_WS}${allStreams}`;
  console.log('Spot WS URL:', url);
  wsSpot = new WebSocket(url);
  
  wsSpot.onopen = () => { 
    wsConnected.spot = true;
    console.log('✅ Spot WebSocket connected');
  };
  
  wsSpot.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (!msg.stream || !msg.data) return;
    
    const sym = msg.stream.split('@')[0].toUpperCase();
    const book = spotBooks.find(b => b.symbol === sym);
    if (!book) return;
    
    // Handle depth updates
    if (msg.stream.includes('@depth')) {
      if (msg.data.bids && msg.data.asks) {
        book.bids = msg.data.bids;
        book.asks = msg.data.asks;
        book.loading = false;
        updateFormattedLists(book);
      }
    }
    
    // Handle ticker updates (real-time price)
    if (msg.stream.includes('@ticker')) {
      book.lastPrice = msg.data.c;
      book.priceChangePercent = parseFloat(msg.data.P).toFixed(2);
    }
  };
  
  wsSpot.onerror = (e) => {
    console.error('❌ Spot WebSocket error:', e);
  };
  
  wsSpot.onclose = () => {
    wsConnected.spot = false;
    console.log('Spot WebSocket closed, reconnecting in 5s...');
    setTimeout(connectSpotWebSocket, RECONNECT_DELAY);
  };
}


function connectFuturesWebSocket() {
  if (wsFutures && wsFutures.readyState === WebSocket.OPEN) return;
  if (wsFutures) try { wsFutures.close(); } catch(e) {}
  
  // IMPORTANT: Futures uses @depth5@500ms (NOT @1000ms like Spot)
  // Valid intervals: @100ms, @250ms (default), @500ms
  const depthStreams = futuresBooks.map(b => `${b.symbol.toLowerCase()}@depth5@500ms`);
  const tickerStreams = futuresBooks.map(b => `${b.symbol.toLowerCase()}@ticker`);
  const allStreams = [...depthStreams, ...tickerStreams].join('/');
  
  const url = `${FUTURES_WS}${allStreams}`;
  console.log('✅ Futures WS URL:', url);
  wsFutures = new WebSocket(url);
  
  wsFutures.onopen = () => { 
    wsConnected.futures = true;
    console.log('✅ Futures WebSocket OPENED');
  };
  
  wsFutures.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    
    if (!msg.stream || !msg.data) return;
    
    const sym = msg.stream.split('@')[0].toUpperCase();
    const book = futuresBooks.find(b => b.symbol === sym);
    if (!book) return;
    
    // Handle depth updates (futures uses 'b' and 'a')
    if (msg.stream.includes('@depth')) {
      if (msg.data.b && msg.data.a) {
        book.bids = msg.data.b;
        book.asks = msg.data.a;
        book.loading = false;
        updateFormattedLists(book);
      }
    }
    
    // Handle ticker updates
    if (msg.stream.includes('@ticker')) {
      book.lastPrice = msg.data.c;
      book.priceChangePercent = parseFloat(msg.data.P).toFixed(2);
    }
  };
  
  wsFutures.onerror = (e) => {
    console.error('❌ Futures WebSocket ERROR:', e);
  };
  
  wsFutures.onclose = (e) => {
    wsConnected.futures = false;
    console.log('❌ Futures WebSocket CLOSED. Code:', e.code, 'Reason:', e.reason);
    setTimeout(connectFuturesWebSocket, RECONNECT_DELAY);
  };
}


async function fetchOrderBookAt(index, books, restUrl) {
  const book = books[index];
  book.loading = true;
  try {
    const resp = await axios.get(`${restUrl}/depth?symbol=${book.symbol}&limit=5`);
    book.bids = resp.data.bids || [];
    book.asks = resp.data.asks || [];
    book.loading = false;
    book.lastValidSymbol = book.symbol;
    updateFormattedLists(book);
    
    const ticker = await axios.get(`${restUrl}/ticker/24hr?symbol=${book.symbol}`);
    book.lastPrice = ticker.data.lastPrice;
    book.priceChangePercent = parseFloat(ticker.data.priceChangePercent).toFixed(2);
  } catch (err) {
    book.symbol = book.lastValidSymbol;
    book.error = 'Invalid symbol';
    book.loading = false;
    setTimeout(() => { book.error = null; }, 3000);
  }
}


function updateFormattedLists(book) {
  const asks = [...book.asks].map(([p, q]) => [parseFloat(p), parseFloat(q)]).sort((a, b) => a[0] - b[0]);
  let runningAsk = 0;
  book.formattedAsks = asks.map(v => { runningAsk += v[1]; return [v[0], v[1], runningAsk]; });
  
  const bids = [...book.bids].map(([p, q]) => [parseFloat(p), parseFloat(q)]).sort((a, b) => b[0] - a[0]);
  let runningBid = 0;
  book.formattedBids = bids.map(v => { runningBid += v[1]; return [v[0], v[1], runningBid]; });
}


function formatNumber(num) {
  if (!num) return '0';
  const val = parseFloat(num);
  if (isNaN(val) || val === 0) return '0';
  let decimals = 5;
  if (Math.abs(val) < 0.0001) decimals = 16;
  else if (Math.abs(val) < 1) decimals = 8;
  return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}


function startEdit(index, type) {
  editingIndex.value = type === 'spot' ? index : (index + spotBooks.length);
  const books = type === 'spot' ? spotBooks : futuresBooks;
  editSymbol.value = books[index].symbol;
  nextTick(() => {
    if (editInput.value && editInput.value[editingIndex.value]) {
      editInput.value[editingIndex.value].focus();
      editInput.value[editingIndex.value].select();
    }
  });
}


function selectInput(e) { e.target.select(); }


function saveSymbol(index, type) {
  const books = type === 'spot' ? spotBooks : futuresBooks;
  const val = editSymbol.value.trim().toUpperCase();
  if (!val) { editingIndex.value = -1; return; }
  
  const book = books[index];
  if (book.symbol === val) { editingIndex.value = -1; return; }
  
  book.symbol = val;
  book.error = null;
  editingIndex.value = -1;
  
  const restUrl = type === 'spot' ? SPOT_REST : FUTURES_REST;
  fetchOrderBookAt(index, books, restUrl);
  
  // Reconnect WebSocket with new symbol
  if (type === 'spot') connectSpotWebSocket();
  else connectFuturesWebSocket();
}


onMounted(async () => {
  for (let i = 0; i < spotBooks.length; i++) await fetchOrderBookAt(i, spotBooks, SPOT_REST);
  for (let i = 0; i < futuresBooks.length; i++) await fetchOrderBookAt(i, futuresBooks, FUTURES_REST);
  
  connectSpotWebSocket();
  connectFuturesWebSocket();
});


onUnmounted(() => {
  if (wsSpot) try { wsSpot.close(); } catch(e) {}
  if (wsFutures) try { wsFutures.close(); } catch(e) {}
});
</script>


<style scoped>
.book-panel { transition: all 0.15s ease; }
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
.permanent-panel .text-indigo-300 { cursor: default; pointer-events: none; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
    