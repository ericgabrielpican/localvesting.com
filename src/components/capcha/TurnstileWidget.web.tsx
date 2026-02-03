import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: any) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

type Props = {
  siteKey: string;
  onToken: (token: string) => void;
  onExpired?: () => void;
  onError?: () => void;
  theme?: "light" | "dark" | "auto";
};

export default function TurnstileWidget({
  siteKey,
  onToken,
  onExpired,
  onError,
  theme = "light",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        if (scriptLoadedRef.current || window.turnstile) {
          scriptLoadedRef.current = true;
          resolve();
          return;
        }

        const existing = document.querySelector(
          'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]'
        ) as HTMLScriptElement | null;

        if (existing) {
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", () => reject(new Error("Turnstile script failed")));
          return;
        }

        const s = document.createElement("script");
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        s.async = true;
        s.defer = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Turnstile script failed"));
        document.head.appendChild(s);
      });

    (async () => {
      try {
        await loadScript();
        if (cancelled) return;
        if (!containerRef.current) return;
        if (!window.turnstile) throw new Error("Turnstile not available");

        // cleanup previous widget if re-render
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {}
          widgetIdRef.current = null;
        }

        // Render widget
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          callback: (token: string) => onToken(token),
          "expired-callback": () => onExpired?.(),
          "error-callback": () => onError?.(),
        });

        widgetIdRef.current = id;
      } catch (e) {
        console.error("[TurnstileWidget] init error:", e);
        onError?.();
      }
    })();

    return () => {
      cancelled = true;
      // remove widget on unmount
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme, onToken, onExpired, onError]);

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 10,
        background: "#fff",
      }}
    >
      <div ref={containerRef} />
      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6, textAlign: "center" }}>
        Security check
      </div>
    </div>
  );
}
