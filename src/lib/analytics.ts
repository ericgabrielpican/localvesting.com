import { shouldLoadAnalytics } from "./consent";

export async function initAnalyticsIfAllowed() {
  if (typeof window === "undefined") return;
  if (!shouldLoadAnalytics()) return;

  // Example: Firebase Analytics
  // Make sure Firebase is initialized already.
  // const { getAnalytics, isSupported } = await import("firebase/analytics");
  // if (await isSupported()) getAnalytics();

  // If you use GA4 gtag instead, you would dynamically inject the script here only after consent.
}
