export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ticker, token, appkey, appsecret } = req.query;
  if (!ticker || !token || !appkey) {
    return res.status(400).json({ error: 'ticker, token, appkey required' });
  }

  try {
    const url = `https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-price?fid_cond_mrkt_div_code=J&fid_input_iscd=${ticker}`;
    const response = await fetch(url, {
      headers: {
        'authorization': `Bearer ${token}`,
        'appkey': appkey,
        'appsecret': appsecret || '',
        'tr_id': 'FHKST01010100',
        'custtype': 'P',
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
    const data = await response.json();
    if (data?.rt_cd !== '0') {
      return res.status(200).json({ price: null, error: data?.msg1 || '조회실패', raw: data });
    }
    const out = data?.output;
    const closePrice = parseInt(out?.stck_clpr || out?.stck_prpr || 0);
    return res.status(200).json({
      price: closePrice || null,
      name: out?.hts_kor_isnm || ticker,
      change: out?.prdy_ctrt || '0',
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
