"use client";

import { useEffect, useState } from "react";
import { formatOfferCountdown } from "@/utils/smartOfferDisplay";

/** Compte à rebours vivant jusqu'à `validUntil` (secondes dans la dernière heure, sinon 30 s). */
export default function useOfferCountdown(validUntil) {
  const target = validUntil ? new Date(validUntil).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return undefined;
    let timer;
    const loop = () => {
      const current = Date.now();
      setNow(current);
      if (target <= current) return;
      timer = setTimeout(loop, target - current > 3600000 ? 30000 : 1000);
    };
    loop();
    return () => clearTimeout(timer);
  }, [target]);

  if (!target) return { label: "", expired: false };
  return target <= now
    ? { label: "", expired: true }
    : { label: formatOfferCountdown(target - now), expired: false };
}
