const TERMS_VERSION = 1;
const TERMS_KEY = "relay:terms-accepted";

export function hasAcceptedTerms(): boolean {
  try {
    const stored = localStorage.getItem(TERMS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.version === TERMS_VERSION && parsed.accepted === true;
    }
  } catch { /* ignore */ }
  return false;
}

export function acceptTerms(): void {
  try {
    localStorage.setItem(TERMS_KEY, JSON.stringify({ version: TERMS_VERSION, accepted: true }));
  } catch { /* ignore */ }
}
