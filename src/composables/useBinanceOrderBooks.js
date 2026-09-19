import { onMounted, onUnmounted, reactive, ref } from 'vue';
import {
  BINANCE_FUTURES_WS,
  detectBinanceSpotRegion,
  getBinanceDefaultSpotSymbols,
  getBinanceSpotWebSocket,
  loadBinanceMarketCatalogs,
  resolveBinanceMarket
} from '@/services/binanceMarkets';
import {
  createMarketBook,
  setMarketTicker,
  setOrderBookSnapshot
} from '@/services/marketData/marketBook';

const SPOT_MARKETS = getBinanceDefaultSpotSymbols('global');
const FUTURES_MARKETS = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'SOLUSDT'];
const RECONNECT_DELAY = 5000;

function createBooks(symbols) {
  return reactive(symbols.map(symbol => createMarketBook({ symbol, providerSymbol: symbol })));
}

export function useBinanceOrderBooks(depth) {
  const spotBooks = createBooks(SPOT_MARKETS);
  const futuresBooks = createBooks(FUTURES_MARKETS);
  const catalogs = { spot: new Map(), futures: new Map() };
  const spotConnectionStatus = ref('idle');
  const futuresConnectionStatus = ref('idle');
  const spotRegion = ref('detecting');
  const streamDepth = [5, 10, 20].includes(depth) ? depth : 5;

  const sockets = { spot: null, futures: null };
  const reconnectTimers = { spot: null, futures: null };
  let requestId = 0;
  let stopping = false;

  function booksFor(type) {
    return type === 'spot' ? spotBooks : futuresBooks;
  }

  function statusFor(type) {
    return type === 'spot' ? spotConnectionStatus : futuresConnectionStatus;
  }

  function streamsFor(books) {
    return [...new Set(books.flatMap(book => {
      const symbol = book.providerSymbol.toLowerCase();
      return [`${symbol}@depth${streamDepth}@100ms`, `${symbol}@ticker`];
    }))];
  }

  function sendSubscription(type, method, streams) {
    const socket = sockets[type];
    if (!streams.length || socket?.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ method, params: streams, id: ++requestId }));
  }

  function clearReconnectTimer(type) {
    if (reconnectTimers[type]) clearTimeout(reconnectTimers[type]);
    reconnectTimers[type] = null;
  }

  function scheduleReconnect(type) {
    if (stopping) return;
    clearReconnectTimer(type);
    statusFor(type).value = 'reconnecting';
    reconnectTimers[type] = setTimeout(() => connect(type), RECONNECT_DELAY);
  }

  function connect(type) {
    if (stopping) return;
    const existing = sockets[type];
    if (existing && [WebSocket.OPEN, WebSocket.CONNECTING].includes(existing.readyState)) return;

    clearReconnectTimer(type);
    statusFor(type).value = 'connecting';
    const socket = new WebSocket(
      type === 'spot' ? getBinanceSpotWebSocket(spotRegion.value) : BINANCE_FUTURES_WS
    );
    sockets[type] = socket;

    socket.onopen = () => {
      if (sockets[type] !== socket) return;
      statusFor(type).value = 'connected';
      sendSubscription(type, 'SUBSCRIBE', streamsFor(booksFor(type)));
    };
    socket.onmessage = event => handleMessage(type, event.data);
    socket.onerror = error => {
      if (sockets[type] !== socket) return;
      statusFor(type).value = 'error';
      console.error(`Binance ${type} WebSocket error:`, error);
    };
    socket.onclose = () => {
      if (sockets[type] !== socket) return;
      sockets[type] = null;
      scheduleReconnect(type);
    };
  }

  function handleMessage(type, rawMessage) {
    let message;
    try {
      message = JSON.parse(rawMessage);
    } catch (error) {
      console.error(`Unable to parse Binance ${type} market data:`, error);
      return;
    }
    if (!message.stream || !message.data) return;

    const [streamSymbol, channel = ''] = message.stream.split('@');
    const books = booksFor(type).filter(
      book => book.providerSymbol.toLowerCase() === streamSymbol
    );
    if (!books.length) return;

    if (channel.startsWith('depth')) {
      const bids = message.data.bids || message.data.b;
      const asks = message.data.asks || message.data.a;
      for (const book of books) setOrderBookSnapshot(book, { bids, asks }, depth);
    } else if (channel === 'ticker') {
      for (const book of books) {
        setMarketTicker(book, {
          lastPrice: message.data.c,
          priceChangePercent: message.data.P,
          updatedAt: message.data.E
        });
      }
    }
  }

  function changeSymbol(index, type, symbol) {
    const books = booksFor(type);
    const book = books[index];
    if (!symbol || book.symbol === symbol.toUpperCase()) return;
    const market = resolveBinanceMarket(symbol, catalogs[type]);
    if (!market) {
      showTemporaryError(book, 'Market unavailable');
      return;
    }

    const previousStreams = streamsFor(books);
    Object.assign(book, createMarketBook({
      symbol: market.displaySymbol,
      providerSymbol: market.providerSymbol
    }));
    const nextStreams = streamsFor(books);
    sendSubscription(type, 'SUBSCRIBE', nextStreams.filter(stream => !previousStreams.includes(stream)));
    sendSubscription(type, 'UNSUBSCRIBE', previousStreams.filter(stream => !nextStreams.includes(stream)));
  }

  function showTemporaryError(book, message) {
    book.error = message;
    setTimeout(() => { book.error = null; }, 3000);
  }

  async function start() {
    spotRegion.value = await detectBinanceSpotRegion();
    const regionalSpotSymbols = getBinanceDefaultSpotSymbols(spotRegion.value);
    spotBooks.forEach((book, index) => {
      const symbol = regionalSpotSymbols[index];
      if (book.symbol !== symbol) {
        Object.assign(book, createMarketBook({ symbol, providerSymbol: symbol }));
      }
    });
    const loadedCatalogs = await loadBinanceMarketCatalogs(spotRegion.value);
    catalogs.spot = loadedCatalogs.spot;
    catalogs.futures = loadedCatalogs.futures;
    connect('spot');
    connect('futures');
  }

  function stop() {
    stopping = true;
    for (const type of ['spot', 'futures']) {
      clearReconnectTimer(type);
      const socket = sockets[type];
      if (!socket) continue;
      socket.onclose = null;
      socket.close();
      sockets[type] = null;
    }
  }

  onMounted(start);
  onUnmounted(stop);

  return {
    spotBooks,
    futuresBooks,
    spotConnectionStatus,
    futuresConnectionStatus,
    spotRegion,
    changeSymbol
  };
}
