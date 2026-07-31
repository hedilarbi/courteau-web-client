"use client";

import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useSmartOffer } from "@/context/SmartOfferContext";
import { logOfferEvent } from "@/services/PersonalizedOffersServices";
import { useRouter } from "next/navigation";

const OFFER_ICONS = {
  discount_order: "💸",
  bonus_basket: "🛒",
  discount_category: "🏷️",
  free_delivery: "🚚",
  free_item: "🎁",
};

export default function SmartOfferModal() {
  const { user } = useUser();
  const {
    smartOffer,
    showSmartOfferModal,
    setShowSmartOfferModal,
  } = useSmartOffer();
  const router = useRouter();

  const [countdown, setCountdown] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!showSmartOfferModal || !smartOffer?.validUntil) {
      clearInterval(intervalRef.current);
      return;
    }

    const compute = () => {
      const diff = new Date(smartOffer.validUntil).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown("Expirée");
        clearInterval(intervalRef.current);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };
    compute();
    intervalRef.current = setInterval(compute, 1000);
    return () => clearInterval(intervalRef.current);
  }, [showSmartOfferModal, smartOffer?.validUntil]);

  if (!showSmartOfferModal || !smartOffer) return null;

  const userId = user?._id || user?.id;
  const icon = OFFER_ICONS[smartOffer.offerType] || "🎁";

  const handleOrder = () => {
    if (userId) logOfferEvent(smartOffer._id, userId, "clicked").catch(() => {});
    setShowSmartOfferModal(false);
    router.push("/menu");
  };

  const handleClose = () => {
    setShowSmartOfferModal(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={handleClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full mx-4"
        style={{ border: "1px solid #E5E7EB" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top gradient bar */}
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: "#F7A600" }}
        />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black transition-colors text-xl font-bold cursor-pointer z-10"
          aria-label="Fermer"
        >
          ✕
        </button>

        <div className="p-6 pt-5">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold tracking-widest text-[#F7A600] uppercase">
              ✦ Offre personnalisée
            </span>
          </div>

          {/* Countdown */}
          {smartOffer.validUntil && countdown && countdown !== "Expirée" && (
            <div
              className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl"
              style={{ backgroundColor: "#FFF7E0", border: "1px solid #F7A600" }}
            >
              <span className="text-[#F7A600] text-sm">⏱️</span>
              <span className="font-mono font-bold text-black text-sm">{countdown}</span>
              <span className="text-gray-600 text-xs ml-1">avant expiration</span>
            </div>
          )}

          {/* Offer icon + label */}
          <div className="flex items-start gap-4 mb-5">
            <div
              className="text-4xl w-16 h-16 flex items-center justify-center rounded-2xl shrink-0"
              style={{ backgroundColor: "#F7A600" }}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-black font-bold text-lg leading-snug">
                {smartOffer.notificationTitle}
              </p>
            </div>
          </div>

          {/* Body / description */}
          {smartOffer.notificationBody && (
            <p className="text-gray-600 text-sm mb-5 leading-relaxed">
              {smartOffer.notificationBody}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="space-y-3 mt-4">
            <button
              onClick={handleOrder}
              className="w-full py-3 rounded-2xl font-bold text-base text-black transition-all hover:brightness-110 active:scale-95 cursor-pointer"
              style={{ backgroundColor: "#F7A600" }}
            >
              Commander maintenant
            </button>
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-2xl font-semibold text-sm text-gray-600 hover:text-black transition-colors cursor-pointer"
              style={{ backgroundColor: "white", border: "1px solid #D1D5DB" }}
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
