// src/lib/googleSheets.ts
// Servizio per la persistenza dei dati su Google Sheets

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxodh2BvY4QSlRtRRuKEw8y3nTSKi8v_WLuh-IcCyGDbt5kYhg1Xr30DaDS1jSQ8rfVTQ/exec'; 

export interface MedicationData {
  id: string;
  nome: string;
  dosaggio: string;
  forma: string;
  stock_attuale: number;
  soglia_rifornimento: number;
  orario_1?: string;
  orario_2?: string;
  frequenza?: 'DAILY' | 'ALTERNATE' | 'MONTHLY';
  ultima_assunzione?: string;
}

export const fetchDatabase = async () => {
  if (SCRIPT_URL.includes('XXXXXXXXX')) return null;
  try {
    const response = await fetch(SCRIPT_URL);
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
