import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from './market-insights.js';

const insight = { outlook: 'neutral', summary: 'Stable price.', signals: ['Small spread.', 'Sideways trend.'], risk: 'Prices can change.', wittyTake: 'A quiet moment.' };
const success = (text = JSON.stringify(insight), finishReason = 'STOP') => ({ ok: true, json: async () => ({ candidates: [{ finishReason, content: { parts: [{ text }] } }] }) });
const failure = (status, retryAfter) => ({ ok: false, status, headers: { get: () => retryAfter }, json: async () => ({ error: { message: 'Provider failure', status: 'ERROR' } }) });
async function run(body = { symbol: 'BTCUSDT', metrics: { lastPrice: 100 } }) {
  const response = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };
  await handler({ method: 'POST', body }, response);
  return response;
}

describe('Gemini market briefs', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv('GEMINI_API_KEY', 'gemini-test');
    vi.stubEnv('GEMINI_MODEL', 'gemini-3.8-flash');
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('returns a validated Gemini brief without extra calls', async () => {
    fetch.mockResolvedValueOnce(success());
    const response = await run();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain('gemini-3.8-flash:generateContent');
    const config = JSON.parse(fetch.mock.calls[0][1].body).generationConfig;
    expect(config.thinkingConfig.thinkingLevel).toBe('low');
    expect(config.responseJsonSchema.required).toContain('outlook');
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ insight, provider: 'Gemini' }));
  });

  it.each([429, 500, 502, 503, 504])('retries temporary HTTP %s once', async status => {
    fetch.mockResolvedValueOnce(failure(status)).mockResolvedValueOnce(success());
    const pending = run();
    await vi.advanceTimersByTimeAsync(999);
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.runAllTimersAsync();
    expect((await pending).status).toHaveBeenCalledWith(200);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls.every(([url]) => url.includes('generativelanguage.googleapis.com'))).toBe(true);
  });

  it('honors Retry-After before retrying', async () => {
    fetch.mockResolvedValueOnce(failure(429, '3')).mockResolvedValueOnce(success());
    const pending = run();
    await vi.advanceTimersByTimeAsync(2999);
    expect(fetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect((await pending).status).toHaveBeenCalledWith(200);
  });

  it('returns long retry delays without retrying early', async () => {
    fetch.mockResolvedValueOnce(failure(429, '120'));
    const response = await run();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(response.setHeader).toHaveBeenCalledWith('Retry-After', '120');
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'RATE_LIMITED', provider: 'Gemini', providerStatus: 429
    }));
  });

  it('identifies a confirmed Gemini 503 as provider overload', async () => {
    fetch.mockResolvedValueOnce(failure(503, '120'));
    const response = await run();
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'UNAVAILABLE', provider: 'Gemini', providerStatus: 503,
      error: expect.stringContaining('integration reached Gemini successfully')
    }));
  });

  it('stops after two timeouts with a useful error', async () => {
    fetch.mockRejectedValue(new DOMException('Timed out', 'TimeoutError'));
    const pending = run();
    await vi.runAllTimersAsync();
    expect((await pending).json).toHaveBeenCalledWith(expect.objectContaining({ code: 'TIMEOUT' }));
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each([400, 401, 403, 404])('does not retry configuration HTTP %s', async status => {
    fetch.mockResolvedValueOnce(failure(status));
    expect((await run()).json).toHaveBeenCalledWith(expect.objectContaining({ code: 'CONFIGURATION' }));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each(['bad JSON', '{}', JSON.stringify({ ...insight, signals: ['', 'ok'] })])('rejects malformed briefs', async text => {
    fetch.mockResolvedValueOnce(success(text));
    expect((await run()).json).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_RESPONSE' }));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects a truncated response even if its JSON parses', async () => {
    fetch.mockResolvedValueOnce(success(JSON.stringify(insight), 'MAX_TOKENS'));
    expect((await run()).status).toHaveBeenCalledWith(502);
  });

  it('reports missing Gemini configuration without requesting another provider', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    expect((await run()).status).toHaveBeenCalledWith(503);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([null, {}])('rejects invalid market input', async body => {
    expect((await run(body)).status).toHaveBeenCalledWith(400);
    expect(fetch).not.toHaveBeenCalled();
  });
});
