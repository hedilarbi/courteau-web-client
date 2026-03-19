"use client";

import React, { useEffect, useMemo, useState } from "react";
import { IoChevronForwardOutline } from "react-icons/io5";
import { MdCardGiftcard } from "react-icons/md";
import axios from "axios";
import { useSelectBasketItems } from "@/context/BasketContext";
import { useUser } from "@/context/UserContext";
import { getSubscriptionConfig } from "@/services/SubscriptionServices";
import { getUserByToken } from "@/services/UserServices";
import { getToken } from "@/app/actions";
import MenuItemModal from "./MenuItemModal";

const BIRTHDAY_TIMEZONE = "America/Toronto";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getCurrentDateParts = (timezone = BIRTHDAY_TIMEZONE) => {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(new Date());
    return {
      year: Number(parts.find((part) => part.type === "year")?.value || 0),
      month: String(parts.find((part) => part.type === "month")?.value || ""),
      day: String(parts.find((part) => part.type === "day")?.value || ""),
    };
  } catch (error) {
    const now = new Date();
    return {
      year: now.getUTCFullYear(),
      month: String(now.getUTCMonth() + 1).padStart(2, "0"),
      day: String(now.getUTCDate()).padStart(2, "0"),
    };
  }
};

const getBirthUtcParts = (value) => {
  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) {
    return { month: "", day: "" };
  }

  return {
    month: String(birthDate.getUTCMonth() + 1).padStart(2, "0"),
    day: String(birthDate.getUTCDate()).padStart(2, "0"),
  };
};

const HomeBirthdayCard = () => {
  const { user, selectUser } = useUser();
  const basketItems = useSelectBasketItems();
  const [birthdayItemConfig, setBirthdayItemConfig] = useState(null);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadConfig = async () => {
      let resolvedBirthdayItem = null;

      const response = await getSubscriptionConfig();
      if (response?.status) {
        resolvedBirthdayItem = response?.data?.birthdayFreeItem || null;
      }

      if (!resolvedBirthdayItem?.menuItemId && API_URL) {
        try {
          const homeResponse = await axios.get(`${API_URL}/home/content`, {
            timeout: 10000,
          });
          resolvedBirthdayItem =
            homeResponse?.data?.data?.birthdayFreeItem || resolvedBirthdayItem;
        } catch (error) {
          resolvedBirthdayItem = resolvedBirthdayItem || null;
        }
      }

      if (!isMounted) return;
      setBirthdayItemConfig(resolvedBirthdayItem || null);
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

  const birthdayBenefits =
    user?.birthdayBenefits && typeof user.birthdayBenefits === "object"
      ? user.birthdayBenefits
      : {};
  const fallbackCanClaimBirthdayFreeItem = useMemo(() => {
    if (!user?.date_of_birth) return false;

    const nowParts = getCurrentDateParts(BIRTHDAY_TIMEZONE);
    const birthParts = getBirthUtcParts(user.date_of_birth);
    if (!birthParts.month || !birthParts.day) return false;

    const isBirthdayToday =
      birthParts.month === nowParts.month && birthParts.day === nowParts.day;
    if (!isBirthdayToday) return false;

    const currentCycleYear = Number(nowParts.year || 0);
    const storedCycleYear = Number(user?.birthdayFreeItemCycleYear || 0);
    const rawUsedCount = Number(user?.birthdayFreeItemUsedCount || 0);
    const usedCount =
      Number.isFinite(rawUsedCount) && storedCycleYear === currentCycleYear
        ? rawUsedCount
        : 0;

    return Math.max(0, 1 - usedCount) > 0;
  }, [
    user?.birthdayFreeItemCycleYear,
    user?.birthdayFreeItemUsedCount,
    user?.date_of_birth,
  ]);
  const canClaimBirthdayFreeItem = Boolean(
    birthdayBenefits?.canClaimFreeItem || fallbackCanClaimBirthdayFreeItem,
  );
  const cardContainerClassName = "md:px-14 px-4 mt-4 md:mt-5 relative z-20";
  const birthdayItemId = String(birthdayItemConfig?.menuItemId || "").trim();
  const birthdayItemName = String(birthdayItemConfig?.menuItemName || "").trim();
  const hasBirthdayFreeItemInBasket = basketItems.some((item) =>
    Boolean(item?.isBirthdayFreeItem),
  );

  const firstName = useMemo(() => {
    const normalizedName = String(user?.name || "").trim();
    if (!normalizedName) return "";
    return normalizedName.split(/\s+/).filter(Boolean)[0] || "";
  }, [user?.name]);

  if (
    !user?._id ||
    !canClaimBirthdayFreeItem ||
    !birthdayItemId ||
    hasBirthdayFreeItemInBasket
  ) {
    return null;
  }

  return (
    <>
      <MenuItemModal
        itemId={birthdayItemId}
        itemUID={null}
        showMenuItemModal={showBirthdayModal}
        setShowMenuItemModal={setShowBirthdayModal}
        isBirthdayFreeItem
      />
      <div className={cardContainerClassName}>
        <button
          type="button"
          onClick={() => setShowBirthdayModal(true)}
          className="w-full text-left rounded-2xl border border-[#0F172A] bg-white p-4 shadow-lg hover:brightness-95 transition cursor-pointer"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-pr text-black flex items-center justify-center shrink-0">
                <MdCardGiftcard size={24} />
              </div>
              <div className="min-w-0">
                <p className="font-bebas-neue text-2xl text-black leading-none">
                  Joyeux anniversaire{firstName ? ` ${firstName}` : ""}
                </p>
                <p className="font-inter text-sm text-black/80 mt-1 truncate">
                  {birthdayItemName || "Article gratuit"} offert aujourd&apos;hui
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

export default HomeBirthdayCard;
