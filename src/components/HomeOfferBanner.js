"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AiFillStar, AiOutlineArrowRight, AiOutlineCheck, AiOutlineClockCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { useUser } from "@/context/UserContext";
import { useSmartOffer } from "@/context/SmartOfferContext";
import { logOfferEvent } from "@/services/PersonalizedOffersServices";
import useOfferCountdown from "@/hooks/useOfferCountdown";
import { getSplitDiscountStatus } from "@/utils/smartOfferHandlers";
import {
  SINGLE_ORDER_TEXT,
  getExcludedCategoriesText,
  getOfferDetailText,
  getOfferHeadline,
  isSingleOrderOffer,
} from "@/utils/smartOfferDisplay";

// Bannière d'offre de l'accueil, même design que l'app : bandeau orange, gros chiffre,
// compte à rebours. Reste affichée en "Offre expirée" jusqu'à la prochaine offre active.
export default function HomeOfferBanner() {
  const { user } = useUser();
  const { smartOffer, expiredOffer } = useSmartOffer();
  const router = useRouter();
  const displayedOffer = smartOffer || expiredOffer;
  const countdown = useOfferCountdown(smartOffer?.validUntil);
  if (!displayedOffer) return null;

  const isExpired = !smartOffer || countdown.expired;
  const split = !isExpired ? getSplitDiscountStatus(smartOffer) : null;
  const showSplit = Boolean(split && !split.isComplete);
  const headline = getOfferHeadline(displayedOffer);
  const excludedText = getExcludedCategoriesText(displayedOffer);

  const handleClick = () => {
    if (isExpired) return;
    const userId = user?._id || user?.id;
    if (userId && smartOffer?._id) logOfferEvent(smartOffer._id, userId, "clicked").catch(() => {});
    router.push("/menu");
  };

  return (
    <section className="mx-auto max-w-[1440px] px-5 md:px-14 mb-10">
      <div
        onClick={handleClick}
        className={`rounded-2xl border-[3px] border-[#151513] px-5 py-5 md:px-8 shadow-[0_14px_30px_rgba(0,0,0,.25)] ${
          isExpired ? "bg-[#E5DDCF] cursor-default" : "bg-[#F7A600] cursor-pointer transition hover:-translate-y-0.5"
        }`}
      >
        <div className="flex items-center gap-2 font-bebas-neue text-sm tracking-[2px] text-[#151513]">
          <AiFillStar size={12} />
          <span>
            OFFRE PERSONNALISÉE
            {showSplit ? ` · COMMANDE ${split.currentStepNumber}/${split.totalSteps}` : ""}
          </span>
          <AiFillStar size={12} />
        </div>

        <div className="mt-1 flex items-center justify-between gap-4">
          {!!headline.value && (
            <span className="font-bebas-neue text-6xl md:text-7xl leading-none text-[#151513] whitespace-nowrap">
              {headline.value}
            </span>
          )}
          <span className="font-bebas-neue text-2xl md:text-3xl leading-tight text-right text-[#151513]">
            {headline.pitch}
          </span>
        </div>

        {showSplit && (
          <div className="mt-3 flex gap-2">
            {split.steps.map((percent, index) => {
              const isUsed = index < split.currentIndex;
              const isCurrent = index === split.currentIndex;
              return (
                <div
                  key={`${index}-${percent}`}
                  className={`flex-1 min-h-9 flex items-center justify-center gap-1 rounded-lg border-2 font-bebas-neue text-lg ${
                    isUsed
                      ? "bg-[#151513] border-[#151513] text-[#F7A600] line-through"
                      : isCurrent
                      ? "bg-white border-white text-[#151513]"
                      : "border-[#151513] text-[#151513]"
                  }`}
                >
                  {isUsed && <AiOutlineCheck size={12} />}−{percent} %
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-3 text-sm font-bold text-[#3D2A00]">
          {showSplit
            ? split.nextPercents.length
              ? `Puis ${split.nextPercents.map((p) => `${p} %`).join(", ")} sur vos commandes suivantes.`
              : "Dernière commande de votre avantage."
            : getOfferDetailText(displayedOffer)}
        </p>
        {isSingleOrderOffer(displayedOffer) && (
          <p className="mt-1 text-sm font-black text-[#151513]">{SINGLE_ORDER_TEXT}</p>
        )}
        {excludedText && <p className="mt-1 text-sm font-bold text-[#991B1B]">{excludedText}</p>}

        <div className="mt-4 flex items-center justify-between gap-3">
          {isExpired ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 font-bebas-neue text-lg tracking-wide text-white">
              <AiOutlineCloseCircle size={14} /> OFFRE EXPIRÉE
            </span>
          ) : countdown.label ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/55 px-3 py-1.5 font-bebas-neue text-lg tracking-wide text-[#151513]">
              <AiOutlineClockCircle size={14} /> EXPIRE DANS {countdown.label.toUpperCase()}
            </span>
          ) : (
            <span />
          )}
          {!isExpired && (
            <span className="inline-flex items-center gap-2 rounded-xl bg-[#151513] px-5 py-2.5 font-bebas-neue text-xl tracking-wide text-[#F7A600]">
              J&apos;EN PROFITE <AiOutlineArrowRight size={14} />
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
