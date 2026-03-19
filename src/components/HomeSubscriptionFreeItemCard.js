"use client";

import React, { useEffect, useState } from "react";
import { IoChevronForwardOutline } from "react-icons/io5";
import { MdCardGiftcard } from "react-icons/md";
import axios from "axios";
import { useSelectBasketItems } from "@/context/BasketContext";
import { useUser } from "@/context/UserContext";
import { getSubscriptionConfig } from "@/services/SubscriptionServices";
import { getUserByToken } from "@/services/UserServices";
import { getToken } from "@/app/actions";
import MenuItemModal from "./MenuItemModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getMonthCycleKey = (date = new Date()) => {
  const target = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(target.getTime())) {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(
      2,
      "0",
    )}`;
  }

  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}`;
};

const getExpectedSubscriptionCycleKey = (user, fallbackDate = new Date()) => {
  const periodStart = user?.subscriptionCurrentPeriodStart
    ? new Date(user.subscriptionCurrentPeriodStart)
    : null;

  if (periodStart instanceof Date && !Number.isNaN(periodStart.getTime())) {
    return `period-${periodStart.toISOString()}`;
  }

  return getMonthCycleKey(fallbackDate);
};

const isSubscriptionActive = (user) => {
  if (!user) return false;

  const status = String(user?.subscriptionStatus || "")
    .toLowerCase()
    .trim();
  const statusActive = status === "active" || status === "trialing";
  const statusInRetryGrace = status === "past_due" || status === "unpaid";
  const periodEnd = user?.subscriptionCurrentPeriodEnd
    ? new Date(user.subscriptionCurrentPeriodEnd)
    : null;
  const hasValidPeriodEnd =
    periodEnd instanceof Date && !Number.isNaN(periodEnd.getTime());
  const notExpired = !hasValidPeriodEnd || periodEnd.getTime() > Date.now();
  const renewalGraceEnd = user?.subscriptionRenewalGraceEndsAt
    ? new Date(user.subscriptionRenewalGraceEndsAt)
    : null;
  const hasValidGraceEnd =
    renewalGraceEnd instanceof Date && !Number.isNaN(renewalGraceEnd.getTime());
  const inGraceWindow =
    statusInRetryGrace &&
    hasValidGraceEnd &&
    renewalGraceEnd.getTime() > Date.now() &&
    !user?.subscriptionSuspendedAt;

  return (
    Boolean(user?.subscriptionIsActive) || (statusActive && notExpired) || inGraceWindow
  );
};

const HomeSubscriptionFreeItemCard = () => {
  const { user, selectUser } = useUser();
  const basketItems = useSelectBasketItems();
  const [freeItemConfig, setFreeItemConfig] = useState(null);
  const [showFreeItemModal, setShowFreeItemModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadConfig = async () => {
      let resolvedFreeItem = null;

      const response = await getSubscriptionConfig();
      if (response?.status) {
        resolvedFreeItem = response?.data?.freeItem || null;
      }

      if (!resolvedFreeItem?.menuItemId && API_URL) {
        try {
          const homeResponse = await axios.get(`${API_URL}/home/content`, {
            timeout: 10000,
          });
          resolvedFreeItem =
            homeResponse?.data?.data?.subscriptionFreeItem || resolvedFreeItem;
        } catch (error) {
          resolvedFreeItem = resolvedFreeItem || null;
        }
      }

      if (!isMounted) return;
      setFreeItemConfig(resolvedFreeItem || null);
    };

    if (user?._id) {
      loadConfig();
    }

    return () => {
      isMounted = false;
    };
  }, [user?._id]);

  useEffect(() => {
    let isMounted = true;

    const refreshUser = async () => {
      if (!user?._id) return;

      const token = await getToken();
      const tokenValue = token?.value;
      if (!tokenValue) return;

      const response = await getUserByToken(tokenValue);
      if (!isMounted) return;
      if (response?.status && response?.data?._id) {
        selectUser(response.data);
      }
    };

    refreshUser();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const currentCycleKey = getExpectedSubscriptionCycleKey(user, new Date());
  const userCycleKey = String(user?.subscriptionFreeItemCycleKey || "").trim();
  const usedCount =
    userCycleKey === currentCycleKey
      ? toSafeNumber(user?.subscriptionFreeItemUsedCount, 0)
      : 0;
  const freeItemRemaining = Math.max(0, 1 - usedCount);

  const freeItemId = String(freeItemConfig?.menuItemId || "").trim();
  const freeItemName = String(freeItemConfig?.menuItemName || "").trim();
  const hasSubscriptionFreeItemInBasket = basketItems.some((item) =>
    Boolean(item?.isSubscriptionFreeItem),
  );
  const shouldShowCard =
    Boolean(user?._id) &&
    isSubscriptionActive(user) &&
    Boolean(freeItemId) &&
    freeItemRemaining > 0 &&
    !hasSubscriptionFreeItemInBasket;

  if (!shouldShowCard) {
    return null;
  }

  return (
    <>
      <MenuItemModal
        itemId={freeItemId}
        itemUID={null}
        showMenuItemModal={showFreeItemModal}
        setShowMenuItemModal={setShowFreeItemModal}
        isSubscriptionFreeItem
      />
      <div className="md:px-14 px-4 -mt-8 md:-mt-10 relative z-20">
        <button
          type="button"
          onClick={() => setShowFreeItemModal(true)}
          className="w-full text-left rounded-2xl border border-[#0F172A] bg-white p-4 shadow-lg hover:brightness-95 transition cursor-pointer"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-pr text-black flex items-center justify-center shrink-0">
                <MdCardGiftcard size={24} />
              </div>
              <div className="min-w-0">
                <p className="font-bebas-neue text-2xl text-black leading-none">
                  Article gratuit du mois
                </p>
                <p className="font-inter text-sm text-black/80 mt-1 truncate">
                  {freeItemName || "Article gratuit"} gratuit ce mois
                </p>
              </div>
            </div>
            <div className="h-9 w-9 rounded-full bg-black text-pr flex items-center justify-center shrink-0">
              <IoChevronForwardOutline size={20} />
            </div>
          </div>
        </button>
      </div>
    </>
  );
};

export default HomeSubscriptionFreeItemCard;
