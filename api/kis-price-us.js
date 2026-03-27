export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ticker, token, appkey } = req.query;
  if (!ticker || !token || !appkey) {
    return res.status(400).json({ error: 'ticker, token, appkey required' });
  }

  try {
    // 한국투자증권 해외주식 현재가 API
    const url = `https://openapi.koreainvestment.com:9443/uapi/overseas-price/v1/quotations/price?AUTH=&EXCD=NAS&SYMB=${ticker}`;
    const response = await fetch(url, {
      headers: {
        'authorization': `Bearer ${token}`,
        'appkey': appkey,
        'appsecret': '',
        'tr_id': 'HHDFS00000300',
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    const price = data?.output?.last;  // 현재가 (달러)
    const closePrice = data?.output?.base || price;  // 전일 종가
    return res.status(200).json({
      price: closePrice ? parseFloat(closePrice) : null,
      name: data?.output?.rsym || ticker,
      currency: 'USD',
      raw: data?.output,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
