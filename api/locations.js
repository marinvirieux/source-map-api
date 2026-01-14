module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  try {
    const token = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;

    if (!token || !baseId) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const url = `https://api.airtable.com/v0/${baseId}/Lieu`;
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Airtable error' });
    }

    const data = await response.json();

    const filtered = data.records
      .filter(record => {
        const status = record.fields['Statut Map'];
        return status && status.trim().toLowerCase() === 'publié';
      })
      .map(record => {
        const r = record.fields;
        
        // Helper to get first value from linked fields (arrays)
        const getFirst = (val) => {
          if (Array.isArray(val)) return val[0] || '';
          return val || '';
        };

      

        // Parse Image Gallerie URLs - comma-separated string, return as array for map
        let images = [];
        if (r['Image Gallerie URLs']) {
          images = r['Image Gallerie URLs']
            .split(',')
            .map(url => url.trim())
            .filter(url => url && url !== '0' && url !== '');
        }

        return {
          id: record.id,
          name: r['Nom'] || '',
          category: r['Catégorie'] || '',
          latitude: parseFloat(r['Latitude']) || null,
          longitude: parseFloat(r['Longitude']) || null,
          description_fr: r['Description FR'] || '',
          description_en: r['Description EN'] || '',
          address: r['Adresse'] || '',
          phone: r['Téléphone'] || '',
          website: r['Site web'] || '',
          booking: r['Lien Booking'] || '',
          recommendedBy: r['By ?'] || '',
          images: images,
          ville: r['Ville'] || '',
          country_en: getFirst(r['Pays EN']),
          country_fr: getFirst(r['Pays FR']),
          city_fr: getFirst(r['Ville/Region FR']),
          city_en: getFirst(r['Ville/Region EN']),
          arrondissement: getFirst(r['Arr/Ville FR/EN']),
          linked_places: r['Multiples addresses'] || [],
          copyrights: r['Copyrights'] || ''
        };
      });

    res.json({ 
      success: true,
      count: filtered.length,
      data: filtered
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
};
