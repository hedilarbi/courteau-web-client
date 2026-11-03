import { act, renderHook } from "@testing-library/react";

import { TURNSTILE_ERRORS, useTurnstileToken } from "@/hooks/useTurnstileToken";

afterEach(() => jest.useRealTimers());

// Régression : un clic arrivé avant la fin de la vérification Cloudflare était refusé et
// le client devait recliquer. Il attend maintenant le jeton.
test("un jeton demandé avant la fin de la vérification est remis dès qu'il arrive", async () => {
  const { result } = renderHook(() => useTurnstileToken());

  const pending = result.current.waitForToken();
  act(() => result.current.turnstileProps.onToken("jeton-1"));

  await expect(pending).resolves.toBe("jeton-1");
});

test("un jeton déjà prêt est remis tout de suite", async () => {
  const { result } = renderHook(() => useTurnstileToken());
  act(() => result.current.turnstileProps.onToken("jeton-1"));

  await expect(result.current.waitForToken()).resolves.toBe("jeton-1");
});

test("sans jeton après le délai, l'attente échoue avec TURNSTILE_TIMEOUT", async () => {
  jest.useFakeTimers();
  const { result } = renderHook(() => useTurnstileToken({ waitMs: 1000 }));

  const pending = result.current.waitForToken();
  jest.advanceTimersByTime(1000);

  await expect(pending).rejects.toMatchObject({ code: TURNSTILE_ERRORS.TIMEOUT });
});

test("un échec de Cloudflare arrête l'attente, un nouveau clic relance la vérification", async () => {
  const { result } = renderHook(() => useTurnstileToken());

  const pending = result.current.waitForToken();
  act(() => result.current.turnstileProps.onError());
  await expect(pending).rejects.toMatchObject({ code: TURNSTILE_ERRORS.FAILED });

  const resetKeyBefore = result.current.turnstileProps.resetKey;
  let retry;
  act(() => {
    retry = result.current.waitForToken();
  });
  expect(result.current.turnstileProps.resetKey).toBe(resetKeyBefore + 1);
  act(() => result.current.turnstileProps.onToken("jeton-2"));
  await expect(retry).resolves.toBe("jeton-2");
});

test("un jeton envoyé au serveur n'est pas réutilisé : un neuf est demandé", async () => {
  const { result } = renderHook(() => useTurnstileToken());
  act(() => result.current.turnstileProps.onToken("jeton-1"));

  act(() => result.current.consumeToken());
  expect(result.current.turnstileProps.resetKey).toBe(1);

  const pending = result.current.waitForToken();
  act(() => result.current.turnstileProps.onToken("jeton-2"));
  await expect(pending).resolves.toBe("jeton-2");
});
