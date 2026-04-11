// src/hooks/useNotificationManager.ts
import { useEffect, useRef } from 'react';
import { fetchDatabase } from '@/lib/googleSheets';
import { getDueTasks, sendNotification } from '@/lib/notifications';
import { mockSchedules, mockMedications } from '@/lib/mockData';

export const useNotificationManager = () => {
  const lastNotifiedMinute = useRef<string>('');

  useEffect(() => {
    const checkNotifications = async () => {
      const now = new Date();
      const currentMinute = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Evita notifiche multiple nello stesso minuto
      if (currentMinute === lastNotifiedMinute.current) return;

      const db = await fetchDatabase();
      let tasks = [];

      if (db && db.medicinals) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

        // Converti i medicinali del DB in task
        db.medicinals.forEach(med => {
          let shouldNotify = true;
          if (med.frequenza === 'WEEKLY' && med.giorni_settimana) {
            const allowedDays = med.giorni_settimana.split(',').map(d => parseInt(d.trim()));
            shouldNotify = allowedDays.includes(adjustedDayOfWeek);
          } else if (med.frequenza === 'ALTERNATE') {
            shouldNotify = today.getDate() % 2 === 0;
          } else if (med.frequenza === 'MONTHLY') {
            shouldNotify = today.getDate() === 1;
          }

          if (shouldNotify) {
            if (med.orario_1) tasks.push({ time: med.orario_1, title: med.nome, status: 'PENDING' });
            if (med.orario_2) tasks.push({ time: med.orario_2, title: med.nome, status: 'PENDING' });
          }
        });
      }
 else {
        // Fallback ai mock
        mockSchedules.forEach(s => {
          const med = mockMedications.find(m => m.id === s.medicationId);
          if (med) tasks.push({ time: s.time, title: med.name, status: 'PENDING' });
        });
      }

      const dueTasks = getDueTasks(tasks);
      
      dueTasks.forEach(task => {
        sendNotification(`È ora di: ${task.title}`, {
          body: `Orario previsto: ${task.time}. Tocca per aprire l'app.`,
          tag: `med-${task.title}-${task.time}`, // Evita duplicati
          renotify: true
        });
      });

      if (dueTasks.length > 0) {
        lastNotifiedMinute.current = currentMinute;
      }
    };

    // Controllo ogni 30 secondi per precisione
    const interval = setInterval(checkNotifications, 30000);
    
    // Esegui subito al caricamento
    checkNotifications();

    return () => clearInterval(interval);
  }, []);
};
