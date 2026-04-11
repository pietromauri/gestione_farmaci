// src/lib/notifications.ts
// Servizio per la gestione delle notifiche browser

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.error("Questo browser non supporta le notifiche desktop");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      icon: '/vite.svg', // Icona dell'app
      badge: '/vite.svg',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
};

/**
 * Controlla se è ora di prendere un medicinale
 * @param tasks Lista dei task del giorno
 * @returns I task che dovrebbero essere notificati ora
 */
export const getDueTasks = (tasks: any[]) => {
  const now = new Date();
  const currentHour = now.getHours().toString().padStart(2, '0');
  const currentMinute = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;

  return tasks.filter(task => {
    // Notifichiamo solo se è PENDING e l'orario corrisponde esattamente al minuto corrente
    return task.status === 'PENDING' && task.time === currentTime;
  });
};
