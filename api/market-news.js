const ALLOWED_ASSETS = new Set(['BTC', 'ETH', 'XRP', 'SOL', 'ADA']);

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const asset = String(request.query?.asset || '').toUpperCase();
  if (!ALLOWED_ASSETS.has(asset)) {
    return response.status(400).json({ error: 'Unsupported market asset' });
  }
  if (!process.env.MARKETAUX_API_KEY) {
    return response.status(503).json({ error: 'Crypto news is not configured' });
  }

  const params = new URLSearchParams({
    api_token: process.env.MARKETAUX_API_KEY,
    symbols: `${asset}USD`,
    filter_entities: 'true',
    language: 'en',
    limit: '3'
  });

  try {
    const upstream = await fetch(`https://api.marketaux.com/v1/news/all?${params}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000)
    });
    const payload = await upstream.json();
    if (!upstream.ok) throw new Error(payload?.error?.message || 'Marketaux request failed');

    const articles = (payload.data || []).map(article => ({
      id: article.uuid,
      title: article.title,
      summary: article.description || article.snippet || '',
      url: article.url,
      source: article.source || sourceFromUrl(article.url),
      imageUrl: article.image_url || null,
      publishedAt: article.published_at,
      sentiment: sentimentFor(article, `${asset}USD`)
    }));

    response.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    return response.status(200).json({ asset, articles });
  } catch (error) {
    console.error('Unable to load Marketaux news:', error);
    return response.status(502).json({ error: 'Crypto news is temporarily unavailable' });
  }
}

function sourceFromUrl(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return 'Original source';
  }
}

function sentimentFor(article, symbol) {
  const entity = article.entities?.find(item => item.symbol === symbol);
  const score = Number(entity?.sentiment_score);
  if (!Number.isFinite(score)) return null;
  if (score > 0.15) return 'positive';
  if (score < -0.15) return 'negative';
  return 'neutral';
}
