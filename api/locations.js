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

    // Filter and map in one clean operation
    const filtered = data.records
      .filter(record => record.fields['Statut Map'] === 'Publié')
      .map(record => {
        const r = record.fields;
        
        // Clean images - remove empty/0 values
        const images = [
          r['Image 1 URL'],
          r['Image 2 URL'],
          r['Image 3 URL'],
          r['Image 4 URL'],
          r['Image 5 URL']
        ].filter(url => url && url !== '0' && url.trim() !== '');

        // Handle recommendedBy which could be array or string
        let recommendedBy = [];
        if (r['By ?']) {
          recommendedBy = Array.isArray(r['By ?']) ? r['By ?'] : [r['By ?']];
        }

        // Helper to get first value from linked fields
        const getFirst = (val) => {
          if (Array.isArray(val)) return val[0] || '';
          return val || '';
        };

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
          recommendedBy: recommendedBy,
          images: images,
          ville: r['Ville'] || '',
          country_en: getFirst(r['Pays EN']),
          country_fr: getFirst(r['Pays FR']),
          city_fr: getFirst(r['Ville/Region FR']),
          city_en: getFirst(r['Ville/Region EN']),
          arrondissement: getFirst(r['Arr/Ville FR/EN']),
          linked_places: r['Linked Places'] || [],
          copyrights: r['Copyrights'] || '',
          instagram: r['Instagram'] || ''
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
