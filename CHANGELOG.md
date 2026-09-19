# Changelog

This file records meaningful changes made while restoring and modernizing the project.

## Unreleased

### Regional Binance spot routing - 2026-09-19

- Added a Vercel serverless region endpoint using the deployment's `x-vercel-ip-country` request header; no paid geolocation service or API key is required.
- Routed US visitors to Binance.US for spot catalogs and WebSocket market data, while other visitors use Binance Global spot.
- Kept all Binance futures market data on Binance Global as originally planned.
- Added visible venue labels beside the spot and futures section headings.
- Made local development default to Binance.US because Vercel geolocation headers are only available after deployment.

### Exchange selector - 2026-09-19

- Added a visible Binance/Kraken market-data selector above the dashboard.
- Kept Binance as the default provider and saved each visitor's manual selection in browser storage.
- Provider changes now unmount the old feed before starting the new one, closing its spot and futures WebSockets instead of leaving background subscriptions active.
- Kept provider-specific symbols and connection states isolated while preserving the shared order-book interface.

### Binance Global market-data adapter - 2026-09-19

- Added Binance Global public spot and USD-M perpetual-futures market adapters using the shared market-data model.
- Made Binance the default runtime provider while retaining the Kraken adapter for the planned exchange selector.
- Added 100 ms partial order-book streams and 24-hour ticker streams for faster visible market updates.
- Added live subscribe and unsubscribe handling so changing a panel does not reconnect its entire WebSocket.
- Kept one spot socket and one futures socket per visitor, with unique stream subscriptions shared by duplicate panels.
- Added independent spot and futures market catalogs with built-in defaults when a catalog request is unavailable.
- Kept the first two spot panels, `BTCUSDT` and `ETHBTC`, permanent.
- No Binance.US routing, geographic detection, or exchange selector was added in this step.

### Normalized market-data model — 2026-09-19

- Added an application-owned market-book model shared independently of any exchange payload format.
- Standardized price levels as `{ price, quantity }` objects and displayed levels with cumulative totals.
- Centralized snapshot replacement, incremental level updates, ticker updates, midpoint, spread, timestamps, and loading state.
- Refactored Kraken message handling to translate its native spot and futures payloads into the shared model.
- Updated `OrderBookPanel.vue` to render only normalized application data, preparing it for a Binance adapter without provider-specific UI branches.

### Order-book architecture refactor — 2026-09-19

- Reduced `OrderBook.vue` to section layout, connection badges, and market coordination.
- Extracted the repeated market panel, editing controls, table, formatting, and loading UI into `OrderBookPanel.vue`.
- Extracted Kraken market state, WebSocket lifecycle, order-book processing, reconnection, and symbol changes into `useKrakenOrderBooks.js`.
- Added provider configuration that records Binance as the preferred future default while retaining Kraken as the runtime fallback until a Binance adapter exists.
- Removed the visible “Mid” label while retaining the responsive midpoint value, last traded price, and spread.
- Did not add Binance endpoints or an exchange selector during this refactor.

### Market selection and live price summary — 2026-09-19

- Made the Kraken spot and futures catalogs load independently so one failed request no longer disables all market selection.
- Added built-in fallback mappings for the dashboard's default spot and futures markets.
- Preserved support for compact market input such as `ETHUSDT` and Kraken-style input such as `ETH/USDT`.
- Replaced the single center price with a live summary containing the bid-ask midpoint, last traded price, and current spread.
- Calculated the midpoint and spread from every visible order-book update so the center responds to bid and ask movement even when no new trade occurs.
- Fixed duplicate market panels so selecting a market already displayed elsewhere updates every matching panel instead of leaving the new panel stuck on “Connecting.”

### Kraken market-data migration — 2026-09-19

Replaced the original global Binance market-data integration with Kraken's public APIs.

- Added a Kraken market service that loads the current spot-pair and futures-instrument catalogs.
- Replaced Binance spot streams with Kraken WebSocket v2 `book` and `ticker` subscriptions.
- Replaced Binance futures streams with Kraken Futures `book` and `ticker` subscriptions.
- Added local processing for Kraken order-book snapshots and incremental updates.
- Added symbol normalization so users can enter compact symbols such as `BTCUSDT` while Kraken receives its native `XBT/USDT` symbol.
- Kept all market-data calls public and unauthenticated; no Kraken account or API key is required.

The migration preserves the original dashboard behavior:

- `BTCUSDT` and `ETHBTC` remain the two permanent spot markets, backed by Kraken WebSocket v2's `BTC/USDT` and `ETH/BTC` symbols.
- The remaining spot panels continue to support user-selected markets.
- Spot and futures data remain separate sections.
- Futures panels now use Kraken's USD-quoted perpetual markets and are labeled `BTCUSD`, `ETHUSD`, `XRPUSD`, and `SOLUSD` accordingly.

### Market monitor stabilization — 2026-09-19

Changed `src/components/OrderBook.vue` to improve the reliability of the existing Binance-based dashboard:

- Fixed live WebSocket subscriptions after a user changes a trading pair.
- Prevented duplicate reconnection timers and overlapping socket connections.
- Stopped WebSockets from reconnecting after the component is unmounted.
- Added visible connection states for spot and futures markets: connecting, live, reconnecting, and connection issue.
- Added safe handling for malformed WebSocket messages.
- Distinguished invalid trading pairs from general market-data failures.
- Made the existing `depth` component property control REST and WebSocket order-book depth.
- Loaded initial spot and futures data concurrently to improve startup time.
- Resolved the nine ESLint errors that existed in the recovered project.

Validation completed:

- ESLint passed.
- An in-memory Vite production build passed without writing a `dist` directory.
- Git whitespace checks passed.

No dependencies were installed or removed, and no Git configuration was changed.
