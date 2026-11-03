"use client";
import { useCallback, useRef, useState } from "react";

// Laisse le temps à Cloudflare de vérifier le visiteur, y compris s'il doit cocher la case.
export const TURNSTILE_WAIT_MS = 30000;
export const TURNSTILE_ERRORS = { FAILED: "TURNSTILE_FAILED", TIMEOUT: "TURNSTILE_TIMEOUT" };

const turnstileError = (code) => Object.assign(new Error(code), { code });

/**
 * Jeton Turnstile à usage unique. Un clic arrivé avant la fin de la vérification attend le
 * jeton (waitForToken) au lieu d'être refusé : le client n'a pas à recliquer.
 */
export const useTurnstileToken = ({ waitMs = TURNSTILE_WAIT_MS } = {}) => {
  const tokenRef = useRef("");
  const failedRef = useRef(false);
  const waitersRef = useRef([]);
  const [resetKey, setResetKey] = useState(0);

  const settleWaiters = (settle) => {
    const waiters = waitersRef.current;
    waitersRef.current = [];
    waiters.forEach(settle);
  };

  const onToken = useCallback((token) => {
    tokenRef.current = token || "";
    if (!token) return;
    failedRef.current = false;
    settleWaiters((waiter) => waiter.resolve(token));
  }, []);

  const onError = useCallback(() => {
    tokenRef.current = "";
    failedRef.current = true;
    settleWaiters((waiter) => waiter.reject(turnstileError(TURNSTILE_ERRORS.FAILED)));
  }, []);

  const waitForToken = useCallback(() => {
    if (tokenRef.current) return Promise.resolve(tokenRef.current);
    // Après un échec, un nouveau clic relance la vérification au lieu d'échouer aussitôt.
    if (failedRef.current) {
      failedRef.current = false;
      setResetKey((key) => key + 1);
    }
    return new Promise((resolve, reject) => {
      const waiter = {
        resolve: (token) => {
          clearTimeout(timer);
          resolve(token);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      };
      const timer = setTimeout(() => {
        waitersRef.current = waitersRef.current.filter((entry) => entry !== waiter);
        reject(turnstileError(TURNSTILE_ERRORS.TIMEOUT));
      }, waitMs);
      waitersRef.current.push(waiter);
    });
  }, [waitMs]);

  // Le jeton vient d'être envoyé au serveur : il ne resservira pas, on en demande un neuf.
  const consumeToken = useCallback(() => {
    tokenRef.current = "";
    failedRef.current = false;
    setResetKey((key) => key + 1);
  }, []);

  return { turnstileProps: { onToken, onError, resetKey }, waitForToken, consumeToken };
};
