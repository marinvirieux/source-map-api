module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const token = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;

    const url = `https://api.airtable.com/v0/${baseId}/Lieu`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();

    // Get ALL unique "Statut Map" values
    const allStatus = {};
    data.records.forEach(r => {
      const status = r.fields['Statut Map'];
      allStatus[JSON.stringify(status)] = status;
    });

    // Show first 3 records raw
    const sample = data.records.slice(0, 3).map(r => ({
      id: r.id,
      nom: r.fields['Nom'],
      statutMap: r.fields['Statut Map'],
      statutMapLength: r.fields['Statut Map'] ? r.fields['Statut Map'].length : 0,
      statutMapCharCodes: r.fields['Statut Map'] ? Array.from(r.fields['Statut Map']).map(c => c.charCodeAt(0)) : []
    }));

    res.json({
      totalRecords: data.records.length,
      uniqueStatutValues: Object.values(allStatus),
      firstThreeSamples: sample
    });

  } catch (error) {
    res.json({ error: error.message });
  }
};
