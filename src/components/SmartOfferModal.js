"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AiOutlineClockCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { useUser } from "@/context/UserContext";
import { useSmartOffer } from "@/context/SmartOfferContext";
import { logOfferEvent } from "@/services/PersonalizedOffersServices";
import useOfferCountdown from "@/hooks/useOfferCountdown";
import {
  SINGLE_ORDER_TEXT,
  getExcludedCategoriesText,
  isSingleOrderOffer,
} from "@/utils/smartOfferDisplay";

export default function SmartOfferModal() {
  const { user } = useUser();
  const { smartOffer, expiredOffer, showSmartOfferModal, setShowSmartOfferModal } = useSmartOffer();
  const router = useRouter();
  const displayedOffer = smartOffer || expiredOffer;
  const countdown = useOfferCountdown(smartOffer?.validUntil);
  const isExpired = Boolean(displayedOffer) && (!smartOffer || countdown.expired);

  if (!showSmartOfferModal || !displayedOffer) return null;

  const userId = user?._id || user?.id;
  const excludedText = getExcludedCategoriesText(displayedOffer);
  const close = () => setShowSmartOfferModal(false);
  const handleOrder = () => {
    if (userId && smartOffer?._id) logOfferEvent(smartOffer._id, userId, "clicked").catch(() => {});
    close();
    router.push("/menu");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={close}
    >
      <div
        className="relative bg-[#111827] rounded-3xl shadow-2xl overflow-hidden max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors text-xl font-bold cursor-pointer"
          aria-label="Fermer"
        >
          ✕
        </button>

        <p className="text-xs font-bold tracking-widest text-[#F7A600] uppercase mb-3">
          {displayedOffer.isDeferredReward ? "Récompense disponible" : "Offre personnalisée"}
        </p>
        <p className="text-[#F7A600] font-bold text-xl leading-snug pr-6">
          {displayedOffer.notificationTitle || "Offre exclusive"}
        </p>
        {displayedOffer.notificationBody && (
          <p className="text-white text-base leading-relaxed mt-2">{displayedOffer.notificationBody}</p>
        )}
        {isSingleOrderOffer(displayedOffer) && (
          <p className="text-white font-bold text-sm mt-3">{SINGLE_ORDER_TEXT}</p>
        )}
        {excludedText && <p className="text-red-300 text-sm mt-2">{excludedText}</p>}

        {isExpired ? (
          <div className="inline-flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-red-500/15 text-red-500 font-bold text-sm">
            <AiOutlineCloseCircle size={16} /> Offre expirée
          </div>
        ) : countdown.label ? (
          <div className="inline-flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-[#F7A600]/15 text-[#F7A600] font-bold text-sm">
            <AiOutlineClockCircle size={16} /> Expire dans {countdown.label}
          </div>
        ) : null}

        {!isExpired && (
          <button
            onClick={handleOrder}
            className="w-full mt-6 py-3 rounded-xl font-bold text-base text-[#111827] bg-[#F7A600] transition-all hover:brightness-110 active:scale-95 cursor-pointer"
          >
            J’en profite
          </button>
        )}
      </div>
    </div>
  );
}
