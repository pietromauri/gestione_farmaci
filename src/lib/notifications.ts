import { MedicationData } from './googleSheets';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Questo browser non supporta le notifiche desktop');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return 'denied';
}

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrato con successo:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Registrazione del Service Worker fallita:', error);
      return null;
    }
  }
  return null;
}

// Memorizziamo gli ID delle notifiche inviate per non ripeterle
const sentNotifications = new Set<string>();

export async function checkAndFireNotifications(meds: MedicationData[]) {
  if (Notification.permission !== 'granted') return;

  const registration = await navigator.serviceWorker.ready;
  if (!registration) return;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Formatta l'ora corrente come HH:MM (aggiunge zero iniziale se necessario)
  const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

  // Usiamo anche la data odierna per rendere univoco l'ID della notifica giornaliera
  const dateStr = now.toDateString();

  meds.forEach(med => {
    // Controlla orario_1
    if (med.orario_1 && med.orario_1 === currentTimeStr) {
      const notificationId = `${med.id}-orario1-${dateStr}`;
      if (!sentNotifications.has(notificationId)) {
        fireNotification(registration, med, med.orario_1);
        sentNotifications.add(notificationId);
      }
    }

    // Controlla orario_2
    if (med.orario_2 && med.orario_2 === currentTimeStr) {
      const notificationId = `${med.id}-orario2-${dateStr}`;
      if (!sentNotifications.has(notificationId)) {
        fireNotification(registration, med, med.orario_2);
        sentNotifications.add(notificationId);
      }
    }
  });
}

function fireNotification(registration: ServiceWorkerRegistration, med: MedicationData, time: string) {
  const title = `Promemoria Medicinale: ${med.nome}`;
  const options = {
    body: `È ora di prendere ${med.nome} (${med.dosaggio}).`,
    icon: '/icon-192x192.png', // Fallback se non c'è icona, il browser ne ignorerà l'assenza
    badge: '/icon-192x192.png',
    data: { url: window.location.origin }, // Cliccando torna all'app
    requireInteraction: true,
  };

  registration.showNotification(title, options);
}

export async function sendTestNotification() {
    if (Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification('Test Notifica', {
            body: 'Le notifiche funzionano correttamente!',
            icon: '/icon-192x192.png',
            requireInteraction: true
        });
    }
}
