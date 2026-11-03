"use client";
import { useEffect, useRef } from "react";

const SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

let scriptPromise = null;

const loadTurnstile = () => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve(window.turnstile);
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Turnstile indisponible"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
};

// Vérification anti-robot Cloudflare, exigée par le serveur avant tout envoi de code SMS.
// Le plus souvent invisible ; un jeton ne sert qu'une fois : changer resetKey en demande un neuf.
// onError : vérification impossible (script bloqué, clé absente, échec Cloudflare).
const TurnstileWidget = ({ onToken, onError, resetKey = 0 }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);
  onTokenRef.current = onToken;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        if (!SITE_KEY) {
          onErrorRef.current?.();
          return;
        }
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          language: "fr",
          appearance: "interaction-only",
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(""),
          "error-callback": () => {
            onTokenRef.current("");
            onErrorRef.current?.();
          },
        });
      })
      .catch(() => {
        onTokenRef.current("");
        onErrorRef.current?.();
      });
    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null) window.turnstile?.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetKey === 0) return;
    // Aucun widget à relancer (script bloqué, clé absente) : inutile de faire attendre.
    if (widgetIdRef.current === null) {
      onErrorRef.current?.();
      return;
    }
    onTokenRef.current("");
    window.turnstile?.reset(widgetIdRef.current);
  }, [resetKey]);

  return <div ref={containerRef} className="flex justify-center my-2" />;
};

export default TurnstileWidget;
