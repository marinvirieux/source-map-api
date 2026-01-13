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

    const filtered = data.records
      .filter(record => record.fields['Statut Map'] === 'Publié')
      .map(record => {
        const r = record.fields;
        
        const images = [
          r['Image 1 URL'],
          r['Image 2 URL'],
          r['Image 3 URL'],
          r['Image 4 URL'],
          r['Image 5 URL']
        ].filter(url => url && url !== '0' && url.trim() !== '');

        let recommendedBy = [];
        if (r['By ?']) {
          recommendedBy = Array.isArray(r['By ?']) ? r['By ?'] : [r['By ?']];
        }

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
    res.json({ success: false, error: error.message });
  }
};
