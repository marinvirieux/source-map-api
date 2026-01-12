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

    // Helper function to safely get values from linked fields
    const getFirstLinkedValue = (arr) => {
      if (!arr || !Array.isArray(arr)) return '';
      return arr[0] || '';
    };

    const filtered = data.records
      .filter(r => r.fields['Statut Map'] === 'Publié')
      .map(r => {
        // Extract images and filter out empty ones
        const images = [
          r.fields['Image 1 URL'],
          r.fields['Image 2 URL'],
          r.fields['Image 3 URL'],
          r.fields['Image 4 URL'],
          r.fields['Image 5 URL']
        ].filter(img => img && img !== '' && img !== '0');

        // Extract recommended by - it might be an array or string
        let recommendedBy = [];
        if (r.fields['By ?']) {
          if (Array.isArray(r.fields['By ?'])) {
            recommendedBy = r.fields['By ?'];
          } else {
            recommendedBy = [r.fields['By ?']];
          }
        }

        return {
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
          country_en: getFirstLinkedValue(r.fields['Pays EN']),
          country_fr: getFirstLinkedValue(r.fields['Pays FR']),
          city_fr: getFirstLinkedValue(r.fields['Ville/Region FR']),
          city_en: getFirstLinkedValue(r.fields['Ville/Region EN']),
          arrondissement: getFirstLinkedValue(r.fields['Arr/Ville FR/EN']),
          linked_places: r.fields['Linked Places'] || [],
          copyrights: r.fields['Copyrights'] || '',
          instagram: r.fields['Instagram'] || '',
          cuisine_type: r.fields['Type de cuisine'] || '' // Add if you have this field
        };
      });

    res.json({ 
      success: true, 
      count: filtered.length, 
      data: filtered 
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
