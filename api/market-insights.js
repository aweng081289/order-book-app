const ALLOWED_OUTLOOKS = new Set(['bullish', 'bearish', 'mixed', 'neutral']);
const MAX_HEADLINES = 3;

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.GEMINI_API_KEY) {
    return response.status(503).json({ error: 'Gemini is not configured. Add a server-side API key.', code: 'CONFIGURATION' });
  }

  const market = sanitizeRequest(request.body);
  if (!market) return response.status(400).json({ error: 'Invalid market data' });

  const prompt = buildPrompt(market);
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const deadline = Date.now() + 55000;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const payload = await generateGeminiInsight(model, prompt, Math.min(25000, deadline - Date.now()));
      const insight = validateInsight(JSON.parse(payload.text));
      response.setHeader('Cache-Control', 'no-store');
      return response.status(200).json({ insight, generatedAt: new Date().toISOString(), model: payload.model || model, provider: 'Gemini' });
    } catch (error) {
      const transient = [429, 500, 502, 503, 504].includes(error.status) || ['TimeoutError', 'TypeError'].includes(error.name);
      const delay = Math.max(1000 + Math.random() * 500, error.retryAfterMs || 0);
      if (attempt === 0 && transient && Date.now() + delay + 1000 < deadline) {
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      console.error('Gemini market brief failed:', { model, status: error.status, code: error.code, message: error.message });
      const [status, code, message] = describeError(error);
      response.setHeader('Cache-Control', 'no-store');
      if (error.retryAfterMs) response.setHeader('Retry-After', String(Math.ceil(error.retryAfterMs / 1000)));
      return response.status(status).json({ error: message, code });
    }
  }
}

function describeError(error) {
  if (error.status === 429) return [429, 'RATE_LIMITED', 'Gemini usage limit reached. Please wait before retrying.'];
  if (error.name === 'TimeoutError' || error.status === 504) return [504, 'TIMEOUT', 'Gemini took too long to respond. Please try again shortly.'];
  if (error.status >= 500 || error.name === 'TypeError') return [503, 'UNAVAILABLE', 'Gemini is temporarily busy or unavailable. Please try again shortly.'];
  if ([400, 401, 403, 404].includes(error.status)) return [503, 'CONFIGURATION', 'Gemini configuration needs attention. Check the server model and API key settings.'];
  return [502, 'INVALID_RESPONSE', 'Gemini returned an incomplete market brief. Please retry.'];
}

async function generateGeminiInsight(model, prompt, timeoutMs) {
  const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.45,
        maxOutputTokens: 8192,
        ...(model.startsWith('gemini-3') ? { thinkingConfig: { thinkingLevel: 'low' } } : {}),
        responseMimeType: 'application/json',
        responseJsonSchema: insightSchema
      }
    }),
    signal: AbortSignal.timeout(timeoutMs)
  });
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const error = new Error(payload?.error?.message || 'Gemini request failed');
    error.status = upstream.status;
    error.code = payload?.error?.status;
    const retryHeader = upstream.headers?.get('retry-after');
    const retryDetail = payload?.error?.details?.find(detail => detail.retryDelay)?.retryDelay;
    error.retryAfterMs = Math.max(0, retryHeader
      ? (Number.isFinite(Number(retryHeader)) ? Number(retryHeader) * 1000 : Date.parse(retryHeader) - Date.now())
      : parseFloat(retryDetail || '0') * 1000) || 0;
    throw error;
  }
  const candidate = payload.candidates?.[0];
  if (payload.promptFeedback?.blockReason || (candidate?.finishReason && candidate.finishReason !== 'STOP')) {
    throw new Error('Incomplete Gemini response: ' + (payload.promptFeedback?.blockReason || candidate.finishReason));
  }
  return {
    text: payload.candidates?.[0]?.content?.parts?.filter(part => !part.thought).map(part => part.text || '').join(''),
    model: payload.modelVersion || model
  };
}

const insightSchema = {
  type: 'object',
  properties: {
    outlook: { type: 'string', enum: ['bullish', 'bearish', 'mixed', 'neutral'] },
    summary: { type: 'string' },
    signals: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 3 },
    risk: { type: 'string' },
    wittyTake: { type: 'string' }
  },
  required: ['outlook', 'summary', 'signals', 'risk', 'wittyTake'],
  additionalProperties: false
};

function sanitizeRequest(body = {}) {
  if (!body || typeof body !== 'object') return null;
  const symbol = String(body.symbol || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
  const metrics = body.metrics || {};
  if (!symbol || !Number.isFinite(Number(metrics.lastPrice))) return null;
  const number = value => Number.isFinite(Number(value)) ? Number(value) : null;
  return {
    symbol,
    marketType: body.marketType === 'futures' ? 'futures' : 'spot',
    timeframe: String(body.timeframe || '1h').slice(0, 5),
    metrics: {
      lastPrice: number(metrics.lastPrice),
      priceChangePercent: number(metrics.priceChangePercent),
      rangePercent: number(metrics.rangePercent),
      volatilityPercent: number(metrics.volatilityPercent),
      spreadPercent: number(metrics.spreadPercent),
      bookImbalancePercent: number(metrics.bookImbalancePercent),
      trend: ['upward', 'downward', 'sideways'].includes(metrics.trend) ? metrics.trend : 'sideways'
    },
    headlines: Array.isArray(body.headlines)
      ? body.headlines.slice(0, MAX_HEADLINES).map(item => String(item).slice(0, 180))
      : []
  };
}

function buildPrompt(market) {
  return `You are writing a concise AI Market Brief for a cryptocurrency dashboard.
Use only the supplied facts. Never invent prices, events, causes, or predictions. Do not give financial advice or tell the reader to buy or sell. Clearly express uncertainty. Keep the summary under 45 words, each signal under 20 words, the risk under 30 words, and the witty take under 25 words. The wit should be restrained and must not obscure risk.

Market data:
${JSON.stringify(market, null, 2)}`;
}

function validateInsight(value) {
  const outlook = normalizeOutlook(value?.outlook);
  if (!outlook) throw new Error('Invalid AI outlook');
  const strings = ['summary', 'risk', 'wittyTake'];
  if (strings.some(key => typeof value[key] !== 'string' || !value[key].trim())) {
    throw new Error('Incomplete AI response');
  }
  if (!Array.isArray(value.signals) || value.signals.length < 2 || value.signals.some(signal => typeof signal !== 'string' || !signal.trim())) throw new Error('Missing AI signals');
  return {
    outlook,
    summary: value.summary.trim().slice(0, 500),
    signals: value.signals.slice(0, 3).map(item => String(item).trim().slice(0, 220)),
    risk: value.risk.trim().slice(0, 350),
    wittyTake: value.wittyTake.trim().slice(0, 300)
  };
}

function normalizeOutlook(value) {
  const outlook = String(value || '').trim().toLowerCase();
  if (ALLOWED_OUTLOOKS.has(outlook)) return outlook;
  return {
    positive: 'bullish',
    negative: 'bearish',
    uncertain: 'mixed',
    volatile: 'mixed',
    sideways: 'neutral'
  }[outlook] || null;
}
