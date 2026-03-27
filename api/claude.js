export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(400).json({ error: 'API key required' });

  // 최대 3번 재시도
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();

      // overloaded or rate limit → 서버에서 대기 후 재시도
      if ((response.status === 529 || response.status === 429) && attempt < 2) {
        const waitMs = (attempt + 1) * 30000; // 30초, 60초
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }

      return res.status(response.status).json(data);
    } catch (e) {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 15000));
        continue;
      }
      return res.status(500).json({ error: e.message });
    }
  }
}
