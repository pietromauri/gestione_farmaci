// src/lib/googleSheets.ts
// Servizio per la persistenza dei dati su Google Sheets

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxodh2BvY4QSlRtRRuKEw8y3nTSKi8v_WLuh-IcCyGDbt5kYhg1Xr30DaDS1jSQ8rfVTQ/exec'; 

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
  if (SCRIPT_URL.includes('XXXXXXXXX')) return null;
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
  if (SCRIPT_URL.includes('XXXXXXXXX')) return false;
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

export interface MedicationLog {
  name: string;
  dosage: string;
  time: string;
  status: 'taken' | 'missed';
  date: string;
  userEmail?: string;
}

export const logMedication = async (log: MedicationLog) => {
  if (SCRIPT_URL.includes('XXXXXXXXX')) {
    console.warn("Google Sheets URL non configurato. I dati non verranno salvati esternamente.");
    return false;
  }

  // Aggiungi l'email dell'utente se loggato
  const profile = localStorage.getItem('user_profile');
  if (profile) {
    const user = JSON.parse(profile);
    log.userEmail = user.email;
  }

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Importante per bypassare i problemi di CORS con Apps Script
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow',
      body: JSON.stringify(log),
    });
    return true;
  } catch (error) {
    console.error("Errore nel salvataggio su Google Sheets:", error);
    return false;
  }
};
