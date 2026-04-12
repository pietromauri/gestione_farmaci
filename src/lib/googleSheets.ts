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
  ultima_assunzione?: string;
}

export const fetchDatabase = async () => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('XXXXXXXXX')) return null;
  try {
    // Aggiungiamo un timestamp per forzare Google a darci i dati freschi (evita cache)
    const urlWithCacheBuster = `${SCRIPT_URL}?t=${Date.now()}`;
    const response = await fetch(urlWithCacheBuster);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data as { medicinals: MedicationData[], logs: any[] };
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
      body: JSON.stringify({ ...med, type: 'MEDICINAL' }),
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
    const payload = {
      type: 'UPDATE_MEDICINAL',
      id: med.id,
      nome: med.nome,
      dosaggio: med.dosaggio,
      forma: med.forma,
      stock_attuale: med.stock_attuale,
      soglia: med.soglia,
      orario_1: med.orario_1 || '',
      orario_2: med.orario_2 || '',
      frequenza: med.frequenza || 'DAILY',
      ultima_assunzione: med.ultima_assunzione || '',
      giorni_settimana: med.giorni_settimana || ''
    };

    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      body: JSON.stringify(payload),
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
