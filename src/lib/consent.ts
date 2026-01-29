export type CookieConsentChoice = "none" | "essential" | "all";

const CONSENT_KEY = "lv_cookie_consent_v1";
const CONSENT_COOKIE = "lv_cookie_consent_v1";

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export function getConsent(): CookieConsentChoice | null {
  if (typeof window === "undefined") return null;
  const fromCookie = getCookie(CONSENT_COOKIE) as CookieConsentChoice | null;
  const fromLS = (localStorage.getItem(CONSENT_KEY) as CookieConsentChoice | null) ?? null;
  return fromCookie ?? fromLS;
}

export function setConsent(choice: CookieConsentChoice) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, choice);
  setCookie(CONSENT_COOKIE, choice, 180);
}

export function shouldLoadAnalytics(): boolean {
  return getConsent() === "all";
}

export function hasMadeChoice(): boolean {
  const c = getConsent();
  return c === "none" || c === "essential" || c === "all";
}
