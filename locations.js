export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Locations`;
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
    });
    
    const data = await response.json();
    const filtered = data.records.filter(r => r.fields['Status Map'] === 'Publié');
    
    res.status(200).json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
