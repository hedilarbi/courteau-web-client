"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useUser } from "./UserContext";
import { getActiveOffer, logOfferEvent } from "@/services/PersonalizedOffersServices";

const SmartOfferContext = createContext(null);

export function SmartOfferProvider({ children }) {
  const { user } = useUser();
  const [smartOffer, setSmartOfferState] = useState(null);
  const [smartOfferActivated, setSmartOfferActivated] = useState(false);
  const [showSmartOfferModal, setShowSmartOfferModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const shownOfferIdRef = useRef(null);
  const activatedOfferIdKey = "web_activatedOfferId";

  const fetchSmartOffer = useCallback(async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await getActiveOffer(userId);
      if (res.status && res.data?._id) {
        const offer = res.data;

        setSmartOfferState(offer);
        // Une Smart Offer active est appliquée automatiquement au panier.
        setSmartOfferActivated(true);

        // Show modal only once per offer
        if (shownOfferIdRef.current !== String(offer._id)) {
          shownOfferIdRef.current = String(offer._id);
          setShowSmartOfferModal(true);
          logOfferEvent(offer._id, userId, "viewed").catch(() => {});
        }
      } else {
        setSmartOfferState(null);
        setSmartOfferActivated(false);
      }
    } catch (_) {
      setSmartOfferState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (userId) {
      fetchSmartOffer(userId);
    } else {
      setSmartOfferState(null);
      setSmartOfferActivated(false);
    }
  }, [user?._id, user?.id, fetchSmartOffer]);

  const activateSmartOffer = useCallback(() => {
    setSmartOfferActivated(true);
    if (smartOffer?._id) {
      try {
        localStorage.setItem(activatedOfferIdKey, String(smartOffer._id));
      } catch (_) {}
    }
  }, [smartOffer?._id]);

  const deactivateSmartOffer = useCallback(() => {
    setSmartOfferActivated(false);
    try {
      localStorage.removeItem(activatedOfferIdKey);
    } catch (_) {}
  }, []);

  const clearSmartOffer = useCallback(() => {
    setSmartOfferState(null);
    setSmartOfferActivated(false);
    shownOfferIdRef.current = null;
    try {
      localStorage.removeItem(activatedOfferIdKey);
    } catch (_) {}
  }, []);

  return (
    <SmartOfferContext.Provider
      value={{
        smartOffer,
        smartOfferActivated,
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
