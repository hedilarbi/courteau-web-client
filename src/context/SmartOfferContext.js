"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { useUser } from "./UserContext";
import {
  getActiveOffer,
  getLastExpiredOffer,
  logOfferEvent,
} from "@/services/PersonalizedOffersServices";

const SmartOfferContext = createContext(null);
const DISABLED_OFFER_KEY = "web_disabledOfferId";

const readDisabledOfferId = () => {
  try {
    return localStorage.getItem(DISABLED_OFFER_KEY) || null;
  } catch (_) {
    return null;
  }
};

export function SmartOfferProvider({ children }) {
  const { user } = useUser();
  const [smartOffer, setSmartOfferState] = useState(null);
  // Offre expirée : reste affichée ("Offre expirée") tant qu'aucune nouvelle offre n'est active.
  const [expiredOffer, setExpiredOffer] = useState(null);
  // Désactivation manuelle (checkout) liée à UNE offre : survit aux changements de page et
  // aux rechargements, mais ne s'applique jamais à une nouvelle offre.
  const [disabledOfferId, setDisabledOfferId] = useState(null);
  const [showSmartOfferModal, setShowSmartOfferModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const shownOfferIdRef = useRef(null);

  useEffect(() => {
    setDisabledOfferId(readDisabledOfferId());
  }, []);

  const openModalOnce = (offerId) => {
    if (shownOfferIdRef.current === String(offerId)) return;
    shownOfferIdRef.current = String(offerId);
    setShowSmartOfferModal(true);
  };

  // silent : rafraîchissement en arrière-plan (retour sur l'onglet / l'accueil), sans état de chargement.
  const fetchSmartOffer = useCallback(async (userId, { silent = false } = {}) => {
    if (!userId) return;
    if (!silent) setLoading(true);
    try {
      const res = await getActiveOffer(userId);
      const offer = res.status && res.data?._id ? res.data : null;
      const stillValid =
        offer && (!offer.validUntil || new Date(offer.validUntil).getTime() > Date.now());

      if (stillValid) {
        setSmartOfferState(offer);
        setExpiredOffer(null);
        if (shownOfferIdRef.current !== String(offer._id)) {
          logOfferEvent(offer._id, userId, "viewed").catch(() => {});
        }
        openModalOnce(offer._id);
        return;
      }

      setSmartOfferState(null);
      const lastExpired = offer || (await getLastExpiredOffer(userId))?.data;
      setExpiredOffer(lastExpired?._id ? lastExpired : null);
      if (lastExpired?._id) openModalOnce(lastExpired._id);
    } catch (_) {
      // Rafraîchissement silencieux raté (réseau) : on garde l'offre déjà affichée.
      if (!silent) setSmartOfferState(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId) {
      fetchSmartOffer(userId);
    } else {
      setSmartOfferState(null);
      setExpiredOffer(null);
    }
  }, [user?._id, user?.id, fetchSmartOffer]);

  // Comme l'app (retour sur l'accueil / app rouverte) : l'offre est rechargée quand l'onglet
  // redevient visible et à chaque retour sur la page d'accueil (nouvelle offre, offre utilisée…).
  const pathname = usePathname();
  const lastSilentRefreshRef = useRef(0);
  const silentRefresh = useCallback(() => {
    const userId = user?._id || user?.id;
    if (!userId) return;
    if (Date.now() - lastSilentRefreshRef.current < 10000) return;
    lastSilentRefreshRef.current = Date.now();
    fetchSmartOffer(userId, { silent: true });
  }, [user?._id, user?.id, fetchSmartOffer]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") silentRefresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [silentRefresh]);

  const previousPathnameRef = useRef(pathname);
  useEffect(() => {
    const previous = previousPathnameRef.current;
    previousPathnameRef.current = pathname;
    // Premier rendu : déjà couvert par le chargement initial.
    if (pathname === "/" && previous !== "/") silentRefresh();
  }, [pathname, silentRefresh]);

  // L'offre expire pendant la navigation : elle passe en "expirée" (affichée, plus utilisable).
  useEffect(() => {
    if (!smartOffer?.validUntil) return undefined;
    const remaining = new Date(smartOffer.validUntil).getTime() - Date.now();
    const expire = () => {
      setExpiredOffer(smartOffer);
      setSmartOfferState(null);
    };
    if (remaining <= 0) {
      expire();
      return undefined;
    }
    // setTimeout est limité à ~24,8 jours : au-delà, on revérifiera au prochain rendu.
    const timer = setTimeout(expire, Math.min(remaining, 2147483000));
    return () => clearTimeout(timer);
  }, [smartOffer]);

  const smartOfferManuallyDisabled = Boolean(
    smartOffer?._id && disabledOfferId === String(smartOffer._id)
  );

  const deactivateSmartOffer = useCallback(() => {
    if (!smartOffer?._id) return;
    setDisabledOfferId(String(smartOffer._id));
    try {
      localStorage.setItem(DISABLED_OFFER_KEY, String(smartOffer._id));
    } catch (_) {}
  }, [smartOffer?._id]);

  const activateSmartOffer = useCallback(() => {
    setDisabledOfferId(null);
    try {
      localStorage.removeItem(DISABLED_OFFER_KEY);
    } catch (_) {}
  }, []);

  const clearSmartOffer = useCallback(() => {
    setSmartOfferState(null);
    setExpiredOffer(null);
    shownOfferIdRef.current = null;
    setDisabledOfferId(null);
    try {
      localStorage.removeItem(DISABLED_OFFER_KEY);
    } catch (_) {}
  }, []);

  return (
    <SmartOfferContext.Provider
      value={{
        smartOffer,
        expiredOffer,
        // Offre utilisable (existe ET pas désactivée manuellement) : ce que lisent panier,
        // checkout, menu… Le checkout lit aussi `smartOfferAvailable` (brut) pour proposer
        // de réactiver une offre désactivée.
        smartOfferActivated: Boolean(smartOffer) && !smartOfferManuallyDisabled,
        smartOfferAvailable: Boolean(smartOffer),
        smartOfferManuallyDisabled,
        showSmartOfferModal,
        setShowSmartOfferModal,
        loading,
        activateSmartOffer,
        deactivateSmartOffer,
        clearSmartOffer,
        refetchSmartOffer: () => fetchSmartOffer(user?._id || user?.id),
      }}
    >
      {children}
    </SmartOfferContext.Provider>
  );
}

export function useSmartOffer() {
  const ctx = useContext(SmartOfferContext);
  if (!ctx) throw new Error("useSmartOffer must be used within SmartOfferProvider");
  return ctx;
}
