module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
      throw new Error('Missing environment variables');
    }

    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Lieu`;

    const airtableResponse = await fetch(airtableUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!airtableResponse.ok) {
      const errorText = await airtableResponse.text();
      throw new Error(`Airtable error: ${airtableResponse.status}`);
    }

    const airtableData = await airtableResponse.json();

    const filtered = airtableData.records
      .filter(record => record.fields['Status Map'] === 'Publié')
      .map(record => ({
        id: record.id,
        fields: record.fields,
      }));

    return res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      data: [],
    });
  }
};
