import { NotificationPreferences } from '../types';

const NOTIF_PREFS_KEY = 'titan_notif_preferences';

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: true,
  events: true,
  achievements: true,
  reminders: true,
};

export function getNotificationPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    if (raw) {
      return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to parse notification preferences:', e);
  }
  return DEFAULT_PREFS;
}

export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
}
