// src/hooks/useNotificationManager.ts
import { useEffect, useState, useRef } from 'react';
import { fetchDatabase, MedicationData } from '../lib/googleSheets';
import { mockMedications } from '../lib/mockData';
import { registerServiceWorker, requestNotificationPermission, checkAndFireNotifications } from '../lib/notifications';

export function useNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [meds, setMeds] = useState<MedicationData[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize service worker and check permission
  useEffect(() => {
    const init = async () => {
      await registerServiceWorker();
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
    };
    init();
  }, []);

  // Fetch medications periodically
  useEffect(() => {
    const loadMeds = async () => {
      const db = await fetchDatabase();
      if (db && db.medicinals && db.medicinals.length > 0) {
        setMeds(db.medicinals);
      } else {
        // Fallback ai mock
        setMeds(mockMedications.map(m => ({
          id: m.id,
          nome: m.name,
          dosaggio: m.dosage,
          forma: m.form,
          stock_attuale: m.currentStock || 0,
          soglia: m.refillThreshold || 0,
          orario_1: '08:00',
          orario_2: '20:00'
        })));
      }
    };

    loadMeds();

    // Ricarica i dati ogni 10 minuti
    const fetchInterval = setInterval(loadMeds, 10 * 60 * 1000);
    return () => clearInterval(fetchInterval);
  }, []);

  // Check notifications every minute
  useEffect(() => {
    if (permission !== 'granted' || meds.length === 0) return;

    // Run once immediately
    checkAndFireNotifications(meds);

    // Then check every minute (60s)
    intervalRef.current = setInterval(() => {
      checkAndFireNotifications(meds);
    }, 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [meds, permission]);

  const requestPermission = async () => {
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
    return newPermission === 'granted';
  };

  return {
    permission,
    requestPermission,
  };
}
