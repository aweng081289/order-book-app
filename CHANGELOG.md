# Changelog

This file records meaningful changes made while restoring and modernizing the project.

## Project restoration context

This repository restores and modernizes an earlier personal project created to monitor many cryptocurrency trading pairs in one place. The original dashboard replaced the inefficient process of checking 30 to 50 open-order markets individually in an exchange application. The restoration preserves that original purpose while improving the architecture, market-data integrations, reliability, documentation, and presentation for a professional portfolio.

## Unreleased

### Production deployment verification - 2026-09-21

- Deployed the restored application from the GitHub `main` branch to Vercel.
- Added the production URL, `https://order-book-app-gnu1.vercel.app/`, to the project README.
- Verified successful responses for the application shell, production JavaScript, and production CSS assets.
- Verified the Vercel `/api/region` function returns JSON and detected the verification request as US traffic.
- Confirmed the deployed bundle contains the current About story, Binance.US routing, Kraken integration, provider fallback, and region-aware XRP market.

### Responsive and accessibility improvements - 2026-09-21

- Added keyboard focus containment, Escape dismissal, and trigger-focus restoration for the project overlay.
- Added visible focus indicators and minimum touch-target heights to navigation, provider, market, retry, fallback, and dialog controls.
- Added polite screen-reader announcements for spot and futures connection states and loading states.
- Added accessible order-book captions, column scopes, and explicit bid/ask row descriptions.
- Added alert semantics for unavailable markets while retaining visible text rather than relying on color alone.
- Added mobile page spacing and global reduced-motion support.
- Added automated tests for overlay Escape handling and focus wrapping.

### Continuous integration - 2026-09-21

- Added a GitHub Actions workflow for pushes and pull requests targeting `main`.
- Configured Node.js 22 with npm dependency caching and reproducible `npm ci` installation.
- Added automated tests, non-mutating lint checks, production builds, and production dependency audits to CI.
- Added a ten-minute job timeout, read-only repository permissions, and cancellation of superseded runs.
- Added `npm run lint:check` for local and CI validation without changing source files.
- Documented the workflow and removed continuous integration from the remaining roadmap.

### Dependency cleanup and security remediation - 2026-09-21

- Removed unused runtime dependencies: Fuse.js, Lodash, Lodash ES, and Vue Draggable Next.
- Removed the unused Vue devtools Vite plugin and its incompatible transitive inspection plugin.
- Removed unreachable recovered Pinia store files and unused Vue starter icon components.
- Upgraded Axios, PostCSS, Vite 7, and the Vue Vite plugin to patched compatible releases without major framework migrations.
- Applied reviewed non-forced transitive security updates after inspecting the audit report.
- Reduced the direct runtime dependency list to Vue and Axios.
- Verified both the complete npm audit and production-only audit with zero reported vulnerabilities.

### Automated test foundation - 2026-09-21

- Added Vitest, Vue Test Utils, and jsdom as development-only test tooling.
- Added deterministic tests for normalized snapshots, incremental updates, totals, midpoint, spread, direction, and ticker data.
- Added tests for Binance regional defaults, WebSocket routing, symbol resolution, and Kraken BTC/XBT aliases.
- Added component tests for editable and fixed market labels, compact market input, update-age display, provider defaults, switching, and browser persistence.
- Added `npm test` for one-time test runs and `npm run test:watch` for development.
- Kept tests isolated from live exchange APIs and WebSockets.

### Repository documentation - 2026-09-21

- Added a professional README grounded in the current repository implementation.
- Documented the project's operational origin, feature set, technology, architecture, and market-data flow.
- Documented Binance, Binance.US, Binance Global futures, Kraken, regional routing, and connection recovery behavior.
- Added local setup, command, Vercel deployment, limitation, and roadmap guidance.

### Market-selection affordance - 2026-09-21

- Added small `change` labels beside editable market symbols while preserving compact input such as `XRPUSD`.
- Added small `fixed` labels beside the permanent `BTCUSDT` and `ETHBTC` panels.
- Converted editable market headings into accessible buttons without adding distracting animation or large controls.
- Moved the About and Changelog navigation from the top-left to the top-right header area.

### Portfolio introduction overlay - 2026-09-21

- Added About and Changelog links to the top-left application header.
- Added an initial floating About screen that explains the dashboard's real operational purpose and restoration as a portfolio project.
- Dimmed and disabled the live dashboard while project information is open.
- Added a user-facing restoration timeline and navigation between About, Changelog, and the dashboard.
- Added keyboard dismissal, initial dialog focus, responsive layout, and reduced background scrolling for the overlay.

### Connection recovery and provider fallback - 2026-09-21

- Added a ten-second timeout for spot and futures WebSocket connection attempts.
- Added eight-second REST catalog timeouts so startup falls back to built-in markets instead of waiting indefinitely.
- Limited automatic retries to three consecutive failures so unavailable providers no longer reconnect forever.
- Added a clear provider-level failure banner that distinguishes connection failures from unavailable market symbols.
- Added manual retry without requiring a page reload.
- Added a one-click Kraken alternative when Binance cannot connect; the application never changes providers without the visitor's action.
- Kept the visitor's chosen provider stored in the browser after a manual fallback.

### Live-update visibility - 2026-09-19

- Added a brief green or red midpoint flash when the real best bid and ask produce a higher or lower midpoint.
- Added a per-panel last-updated indicator so live, delayed, and inactive feeds are easier to distinguish.
- Used one shared one-second display clock for all panels instead of creating a timer for every order book.
- Respected reduced-motion browser preferences by disabling price-flash animation when requested.

### Region-aware Binance defaults - 2026-09-19

- Verified the dashboard's Binance.US presets against the live exchange catalog.
- Replaced suspended `XRPBTC` with active `XRPUSD` for US spot visitors while retaining `XRPBTC` on Binance Global.
- Kept `BTCUSDT` and `ETHBTC` as the first two permanent spot markets in both regions.
- Made the built-in fallback catalog region-specific so it does not restore the known suspended US pair when the live catalog is unavailable.
- Changed rejected symbol feedback from "Invalid symbol" to the more accurate "Market unavailable."

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
