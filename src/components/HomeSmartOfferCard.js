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
  loyalty_points: "⭐",
};

const getOfferLabel = (offer) => {
  if (!offer) return "Offre spéciale";
  switch (offer.offerType) {
    case "discount_order":
      return `${offer.discountValue}% de rabais sur commande`;
    case "bonus_basket":
      return `${offer.discountValue}$ de rabais dès ${offer.bonusThreshold}$`;
    case "discount_category":
      return `${offer.discountValue}% sur ${offer.targetCategory?.name || "une catégorie"}`;
    case "free_delivery":
      return "Livraison gratuite";
    case "free_item":
      return offer.freeItems?.length
        ? `${offer.freeItems
            .map((entry) => {
              const name = entry?.item?.name || "Article";
              return entry?.size ? `${name} (${entry.size})` : name;
            })
            .join(" ou ")} offert`
        : offer.freeItem?.name
        ? `${offer.freeItem.name} offert`
        : offer.targetCategory?.name
        ? `Article offert (${offer.targetCategory.name})`
        : "Article offert";
    case "loyalty_points":
      return `${Math.floor(Number(offer.bonusPoints) || 0)} points bonus dès ${Number(offer.bonusThreshold) || 0}$`;
    default:
      return "Offre exclusive";
  }
};

export default function HomeSmartOfferCard() {
  const { user } = useUser();
  const {
    smartOffer,
    smartOfferActivated,
    setShowSmartOfferModal,
  } = useSmartOffer();
  const router = useRouter();
  const [countdown, setCountdown] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!smartOffer?.validUntil) {
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
  }, [smartOffer?.validUntil]);

  if (!smartOffer) return null;

  const userId = user?._id || user?.id;
  const icon = OFFER_ICONS[smartOffer.offerType] || "🎁";

  const handleCardClick = () => {
    if (userId) logOfferEvent(smartOffer._id, userId, "clicked").catch(() => {});
    setShowSmartOfferModal(true);
  };

  const handleOrderClick = (e) => {
    e.stopPropagation();
    router.push("/menu");
  };

  return (
    <div className="md:px-14 px-4 mt-4">
      <button
        onClick={handleCardClick}
        className="w-full text-left rounded-2xl overflow-hidden cursor-pointer transition-all hover:brightness-105 active:scale-[0.99]"
        style={{
          background: smartOfferActivated
            ? "linear-gradient(135deg, #052E16 0%, #064E3B 100%)"
            : "linear-gradient(135deg, #111827 0%, #1F2937 100%)",
          border: `1px solid ${smartOfferActivated ? "#10B981" : "#374151"}`,
          boxShadow: smartOfferActivated
            ? "0 4px 24px rgba(16,185,129,0.15)"
            : "0 4px 24px rgba(247,166,0,0.1)",
        }}
      >
        {/* Top accent line */}
        <div
          className="h-1"
          style={{
            background: smartOfferActivated
              ? "linear-gradient(90deg, #10B981, #34D399)"
              : "linear-gradient(90deg, #F7A600, #FF6B35, #F7A600)",
          }}
        />

        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Icon badge */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{
                  background: smartOfferActivated
                    ? "linear-gradient(135deg, #10B981, #059669)"
                    : "linear-gradient(135deg, #F7A600, #FF6B35)",
                }}
              >
                {icon}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs font-bold tracking-widest uppercase"
                    style={{ color: smartOfferActivated ? "#10B981" : "#F7A600" }}
                  >
                    {smartOfferActivated ? "✅ Offre activée" : "✦ Offre personnalisée"}
                  </span>
                </div>
                <p className="font-bold text-white text-sm mt-0.5 truncate">
                  {getOfferLabel(smartOffer)}
                </p>
                {countdown && countdown !== "Expirée" && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-gray-400">⏱️</span>
                    <span className="font-mono font-bold text-xs text-gray-300">
                      {countdown}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right side CTA */}
            {smartOfferActivated ? (
              <button
                onClick={handleOrderClick}
                className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-all hover:brightness-110 active:scale-95"
                style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
              >
                Commander →
              </button>
            ) : (
              <div
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: "#374151" }}
              >
                <span className="text-base">›</span>
              </div>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
