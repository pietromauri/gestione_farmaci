// src/lib/notifications.ts
import { MedicationData } from './googleSheets';

const sentNotifications = new Set<string>();

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Questo browser non supporta le notifiche desktop');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Usiamo ./sw.js invece di /sw.js per supportare GitHub Pages (percorso relativo)
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker registrato con successo:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Registrazione del Service Worker fallita:', error);
      return null;
    }
  }
  return null;
}


// ... (resto del codice)

/**
 * Controlla se è ora di prendere un medicinale (integrato con logica Eutirox)
 */

export async function checkAndFireNotifications(meds: MedicationData[]) {
  if (Notification.permission !== 'granted') return;

  const registration = await navigator.serviceWorker.ready;
  if (!registration) return;

  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMinute = now.getMinutes().toString().padStart(2, '0');
  const currentTimeStr = `${currentHour}:${currentMinute}`;

  const dayOfWeek = now.getDay();
  const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
  const dateStr = now.toDateString();

  meds.forEach(med => {
    // Logica di filtraggio per frequenza (Eutirox logic)
    let shouldNotify = true;
    if (med.frequenza === 'WEEKLY') {
      if (med.parsed_giorni_settimana) {
        shouldNotify = med.parsed_giorni_settimana.includes(adjustedDayOfWeek);
      } else if (med.giorni_settimana) {
        // Fallback per robustezza: Forza giorni_settimana a stringa per evitare crash
        const daysStr = String(med.giorni_settimana || '');
        const allowedDays = daysStr.split(',').map(d => parseInt(d.trim())).filter(n => !isNaN(n));
        shouldNotify = allowedDays.includes(adjustedDayOfWeek);
      } else {
        shouldNotify = false;
      }
    } else if (med.frequenza === 'ALTERNATE') {
      shouldNotify = now.getDate() % 2 === 0;
    } else if (med.frequenza === 'MONTHLY') {
      shouldNotify = now.getDate() === 1;
    }

    if (!shouldNotify) return;

    // Controlla orario_1
    if (med.orario_1 && med.orario_1 === currentTimeStr) {
      const notificationId = `${med.id}-orario1-${dateStr}`;
      if (!sentNotifications.has(notificationId)) {
        fireNotification(registration, med);
        sentNotifications.add(notificationId);
      }
    }

    // Controlla orario_2
    if (med.orario_2 && med.orario_2 === currentTimeStr) {
      const notificationId = `${med.id}-orario2-${dateStr}`;
      if (!sentNotifications.has(notificationId)) {
        fireNotification(registration, med);
        sentNotifications.add(notificationId);
      }
    }
  });
}

function fireNotification(registration: ServiceWorkerRegistration, med: MedicationData) {
  const title = `Promemoria Medicinale: ${med.nome}`;
  const options = {
    body: `È ora di prendere ${med.nome} (${med.dosaggio}).`,
    icon: '/vite.svg', 
    badge: '/vite.svg',
    data: { url: window.location.origin },
    requireInteraction: true,
    tag: `med-${med.id}` // Sostituisce eventuali notifiche precedenti dello stesso farmaco
  };

  registration.showNotification(title, options);
}

export async function sendTestNotification() {
    if (Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification('Test Notifica', {
            body: 'Le notifiche funzionano correttamente!',
            icon: '/vite.svg',
            requireInteraction: true
        });
    }
}
