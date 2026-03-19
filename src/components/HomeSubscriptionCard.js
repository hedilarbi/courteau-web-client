"use client";

import Link from "next/link";
import React from "react";
import { useUser } from "@/context/UserContext";
import { IoChevronForwardOutline } from "react-icons/io5";
import { MdWorkspacePremium } from "react-icons/md";

const isActiveSubscription = (user) => {
  if (!user) return false;

  const status = String(user?.subscriptionStatus || "")
    .toLowerCase()
    .trim();
  const statusActive = status === "active" || status === "trialing";
  const periodEnd = user?.subscriptionCurrentPeriodEnd
    ? new Date(user.subscriptionCurrentPeriodEnd)
    : null;
  const hasValidPeriodEnd =
    periodEnd instanceof Date && !Number.isNaN(periodEnd.getTime());
  const notExpired = !hasValidPeriodEnd || periodEnd.getTime() > Date.now();
  return Boolean(user?.subscriptionIsActive) || (statusActive && notExpired);
};

const HomeSubscriptionCard = () => {
  const { user } = useUser();

  if (isActiveSubscription(user)) {
    return null;
  }

  return (
    <div className="md:px-14 px-4 -mt-8 md:-mt-10 relative z-10">
      <Link
        href="/abonnement"
        className="block rounded-2xl border border-[#0F172A] bg-pr p-4 shadow-lg hover:brightness-95 transition"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-black/90 text-pr flex items-center justify-center shrink-0">
              <MdWorkspacePremium size={24} />
            </div>
            <div className="min-w-0">
              <p className="font-bebas-neue text-2xl text-black leading-none">
                Rejoins CLUB COURTEAU
              </p>
              <p className="font-inter text-sm text-black/80 mt-1">
                Plusieurs offres exclusives
              </p>
            </div>
          </div>
          <div className="h-9 w-9 rounded-full bg-black text-pr flex items-center justify-center shrink-0">
            <IoChevronForwardOutline size={20} />
          </div>
        </div>
      </Link>
    </div>
  );
};

export default HomeSubscriptionCard;
