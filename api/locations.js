
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

    // DEBUG: Check if we got records
    if (!data.records || !Array.isArray(data.records)) {
      return res.status(500).json({ 
        error: 'Invalid Airtable response', 
        debug: {
          hasRecords: !!data.records,
          isArray: Array.isArray(data.records),
          dataKeys: Object.keys(data)
        }
      });
    }

    // DEBUG: Check how many records match the filter
    const matchingRecords = data.records.filter(r => r.fields['Statut Map'] === 'Publié');
    
    const filtered = matchingRecords.map(r => {
      // Debug first record
      const isFirstRecord = matchingRecords.indexOf(r) === 0;
      
      const images = [
        r.fields['Image 1 URL'],
        r.fields['Image 2 URL'],
        r.fields['Image 3 URL'],
        r.fields['Image 4 URL'],
        r.fields['Image 5 URL']
      ].filter(img => img && img !== '' && img !== '0');

      let recommendedBy = [];
      if (r.fields['By ?']) {
        if (Array.isArray(r.fields['By ?'])) {
          recommendedBy = r.fields['By ?'];
        } else {
          recommendedBy = [r.fields['By ?']];
        }
      }

      const mapped = {
        id: r.id,
        name: r.fields['Nom'] || '',
        category: r.fields['Catégorie'] || '',
        latitude: r.fields['Latitude'] || null,
        longitude: r.fields['Longitude'] || null,
        description_fr: r.fields['Description FR'] || '',
        description_en: r.fields['Description EN'] || '',
        address: r.fields['Adresse'] || '',
        phone: r.fields['Téléphone'] || '',
        website: r.fields['Site web'] || '',
        booking: r.fields['Lien Booking'] || '',
        recommendedBy: recommendedBy,
        images: images,
        ville: r.fields['Ville'] || '',
        country_en: (r.fields['Pays EN'] && r.fields['Pays EN'][0]) ? r.fields['Pays EN'][0] : '',
        country_fr: (r.fields['Pays FR'] && r.fields['Pays FR'][0]) ? r.fields['Pays FR'][0] : '',
        city_fr: (r.fields['Ville/Region FR'] && r.fields['Ville/Region FR'][0]) ? r.fields['Ville/Region FR'][0] : '',
        city_en: (r.fields['Ville/Region EN'] && r.fields['Ville/Region EN'][0]) ? r.fields['Ville/Region EN'][0] : '',
        arrondissement: (r.fields['Arr/Ville FR/EN'] && r.fields['Arr/Ville FR/EN'][0]) ? r.fields['Arr/Ville FR/EN'][0] : '',
        linked_places: r.fields['Linked Places'] || [],
        copyrights: r.fields['Copyrights'] || '',
        instagram: r.fields['Instagram'] || ''
      };

      // Log first record to debug
      if (isFirstRecord) {
        console.log('FIRST RECORD MAPPED:', mapped);
      }

      return mapped;
    });

    res.status(200).json({ 
      success: true, 
      count: filtered.length,
      totalRecords: data.records.length,
      publishedRecords: matchingRecords.length,
      data: filtered 
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
};
