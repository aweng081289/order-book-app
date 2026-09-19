import { onMounted, onUnmounted, reactive, ref } from 'vue';
import {
  KRAKEN_FUTURES_WS,
  KRAKEN_SPOT_WS,
  loadKrakenMarketCatalogs,
  resolveKrakenMarket
} from '@/services/krakenMarkets';
import {
  applyOrderBookUpdates,
  createMarketBook,
  setMarketTicker,
  setOrderBookSnapshot
} from '@/services/marketData/marketBook';

const SPOT_MARKETS = [
  ['BTCUSDT', 'BTC/USDT'], ['ETHBTC', 'ETH/BTC'], ['ETHUSDT', 'ETH/USDT'],
  ['XRPBTC', 'XRP/BTC'], ['SOLUSDT', 'SOL/USDT'], ['XRPUSDT', 'XRP/USDT'],
  ['ADABTC', 'ADA/BTC'], ['ADAUSDT', 'ADA/USDT']
];
const FUTURES_MARKETS = [
  ['BTCUSD', 'PF_XBTUSD'], ['ETHUSD', 'PF_ETHUSD'],
  ['XRPUSD', 'PF_XRPUSD'], ['SOLUSD', 'PF_SOLUSD']
];
const RECONNECT_DELAY = 5000;

export function useKrakenOrderBooks(depth) {
  const spotBooks = reactive(SPOT_MARKETS.map(([symbol, providerSymbol]) =>
    createMarketBook({ symbol, providerSymbol })));
  const futuresBooks = reactive(FUTURES_MARKETS.map(([symbol, providerSymbol]) =>
    createMarketBook({ symbol, providerSymbol })));
  const catalogs = { spot: new Map(), futures: new Map() };
  const spotConnectionStatus = ref('idle');
  const futuresConnectionStatus = ref('idle');
  const krakenBookDepth = depth <= 10 ? 10 : 25;

  let spotSocket = null;
  let futuresSocket = null;
  let spotReconnectTimer = null;
  let futuresReconnectTimer = null;
  let stopping = false;

  function clearReconnectTimer(type) {
    const timer = type === 'spot' ? spotReconnectTimer : futuresReconnectTimer;
    if (timer) clearTimeout(timer);
    if (type === 'spot') spotReconnectTimer = null;
    else futuresReconnectTimer = null;
  }

  function scheduleReconnect(type) {
    if (stopping) return;
    clearReconnectTimer(type);
    const status = type === 'spot' ? spotConnectionStatus : futuresConnectionStatus;
    status.value = 'reconnecting';
    const reconnect = type === 'spot' ? connectSpot : connectFutures;
    const timer = setTimeout(reconnect, RECONNECT_DELAY);
    if (type === 'spot') spotReconnectTimer = timer;
    else futuresReconnectTimer = timer;
  }

  function connectSpot(force = false) {
    if (stopping) return;
    if (spotSocket && [WebSocket.OPEN, WebSocket.CONNECTING].includes(spotSocket.readyState)) {
      if (!force) return;
      spotSocket.onclose = null;
      spotSocket.close();
    }
    clearReconnectTimer('spot');
    spotConnectionStatus.value = 'connecting';
    const symbols = [...new Set(spotBooks.map(book => book.providerSymbol))];
    const socket = new WebSocket(KRAKEN_SPOT_WS);
    spotSocket = socket;

    socket.onopen = () => {
      spotConnectionStatus.value = 'connected';
      socket.send(JSON.stringify({
        method: 'subscribe',
        params: { channel: 'book', symbol: symbols, depth: krakenBookDepth, snapshot: true }
      }));
      socket.send(JSON.stringify({
        method: 'subscribe',
        params: { channel: 'ticker', symbol: symbols, event_trigger: 'trades', snapshot: true }
      }));
    };
    socket.onmessage = event => handleSpotMessage(event.data);
    socket.onerror = error => {
      spotConnectionStatus.value = 'error';
      console.error('Kraken spot WebSocket error:', error);
    };
    socket.onclose = () => {
      if (spotSocket !== socket) return;
      spotSocket = null;
      scheduleReconnect('spot');
    };
  }

  function handleSpotMessage(rawMessage) {
    let message;
    try {
      message = JSON.parse(rawMessage);
    } catch (error) {
      console.error('Unable to parse spot market data:', error);
      return;
    }
    const data = message.data?.[0];
    if (!data?.symbol) return;
    const books = spotBooks.filter(book => book.providerSymbol === data.symbol);
    if (!books.length) return;

    if (message.channel === 'book') {
      for (const book of books) {
        if (message.type === 'snapshot') {
          setOrderBookSnapshot(book, { bids: data.bids, asks: data.asks }, depth);
        } else {
          applyOrderBookUpdates(book, { bids: data.bids, asks: data.asks }, depth, krakenBookDepth);
        }
      }
    } else if (message.channel === 'ticker') {
      for (const book of books) {
        setMarketTicker(book, {
          lastPrice: data.last,
          priceChangePercent: data.change_pct,
          updatedAt: data.timestamp ? Date.parse(data.timestamp) : Date.now()
        });
      }
    }
  }

  function connectFutures(force = false) {
    if (stopping) return;
    if (futuresSocket && [WebSocket.OPEN, WebSocket.CONNECTING].includes(futuresSocket.readyState)) {
      if (!force) return;
      futuresSocket.onclose = null;
      futuresSocket.close();
    }
    clearReconnectTimer('futures');
    futuresConnectionStatus.value = 'connecting';
    const productIds = [...new Set(futuresBooks.map(book => book.providerSymbol))];
    const socket = new WebSocket(KRAKEN_FUTURES_WS);
    futuresSocket = socket;

    socket.onopen = () => {
      futuresConnectionStatus.value = 'connected';
      socket.send(JSON.stringify({ event: 'subscribe', feed: 'book', product_ids: productIds }));
      socket.send(JSON.stringify({ event: 'subscribe', feed: 'ticker', product_ids: productIds }));
    };
    socket.onmessage = event => handleFuturesMessage(event.data);
    socket.onerror = error => {
      futuresConnectionStatus.value = 'error';
      console.error('Kraken futures WebSocket error:', error);
    };
    socket.onclose = () => {
      if (futuresSocket !== socket) return;
      futuresSocket = null;
      scheduleReconnect('futures');
    };
  }

  function handleFuturesMessage(rawMessage) {
    let message;
    try {
      message = JSON.parse(rawMessage);
    } catch (error) {
      console.error('Unable to parse futures market data:', error);
      return;
    }
    const books = futuresBooks.filter(book => book.providerSymbol === message.product_id);
    if (!books.length) return;

    if (message.feed === 'book_snapshot') {
      for (const book of books) {
        setOrderBookSnapshot(book, { bids: message.bids, asks: message.asks }, depth);
      }
    } else if (message.feed === 'book') {
      const side = message.side === 'buy' ? 'bids' : 'asks';
      for (const book of books) {
        applyOrderBookUpdates(book, { [side]: [message] }, depth, krakenBookDepth);
      }
    } else if (message.feed === 'ticker') {
      for (const book of books) {
        setMarketTicker(book, {
          lastPrice: message.last,
          priceChangePercent: message.change,
          updatedAt: message.time
        });
      }
    }
  }

  function changeSymbol(index, type, symbol) {
    const books = type === 'spot' ? spotBooks : futuresBooks;
    const book = books[index];
    if (!symbol || book.symbol === symbol) return;
    const market = resolveKrakenMarket(symbol, catalogs[type]);
    if (!market) {
      showTemporaryError(book, 'Invalid symbol');
      return;
    }
    Object.assign(book, createMarketBook({
      symbol: market.displaySymbol,
      providerSymbol: market.providerSymbol
    }));
    if (type === 'spot') connectSpot(true);
    else connectFutures(true);
  }

  function showTemporaryError(book, message) {
    book.error = message;
    setTimeout(() => { book.error = null; }, 3000);
  }

  async function start() {
    const loadedCatalogs = await loadKrakenMarketCatalogs();
    catalogs.spot = loadedCatalogs.spot;
    catalogs.futures = loadedCatalogs.futures;
    connectSpot();
    connectFutures();
  }

  function stop() {
    stopping = true;
    clearReconnectTimer('spot');
    clearReconnectTimer('futures');
    for (const socket of [spotSocket, futuresSocket]) {
      if (!socket) continue;
      socket.onclose = null;
      socket.close();
    }
  }

  onMounted(start);
  onUnmounted(stop);

  return {
    spotBooks,
    futuresBooks,
    spotConnectionStatus,
    futuresConnectionStatus,
    spotRegion: null,
    changeSymbol
  };
}
