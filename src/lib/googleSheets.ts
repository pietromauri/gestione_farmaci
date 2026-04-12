// src/lib/googleSheets.ts
// Servizio per la persistenza dei dati su Google Sheets

const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL || '';

if (!SCRIPT_URL) {
  console.warn("VITE_SCRIPT_URL non configurato negli environment variables.");
}

export interface MedicationData {
  id: string;
  nome: string;
  dosaggio: string;
  forma: string;
  stock_attuale: number;
  soglia: number;
  orario_1?: string;
  orario_2?: string;
  frequenza?: 'DAILY' | 'ALTERNATE' | 'MONTHLY' | 'WEEKLY';
  giorni_settimana?: string; // Es: "1,2,3,4,5"
  parsed_giorni_settimana?: number[];
  ultima_assunzione?: string;
}


export interface DatabaseLog {
  Nome?: string;
  name?: string;
  Data?: string;
  date?: string;
  Timestamp?: string;
  timestamp?: string;
  Orario?: string;
  time?: string;
  Stato?: string;
  status?: string;
  Dosaggio?: string;
  dosage?: string;
  Email?: string;
  userEmail?: string;
}

export const fetchDatabase = async () => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('XXXXXXXXX')) return null;
  try {
    // Aggiungiamo un timestamp per forzare Google a darci i dati freschi (evita cache)
    const urlWithCacheBuster = `${SCRIPT_URL}?t=${Date.now()}`;
    const response = await fetch(urlWithCacheBuster);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const rawData = await response.json() as { medicinals: any[], logs: any[] };
    
    // Normalizzazione chiavi e valori per i medicinali
    const medicinals = (rawData.medicinals || []).map((item: any) => {
      const normalized: any = {};
      Object.keys(item).forEach(key => {
        // "Orario 1" -> "orario_1", "Nome" -> "nome", "giorni_settimana" -> "giorni_settimana"
        const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_');
        let value = item[key];
        if (typeof value === 'string') {
          value = value.trim();
        }
        normalized[normalizedKey] = value;
      });
      return normalized as MedicationData;
    });

    // Normalizzazione chiavi e valori per i log
    const logs = (rawData.logs || []).map((item: any) => {
      const normalized: any = {};
      Object.keys(item).forEach(key => {
        const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_');
        let value = item[key];
        if (typeof value === 'string') {
          value = value.trim();
        }
        normalized[normalizedKey] = value;
      });
      return normalized as DatabaseLog;
    });

    let data = { medicinals, logs };

    // Fix shifted columns: if 'giorni_settimana' is empty but 'ultima_assunzione' contains a comma-separated list of numbers
    if (data.medicinals) {
      data.medicinals = data.medicinals.map((med) => {
        if (!med.giorni_settimana && med.ultima_assunzione && /^(\d+,)*\d+$/.test(med.ultima_assunzione)) {
          med.giorni_settimana = med.ultima_assunzione;
          med.ultima_assunzione = '';
        }
        return med;
      });
    }

    // Pre-parsing dei giorni della settimana per ottimizzazione performance
    if (data.medicinals) {
      data.medicinals = data.medicinals.map(med => {
        if (med.frequenza === 'WEEKLY' && med.giorni_settimana) {
          const daysStr = String(med.giorni_settimana);
          const parsed = daysStr.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
          return { ...med, parsed_giorni_settimana: parsed };
        }
        return med;
      });
    }

    return data;
  } catch (error) {
    console.error("Errore nel recupero del database:", error);
    return null;
  }
};

export const addMedication = async (med: MedicationData) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('XXXXXXXXX')) return false;
  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      body: JSON.stringify({
        type: 'MEDICINAL',
        ID: med.id,
        Nome: med.nome,
        Dosaggio: med.dosaggio,
        Forma: med.forma,
        'Stock Attuale': med.stock_attuale,
        Soglia: med.soglia,
        'Orario 1': med.orario_1 || '',
        'Orario 2': med.orario_2 || '',
        Frequenza: med.frequenza || '',
        'Ultima Assunzione': med.ultima_assunzione || '',
        giorni_settimana: med.giorni_settimana || ''
      }),
    });
    return true;
  } catch (error) {
    console.error("Errore nell'aggiunta del medicinale:", error);
    return false;
  }
};

export const updateMedication = async (med: MedicationData) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('XXXXXXXXX')) return false;
  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      body: JSON.stringify({
        type: 'MEDICINAL_UPDATE',
        ID: med.id,
        Nome: med.nome,
        Dosaggio: med.dosaggio,
        Forma: med.forma,
        'Stock Attuale': med.stock_attuale,
        Soglia: med.soglia,
        'Orario 1': med.orario_1 || '',
        'Orario 2': med.orario_2 || '',
        Frequenza: med.frequenza || '',
        'Ultima Assunzione': med.ultima_assunzione || '',
        giorni_settimana: med.giorni_settimana || ''
      }),
    });
    return true;
  } catch (error) {
    console.error("Errore nell'aggiornamento del medicinale:", error);
    return false;
  }
};

export interface MedicationLog {
  name: string;
  dosage: string;
  time: string;
  status: 'taken' | 'missed';
  date: string;
  userEmail?: string;
}

export const logMedication = async (log: MedicationLog) => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('XXXXXXXXX')) {
    console.warn("Google Sheets URL non configurato.");
    return false;
  }

  const profile = localStorage.getItem('user_profile');
  let email = 'anonymous';
  if (profile) {
    const user = JSON.parse(profile);
    email = user.email || 'anonymous';
  }

  try {
    // Mappatura esplicita per il foglio LOGS (Immagine 1)
    // Ordine previsto: Timestamp (auto), Nome, Dosaggio, Orario, Stato, Data, Email
    const payload = {
      type: 'LOG',
      Nome: log.name,
      Dosaggio: log.dosage,
      Orario: log.time,
      Stato: log.status,
      Data: log.date,
      Email: email
    };

    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow',
      body: JSON.stringify(payload),
    });
    return true;
  } catch (error) {
    console.error("Errore nel salvataggio su Google Sheets:", error);
    return false;
  }
};
