// src/lib/notifications.ts
import { MedicationData } from './googleSheets';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const sentNotifications = new Set<string>();

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (Capacitor.isNativePlatform()) {
    try {
      const permStatus = await LocalNotifications.requestPermissions();
      return permStatus.display === 'granted' ? 'granted' : 'denied';
    } catch (e) {
      console.error('Errore Capacitor Notifiche:', e);
      return 'denied';
    }
  }

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
  if (Capacitor.isNativePlatform()) return null; // Non serve service worker nativo

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      return registration;
    } catch (error) {
      console.error('Registrazione del Service Worker fallita:', error);
      return null;
    }
  }
  return null;
}

export async function checkAndFireNotifications(meds: MedicationData[], permission: NotificationPermission) {
  if (permission !== 'granted') return;

  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMinute = now.getMinutes().toString().padStart(2, '0');
  const currentTimeStr = `${currentHour}:${currentMinute}`;

  const dayOfWeek = now.getDay();
  const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
  const dateStr = now.toDateString();

  meds.forEach(med => {
    let shouldNotify = false;
    const frequency = (med.frequenza || 'DAILY').toUpperCase().trim();

    if (frequency === 'DAILY') {
      shouldNotify = true;
    } else if (frequency === 'WEEKLY') {
      if (med.parsed_giorni_settimana && Array.isArray(med.parsed_giorni_settimana)) {
        shouldNotify = med.parsed_giorni_settimana.includes(adjustedDayOfWeek);
      }
    } else if (frequency === 'ALTERNATE') {
      shouldNotify = now.getDate() % 2 === 0;
    } else if (frequency === 'MONTHLY') {
      shouldNotify = now.getDate() === 1;
    }

    if (!shouldNotify) return;

    if (med.orario_1 && med.orario_1 === currentTimeStr) {
      const notificationId = `${med.id}-orario1-${dateStr}`;
      if (!sentNotifications.has(notificationId)) {
        fireNotification(med);
        sentNotifications.add(notificationId);
      }
    }

    if (med.orario_2 && med.orario_2 === currentTimeStr) {
      const notificationId = `${med.id}-orario2-${dateStr}`;
      if (!sentNotifications.has(notificationId)) {
        fireNotification(med);
        sentNotifications.add(notificationId);
      }
    }
  });
}

async function fireNotification(med: MedicationData) {
  const title = `Promemoria Medicinale: ${med.nome}`;
  const body = `È ora di prendere ${med.nome} (${med.dosaggio}).`;

  if (Capacitor.isNativePlatform()) {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Math.floor(Math.random() * 100000),
          schedule: { at: new Date(Date.now() + 1000) }, // Fire almost immediately
        }
      ]
    });
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  if (registration) {
    const options = {
      body,
      icon: '/vite.svg', 
      badge: '/vite.svg',
      data: { url: window.location.origin },
      requireInteraction: true,
      tag: `med-${med.id}`
    };
    registration.showNotification(title, options);
  }
}

export async function sendTestNotification() {
    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Test Notifica',
            body: 'Le notifiche funzionano su Android!',
            id: 999999,
            schedule: { at: new Date(Date.now() + 1000) },
          }
        ]
      });
      return;
    }

    if (Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification('Test Notifica', {
            body: 'Le notifiche funzionano correttamente!',
            icon: '/vite.svg',
            requireInteraction: true
        });
    }
}
