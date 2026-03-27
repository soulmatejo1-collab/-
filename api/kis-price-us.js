export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ticker, token, appkey, appsecret } = req.query;
  if (!ticker || !token || !appkey) {
    return res.status(400).json({ error: 'ticker, token, appkey required' });
  }

  try {
    // 나스닥 = NAS, 뉴욕 = NYS, 아멕스 = AMS
    const url = `https://openapi.koreainvestment.com:9443/uapi/overseas-price/v1/quotations/price?AUTH=&EXCD=NAS&SYMB=${ticker}`;
    const response = await fetch(url, {
      headers: {
        'authorization': `Bearer ${token}`,
        'appkey': appkey,
        'appsecret': appsecret || '',
        'tr_id': 'HHDFS00000300',
        'custtype': 'P',
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    const data = await response.json();
    if (data?.rt_cd !== '0') {
      return res.status(200).json({ price: null, error: data?.msg1 || '조회실패', raw: data });
    }
    const out = data?.output;
    const closePrice = parseFloat(out?.base || out?.last || 0); // base=전일종가
    return res.status(200).json({
      price: closePrice || null,
      name: out?.rsym || ticker,
      currency: 'USD',
      change: out?.rate || '0',
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
