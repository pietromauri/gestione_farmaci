import fetch from 'node-fetch';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxodh2BvY4QSlRtRRuKEw8y3nTSKi8v_WLuh-IcCyGDbt5kYhg1Xr30DaDS1jSQ8rfVTQ/exec';

async function testFetch() {
  const urlWithCacheBuster = `${SCRIPT_URL}?t=${Date.now()}`;
  const response = await fetch(urlWithCacheBuster);
  const rawData = await response.json();
  
  const medicinals = (rawData.medicinals || []).map(item => {
    const normalized = {};
    Object.keys(item).forEach(key => {
      const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_');
      let value = item[key];
      if (typeof value === 'string') {
        value = value.trim();
      }
      normalized[normalizedKey] = value;
    });
    return normalized;
  });

  let data = { medicinals, logs: [] };

  if (data.medicinals) {
    data.medicinals = data.medicinals.map((med) => {
      if (!med.giorni_settimana && med.ultima_assunzione && /^(\d+,)*\d+$/.test(med.ultima_assunzione)) {
        med.giorni_settimana = med.ultima_assunzione;
        med.ultima_assunzione = '';
      }
      return med;
    });
  }

  if (data.medicinals) {
    data.medicinals = data.medicinals.map(med => {
      if ((med.frequenza || '').toUpperCase().trim() === 'WEEKLY' && med.giorni_settimana !== undefined && med.giorni_settimana !== '') {
        // Convert to string and handle case where Google Sheets returns 6.7 instead of "6,7"
        const daysStr = String(med.giorni_settimana).replace(/\./g, ',');
        const parsed = daysStr.split(',').map(d => parseInt(d.trim(), 10)).filter(d => !isNaN(d));
        return { ...med, parsed_giorni_settimana: parsed };
      }
      return med;
    });
  }

  console.log(JSON.stringify(data.medicinals.filter(m => m.nome.includes('Eutirox')), null, 2));

  const today = new Date('2026-04-12T08:00:00Z'); // Sunday
  const adjustedDayOfWeek = 7;
  
  console.log('\n--- Filtering Results for Sunday ---');
  data.medicinals.forEach(med => {
    let shouldShow = false;
    const frequency = (med.frequenza || 'DAILY').toUpperCase().trim();

    if (frequency === 'WEEKLY') {
      if (med.parsed_giorni_settimana && Array.isArray(med.parsed_giorni_settimana)) {
        shouldShow = med.parsed_giorni_settimana.includes(adjustedDayOfWeek);
      } else if (med.giorni_settimana !== undefined && med.giorni_settimana !== '') {
        const daysStr = String(med.giorni_settimana).replace(/\./g, ',').replace(/[^\d,]/g, '');
        const allowedDays = daysStr.split(',').map(d => parseInt(d, 10)).filter(d => !isNaN(d));
        shouldShow = allowedDays.includes(adjustedDayOfWeek);
      }
    }
    if (med.nome.includes('Eutirox')) {
      console.log(`${med.nome}: shouldShow = ${shouldShow}`);
    }
  });
}

testFetch();
