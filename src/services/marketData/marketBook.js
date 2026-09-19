/**
 * Application-owned market data shape. Provider adapters must translate their
 * native payloads into this model before data reaches Vue components.
 *
 * A price level is always: { price: string, quantity: string }.
 * A displayed level adds a numeric cumulative total.
 */

export function createMarketBook({ symbol, providerSymbol }) {
  return {
    symbol,
    providerSymbol,
    bids: [],
    asks: [],
    displayBids: [],
    displayAsks: [],
    lastPrice: null,
    midPrice: null,
    spread: null,
    spreadPercent: null,
    priceChangePercent: null,
    priceDirection: null,
    priceUpdateSequence: 0,
    updatedAt: null,
    loading: true,
    error: null
  };
}

export function setOrderBookSnapshot(book, snapshot, displayDepth) {
  book.bids = normalizeLevels(snapshot.bids);
  book.asks = normalizeLevels(snapshot.asks);
  finishBookUpdate(book, displayDepth);
}

export function applyOrderBookUpdates(book, updates, displayDepth, retainedDepth) {
  if (updates.bids?.length) book.bids = mergeLevels(book.bids, updates.bids, true, retainedDepth);
  if (updates.asks?.length) book.asks = mergeLevels(book.asks, updates.asks, false, retainedDepth);
  finishBookUpdate(book, displayDepth);
}

export function setMarketTicker(book, ticker) {
  if (ticker.lastPrice !== undefined) book.lastPrice = String(ticker.lastPrice);
  if (ticker.priceChangePercent !== undefined) {
    book.priceChangePercent = Number(ticker.priceChangePercent).toFixed(2);
  }
  book.updatedAt = ticker.updatedAt || Date.now();
}

function normalizeLevels(levels = []) {
  return levels.map(level => ({
    price: String(Array.isArray(level) ? level[0] : level.price),
    quantity: String(Array.isArray(level) ? level[1] : (level.quantity ?? level.qty))
  }));
}

function mergeLevels(currentLevels, updates, descending, retainedDepth) {
  const levels = new Map(currentLevels.map(level => [level.price, level.quantity]));
  for (const update of normalizeLevels(updates)) {
    if (Number(update.quantity) === 0) levels.delete(update.price);
    else levels.set(update.price, update.quantity);
  }
  return [...levels.entries()]
    .sort((a, b) => descending ? Number(b[0]) - Number(a[0]) : Number(a[0]) - Number(b[0]))
    .slice(0, retainedDepth)
    .map(([price, quantity]) => ({ price, quantity }));
}

function finishBookUpdate(book, displayDepth) {
  const previousMidPrice = Number(book.midPrice);
  book.displayAsks = createDisplayLevels(book.asks, false, displayDepth);
  book.displayBids = createDisplayLevels(book.bids, true, displayDepth);

  const bestAsk = Number(book.displayAsks[0]?.price);
  const bestBid = Number(book.displayBids[0]?.price);
  if (bestAsk && bestBid) {
    book.midPrice = (bestAsk + bestBid) / 2;
    book.spread = bestAsk - bestBid;
    book.spreadPercent = ((book.spread / book.midPrice) * 100).toFixed(3);
    if (previousMidPrice && book.midPrice !== previousMidPrice) {
      book.priceDirection = book.midPrice > previousMidPrice ? 'up' : 'down';
      book.priceUpdateSequence += 1;
    }
  }
  book.updatedAt = Date.now();
  book.loading = false;
  book.error = null;
}

function createDisplayLevels(levels, descending, displayDepth) {
  const sortedLevels = [...levels]
    .sort((a, b) => descending ? Number(b.price) - Number(a.price) : Number(a.price) - Number(b.price))
    .slice(0, displayDepth);
  let total = 0;
  return sortedLevels.map(level => ({
    ...level,
    total: total += Number(level.quantity)
  }));
}
