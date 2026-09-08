export const DEFAULT_LOCALE = 'en';
export const supportedLocales = ['en', 'tw'];

export function resolveLocale(value) {
  if (typeof value !== 'string') return DEFAULT_LOCALE;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'twi' || normalized === 'tw') return 'tw';
  if (supportedLocales.includes(normalized)) return normalized;
  return DEFAULT_LOCALE;
}

export function getUserLocale(user) {
  if (!user) return DEFAULT_LOCALE;
  const raw = user.preferred_language || user.locale || user.preferences;
  if (typeof raw === 'string') {
    return resolveLocale(raw);
  }
  if (raw && typeof raw === 'object') {
    return resolveLocale(raw.preferred_language || raw.locale || DEFAULT_LOCALE);
  }
  return DEFAULT_LOCALE;
}
