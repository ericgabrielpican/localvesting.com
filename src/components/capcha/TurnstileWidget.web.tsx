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

const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstileScript(): Promise<void> {
  // If already available, done
  if (typeof window !== "undefined" && window.turnstile) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${TURNSTILE_SRC}"]`
    ) as HTMLScriptElement | null;

    if (existing) {
      // If it already loaded earlier, resolve (turnstile may be set slightly after load)
      if ((window as any).turnstile) return resolve();

      const onLoad = () => resolve();
      const onErr = () => reject(new Error("Turnstile script failed"));

      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onErr, { once: true });
      return;
    }

    const s = document.createElement("script");
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Turnstile script failed"));
    document.head.appendChild(s);
  });
}

export default function TurnstileWidget({
  siteKey,
  onToken,
  onExpired,
  onError,
  theme = "light",
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // ✅ Keep latest callbacks without re-rendering widget
  const onTokenRef = useRef(onToken);
  const onExpiredRef = useRef(onExpired);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // ✅ Only (re)render widget when siteKey or theme changes
  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      try {
        await loadTurnstileScript();
        if (!mountedRef.current) return;

        if (!containerRef.current) return;
        if (!window.turnstile) throw new Error("Turnstile not available");

        // If there is an existing widget, remove it only if we are changing siteKey/theme
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
          callback: (token: string) => {
            onTokenRef.current?.(token);
          },
          "expired-callback": () => {
            onExpiredRef.current?.();
          },
          "error-callback": () => {
            onErrorRef.current?.();
          },
        });

        widgetIdRef.current = id;
      } catch (e) {
        console.error("[TurnstileWidget] init error:", e);
        onErrorRef.current?.();
      }
    })();

    return () => {
      mountedRef.current = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme]);

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
      <div
        style={{
          fontSize: 12,
          color: "#6b7280",
          marginTop: 6,
          textAlign: "center",
        }}
      >
        Security check
      </div>
    </div>
  );
}
