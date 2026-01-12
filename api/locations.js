module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const token = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!token || !baseId) return res.status(400).json({ error: 'Missing env vars' });

    const response = await fetch(`https://api.airtable.com/v0/${baseId}/Lieu`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) return res.status(response.status).json({ error: 'AT error' });

    const data = await response.json();
    const filtered = data.records
      .filter(r => r.fields['Statut Map'] === 'Publié')
      .map(r => ({ id: r.id, fields: r.fields }));

    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
