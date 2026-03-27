export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ticker, token, appkey } = req.query;
  if (!ticker || !token || !appkey) {
    return res.status(400).json({ error: 'ticker, token, appkey required' });
  }

  try {
    const url = `https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-price?fid_cond_mrkt_div_code=J&fid_input_iscd=${ticker}`;
    const response = await fetch(url, {
      headers: {
        'authorization': `Bearer ${token}`,
        'appkey': appkey,
        'appsecret': '',
        'tr_id': 'FHKST01010100',
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    const price = data?.output?.stck_prpr;  // 현재가
    const closePrice = data?.output?.stck_clpr || price;  // 전일 종가
    return res.status(200).json({
      price: closePrice ? parseInt(closePrice) : null,
      name: data?.output?.hts_kor_isnm || ticker,
      raw: data?.output,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
