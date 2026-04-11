// src/lib/googleSheets.ts
// Servizio per la persistenza dei dati su Google Sheets

// Questo URL andrà sostituito con quello fornito da Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_XXXXXXXXX/exec'; 

export interface MedicationLog {
  name: string;
  dosage: string;
  time: string;
  status: 'taken' | 'missed' | 'pending';
  date: string;
}

export const logMedication = async (log: MedicationLog) => {
  if (SCRIPT_URL.includes('XXXXXXXXX')) {
    console.warn("Google Sheets URL non configurato. I dati non verranno salvati esternamente.");
    return false;
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
