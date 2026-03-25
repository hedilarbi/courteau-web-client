"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import {
  useBasket,
  useSelectBasket,
  useSelectBasketItems,
  useSelectBasketTotal,
} from "@/context/BasketContext";

import { getClosestRestaurant } from "@/utils/locationHandlers";
import { getScheduleValidationError } from "@/utils/dateHandlers";
import { getSubscriptionConfig } from "@/services/SubscriptionServices";
import WarningBanner from "./WarningBanner";
import OrderTypeBlock from "./OrderTypeBlock";
import AddressesBlock from "./AddressesBlock";
import ScheduleBlock from "./ScheduleBlock";
import PromoCodeBlock from "./PromoCodeBlock";
import TipsBlock from "./TipsBlock";
import ResumeBlock from "./ResumeBlock";
import ProcessPaiement from "./ProcessPaiement";
import MenuItemModal from "./MenuItemModal";

const SUBSCRIPTION_DISCOUNT_PERCENT = 15;
const BIRTHDAY_TIMEZONE = "America/Toronto";

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

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundMoney = (value, fallback = 0) => {
  const normalized = toSafeNumber(value, fallback);
  return Math.round(normalized * 100) / 100;
};

const getPromoExcludedCategoryIds = (promoCode) => {
  if (!Array.isArray(promoCode?.excludedCategories)) return [];

  return [
    ...new Set(
      promoCode.excludedCategories
        .map((entry) => String(entry?._id || entry || "").trim())
        .filter(Boolean)
    ),
  ];
};

const getPromoLegacyCategoryId = (promoCode) =>
  String(promoCode?.category?._id || promoCode?.category || "").trim();

const getBasketItemCategoryId = (basketItem) =>
  String(basketItem?.category?._id || basketItem?.category || "").trim();

const calculatePromoEligibleSubtotalForBasket = ({
  basketItems = [],
  subTotal = 0,
  promoCode = null,
}) => {
  const promoExcludedCategoryIds = getPromoExcludedCategoryIds(promoCode);
  const promoLegacyCategoryId = getPromoLegacyCategoryId(promoCode);

  if (!promoCode) {
    return roundMoney(subTotal, 0);
  }

  if (!promoExcludedCategoryIds.length && !promoLegacyCategoryId) {
    return roundMoney(subTotal, 0);
  }

  return roundMoney(
    (basketItems || []).reduce((sum, item) => {
      const basketItemCategoryId = getBasketItemCategoryId(item);

      if (promoExcludedCategoryIds.length) {
        if (promoExcludedCategoryIds.includes(basketItemCategoryId)) {
          return sum;
        }
      } else if (basketItemCategoryId !== promoLegacyCategoryId) {
        return sum;
      }

      return sum + toSafeNumber(item?.price, 0);
    }, 0),
    0
  );
};

const calculatePromoDiscountAmountForPromo = (promoCode, eligibleSubtotal) => {
  if (!promoCode) return 0;

  if (promoCode.type === "percent") {
    return roundMoney(
      eligibleSubtotal * (toSafeNumber(promoCode?.percent, 0) / 100),
      0
    );
  }

  if (promoCode.type === "amount") {
    return roundMoney(
      Math.min(toSafeNumber(promoCode?.amount, 0), eligibleSubtotal),
      0
    );
  }

  return 0;
};

const calculateDiscountedSubtotal = ({
  subTotal = 0,
  firstOrderDiscountAllowed = false,
  subscriptionActive = false,
  promoCodeAllowed = false,
  promoCodeIsValid = false,
  promoCodeData = null,
  basketItems = [],
}) => {
  let nextSubtotal = toSafeNumber(subTotal, 0);

  if (firstOrderDiscountAllowed) {
    nextSubtotal *= 0.8;
  } else if (subscriptionActive) {
    nextSubtotal *= (100 - SUBSCRIPTION_DISCOUNT_PERCENT) / 100;
  } else if (promoCodeAllowed && promoCodeIsValid && promoCodeData) {
    const eligibleSubtotal = calculatePromoEligibleSubtotalForBasket({
      basketItems,
      subTotal,
      promoCode: promoCodeData,
    });
    const promoDiscountAmount = calculatePromoDiscountAmountForPromo(
      promoCodeData,
      eligibleSubtotal
    );
    nextSubtotal -= promoDiscountAmount;
  }

  return roundMoney(Math.max(0, nextSubtotal), 0);
};

const getMonthCycleKey = (date = new Date()) => {
  const target = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(target.getTime())) {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(
      2,
      "0"
    )}`;
  }

  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(
    2,
    "0"
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

const isUserSubscriptionActive = (user) => {
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

const CheckoutContent = ({ restaurantsSettings }) => {
  const { user, loading } = useUser();
  const { removeFromBasket } = useBasket();
  const basket = useSelectBasket();
  const basketItems = useSelectBasketItems();
  const subTotal = useSelectBasketTotal();
  const router = useRouter();

  const [tips, setTips] = useState("");
  const [selectedTip, setSelectedTip] = useState(0);
  const [scheduleOption, setScheduleOption] = useState("now");
  const [scheduledDateTime, setScheduledDateTime] = useState(null);
  const [scheduleError, setScheduleError] = useState("");
  const [deliveryMode, setDeliveryMode] = useState("delivery");
  const [promoCodeData, setPromoCodeData] = useState(null);
  const [promoCodeIsValid, setPromoCodeIsValid] = useState(false);
  const [promoCodeError, setPromoCodeError] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(
    restaurantsSettings && restaurantsSettings.length > 0
      ? restaurantsSettings[0]
      : null
  );
  const [address, setAddress] = useState({});
  const [canOrder, setCanOrder] = useState(true);
  const [total, setTotal] = useState(0);
  const [tvq, setTvq] = useState(0);
  const [tps, setTps] = useState(0);
  const [subTotalWithDiscount, setSubTotalWithDiscount] = useState(
    roundMoney(subTotal, 0)
  );
  const [tipAmount, setTipAmount] = useState(0);
  const [subscriptionConfig, setSubscriptionConfig] = useState(null);
  const [isSubscriptionConfigLoaded, setIsSubscriptionConfigLoaded] =
    useState(false);
  const [showSubscriptionItemModal, setShowSubscriptionItemModal] =
    useState(false);
  const [showBirthdayItemModal, setShowBirthdayItemModal] = useState(false);

  const isScheduledOrder = scheduleOption === "later";
  const isAddressValid =
    deliveryMode !== "delivery" ||
    (!!address?.address &&
      !!address?.coords?.latitude &&
      !!address?.coords?.longitude);

  const subscriptionActive = isUserSubscriptionActive(user);
  const firstOrderDiscountAllowed =
    !user?.firstOrderDiscountApplied;
  const promoCodeAllowed = !subscriptionActive;
  const currentCycleKey = getExpectedSubscriptionCycleKey(user, new Date());
  const userCycleKey = String(user?.subscriptionFreeItemCycleKey || "").trim();
  const subscriptionFreeItemUsedCount =
    userCycleKey === currentCycleKey
      ? toSafeNumber(user?.subscriptionFreeItemUsedCount, 0)
      : 0;
  const subscriptionFreeItemRemaining = Math.max(
    0,
    1 - subscriptionFreeItemUsedCount
  );

  const configuredSubscriptionFreeItemId = String(
    subscriptionConfig?.freeItem?.menuItemId || ""
  ).trim();
  const configuredSubscriptionFreeItemName = String(
    subscriptionConfig?.freeItem?.menuItemName || ""
  ).trim();
  const configuredBirthdayFreeItemId = String(
    subscriptionConfig?.birthdayFreeItem?.menuItemId || ""
  ).trim();
  const configuredBirthdayFreeItemName = String(
    subscriptionConfig?.birthdayFreeItem?.menuItemName || ""
  ).trim();
  const birthdayBenefitsSummary =
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
  const canUseBirthdayFreeItem =
    Boolean(
      birthdayBenefitsSummary?.canClaimFreeItem || fallbackCanClaimBirthdayFreeItem
    ) &&
    Boolean(configuredBirthdayFreeItemId);

  const canUseMonthlyFreeItem =
    subscriptionActive &&
    subscriptionFreeItemRemaining > 0 &&
    Boolean(configuredSubscriptionFreeItemId);
  const shouldApplySubscriptionDiscount =
    subscriptionActive && !firstOrderDiscountAllowed;

  const selectedFreeItem =
    basketItems.find((item) => item.isSubscriptionFreeItem) || null;
  const selectedBirthdayFreeItem =
    basketItems.find((item) => item.isBirthdayFreeItem) || null;
  const shouldShowBirthdayFreeItemSection =
    Boolean(configuredBirthdayFreeItemId) &&
    (canUseBirthdayFreeItem || Boolean(selectedBirthdayFreeItem));
  const selectedFreeItemCustomizationAmount = roundMoney(
    (selectedFreeItem?.customization || []).reduce(
      (sum, customization) => sum + toSafeNumber(customization?.price, 0),
      0
    ),
    0
  );
  const selectedFreeItemExtraPrice = roundMoney(
    selectedFreeItem?.subscriptionFreeItemExtraPrice ??
      selectedFreeItem?.price ??
      selectedFreeItemCustomizationAmount,
    0
  );
  const selectedFreeItemOriginalPrice = roundMoney(
    selectedFreeItem?.originalPrice ??
      selectedFreeItem?.basePrice ??
      selectedFreeItem?.price ??
      selectedFreeItemCustomizationAmount,
    0
  );
  const selectedFreeItemBasePrice = roundMoney(
    Math.max(0, selectedFreeItemOriginalPrice - selectedFreeItemExtraPrice),
    0
  );
  const selectedBirthdayFreeItemCustomizationAmount = roundMoney(
    (selectedBirthdayFreeItem?.customization || []).reduce(
      (sum, customization) => sum + toSafeNumber(customization?.price, 0),
      0
    ),
    0
  );
  const selectedBirthdayFreeItemExtraPrice = roundMoney(
    selectedBirthdayFreeItem?.birthdayFreeItemExtraPrice ??
      selectedBirthdayFreeItem?.price ??
      selectedBirthdayFreeItemCustomizationAmount,
    0
  );
  const selectedBirthdayFreeItemOriginalPrice = roundMoney(
    selectedBirthdayFreeItem?.originalPrice ??
      selectedBirthdayFreeItem?.basePrice ??
      selectedBirthdayFreeItem?.price ??
      selectedBirthdayFreeItemCustomizationAmount,
    0
  );
  const selectedBirthdayFreeItemBasePrice = roundMoney(
    Math.max(
      0,
      selectedBirthdayFreeItemOriginalPrice - selectedBirthdayFreeItemExtraPrice
    ),
    0
  );
  const shouldApplyFreeItemDiscount =
    canUseMonthlyFreeItem &&
    Boolean(selectedFreeItem) &&
    selectedFreeItemBasePrice > 0;
  const shouldApplyBirthdayFreeItem =
    canUseBirthdayFreeItem && Boolean(selectedBirthdayFreeItem);
  const shouldApplyBirthdayFreeItemDiscount =
    shouldApplyBirthdayFreeItem && selectedBirthdayFreeItemBasePrice > 0;

  const restaurantDeliveryFee = toSafeNumber(
    selectedRestaurant?.settings?.delivery_fee,
    0
  );
  const effectiveDeliveryFee =
    deliveryMode === "delivery"
      ? subscriptionActive
        ? 0
        : restaurantDeliveryFee
      : 0;

  const subscriptionScenarioSubtotal = roundMoney(
    Math.max(0, subTotal * ((100 - SUBSCRIPTION_DISCOUNT_PERCENT) / 100)),
    0
  );
  const potentialSubscriptionDiscountSavings = roundMoney(
    Math.max(0, subTotalWithDiscount - subscriptionScenarioSubtotal),
    0
  );
  const potentialSubscriptionDeliverySavings =
    deliveryMode === "delivery" ? roundMoney(restaurantDeliveryFee, 0) : 0;
  const potentialSubscriptionSavings = subscriptionActive
    ? 0
    : roundMoney(
        potentialSubscriptionDiscountSavings + potentialSubscriptionDeliverySavings,
        0
      );

  const subscriptionDiscountAmount = shouldApplySubscriptionDiscount
    ? roundMoney(subTotal * (SUBSCRIPTION_DISCOUNT_PERCENT / 100), 0)
    : 0;
  const promoEligibleSubtotal = useMemo(() => {
    return calculatePromoEligibleSubtotalForBasket({
      basketItems,
      subTotal,
      promoCode: promoCodeAllowed ? promoCodeData : null,
    });
  }, [
    basketItems,
    promoCodeAllowed,
    promoCodeData,
    subTotal,
  ]);
  const promoDiscountAmount =
    promoCodeAllowed && promoCodeIsValid && promoCodeData
      ? calculatePromoDiscountAmountForPromo(
          promoCodeData,
          promoEligibleSubtotal
        )
      : 0;
  const subscriptionFreeItemAmount = shouldApplyFreeItemDiscount
    ? roundMoney(selectedFreeItemBasePrice, 0)
    : 0;
  const subscriptionFreeDeliveryAmount =
    subscriptionActive && deliveryMode === "delivery" ? restaurantDeliveryFee : 0;

  const subscriptionBenefits = subscriptionActive
    ? {
        isApplied: true,
        discountPercent: shouldApplySubscriptionDiscount
          ? SUBSCRIPTION_DISCOUNT_PERCENT
          : 0,
        discountAmount: subscriptionDiscountAmount,
        freeDeliveryApplied: deliveryMode === "delivery",
        freeDeliveryAmount: roundMoney(subscriptionFreeDeliveryAmount, 0),
        freeItemApplied: Boolean(shouldApplyFreeItemDiscount),
        freeItemAmount: subscriptionFreeItemAmount,
        freeItemBasePrice: selectedFreeItemBasePrice,
        freeItemMenuItemId:
          configuredSubscriptionFreeItemId || selectedFreeItem?.id || null,
        freeItemLabel:
          configuredSubscriptionFreeItemName || selectedFreeItem?.name || "",
        cycleKey: currentCycleKey,
        monthlyPriceSnapshot: toSafeNumber(user?.subscriptionMonthlyPrice, 11.99),
      }
    : {
        isApplied: false,
      };
  const birthdayBenefits =
    shouldApplyBirthdayFreeItem
      ? {
          isApplied: true,
          freeItemApplied: true,
          freeItemAmount: roundMoney(selectedBirthdayFreeItemBasePrice, 0),
          freeItemBasePrice: selectedBirthdayFreeItemBasePrice,
          freeItemMenuItemId:
            configuredBirthdayFreeItemId || selectedBirthdayFreeItem?.id || null,
          freeItemLabel:
            configuredBirthdayFreeItemName ||
            selectedBirthdayFreeItem?.name ||
            "",
          cycleYear: toSafeNumber(
            birthdayBenefitsSummary?.cycleYear,
            new Date().getFullYear()
          ),
        }
      : {
          isApplied: false,
          freeItemApplied: false,
          freeItemAmount: 0,
          freeItemBasePrice: 0,
          freeItemMenuItemId: null,
          freeItemLabel: "",
          cycleYear: toSafeNumber(
            birthdayBenefitsSummary?.cycleYear,
            new Date().getFullYear()
          ),
        };

  const normalizedTotal = roundMoney(total, 0);
  const isZeroTotalSubscriptionOrder =
    normalizedTotal <= 0 &&
    ((subscriptionActive && canUseMonthlyFreeItem && Boolean(selectedFreeItem)) ||
      (canUseBirthdayFreeItem && Boolean(selectedBirthdayFreeItem)));

  const orderDiscountPercent = firstOrderDiscountAllowed
    ? 20
    : subscriptionActive
    ? SUBSCRIPTION_DISCOUNT_PERCENT
    : 0;

  useEffect(() => {
    let isMounted = true;
    const loadConfig = async () => {
      setIsSubscriptionConfigLoaded(false);
      try {
        const response = await getSubscriptionConfig();
        if (isMounted) {
          setSubscriptionConfig(response?.status ? response.data || null : null);
        }
      } catch (error) {
        if (isMounted) {
          setSubscriptionConfig(null);
        }
      } finally {
        if (isMounted) {
          setIsSubscriptionConfigLoaded(true);
        }
      }
    };

    if (user?._id) {
      loadConfig();
    }

    return () => {
      isMounted = false;
    };
  }, [user?._id]);

  useEffect(() => {
    if (user && user.addresses && user.addresses.length > 0 && !loading) {
      setAddress(user.addresses[0]);
      const restaurantIndex = getClosestRestaurant(
        user.addresses[0].coords,
        restaurantsSettings
      );
      const closestRestaurant = restaurantsSettings[restaurantIndex];
      setSelectedRestaurant(closestRestaurant);
    }
  }, [loading, restaurantsSettings, user]);

  useEffect(() => {
    if (deliveryMode !== "delivery") {
      setScheduleOption("now");
      setScheduledDateTime(null);
      setScheduleError("");
    }
  }, [deliveryMode]);

  useEffect(() => {
    if (scheduleOption === "now") {
      setScheduledDateTime(null);
      setScheduleError("");
    }
  }, [scheduleOption]);

  useEffect(() => {
    if (!isScheduledOrder || !scheduledDateTime || !selectedRestaurant) {
      setScheduleError("");
      return;
    }
    const error = getScheduleValidationError(
      scheduledDateTime,
      selectedRestaurant
    );
    setScheduleError(error || "");
  }, [isScheduledOrder, scheduledDateTime, selectedRestaurant]);

  useEffect(() => {
    if (!selectedFreeItem?.uid) return;
    if (!isSubscriptionConfigLoaded) return;
    if (!canUseMonthlyFreeItem) {
      removeFromBasket(selectedFreeItem.uid);
      return;
    }
    if (!configuredSubscriptionFreeItemId) {
      removeFromBasket(selectedFreeItem.uid);
      return;
    }
    if (String(selectedFreeItem.id || "").trim() !== configuredSubscriptionFreeItemId) {
      removeFromBasket(selectedFreeItem.uid);
    }
  }, [
    canUseMonthlyFreeItem,
    configuredSubscriptionFreeItemId,
    isSubscriptionConfigLoaded,
    removeFromBasket,
    selectedFreeItem?.id,
    selectedFreeItem?.uid,
  ]);

  useEffect(() => {
    if (!selectedBirthdayFreeItem?.uid) return;
    if (!isSubscriptionConfigLoaded) return;
    if (!canUseBirthdayFreeItem) {
      removeFromBasket(selectedBirthdayFreeItem.uid);
      return;
    }
    if (!configuredBirthdayFreeItemId) {
      removeFromBasket(selectedBirthdayFreeItem.uid);
      return;
    }
    if (
      String(selectedBirthdayFreeItem.id || "").trim() !==
      configuredBirthdayFreeItemId
    ) {
      removeFromBasket(selectedBirthdayFreeItem.uid);
    }
  }, [
    canUseBirthdayFreeItem,
    configuredBirthdayFreeItemId,
    isSubscriptionConfigLoaded,
    removeFromBasket,
    selectedBirthdayFreeItem?.id,
    selectedBirthdayFreeItem?.uid,
  ]);

  useEffect(() => {
    if (!promoCodeAllowed) {
      setPromoCodeData(null);
      setPromoCodeIsValid(false);
      setPromoCodeError(
        "Un abonnement actif est déjà appliqué. Les codes promo ne sont pas cumulables."
      );
    } else if (
      promoCodeError ===
      "Un abonnement actif est déjà appliqué. Les codes promo ne sont pas cumulables."
    ) {
      setPromoCodeError(null);
    }
  }, [promoCodeAllowed, promoCodeError]);

  useEffect(() => {
    if (!(promoCodeAllowed && promoCodeIsValid && promoCodeData)) return;

    if (
      (promoCodeData.type === "amount" || promoCodeData.type === "percent") &&
      promoEligibleSubtotal <= 0
    ) {
      setPromoCodeIsValid(false);
      setPromoCodeData(null);
      setPromoCodeError(
        "Ce code promo ne s'applique à aucun article de votre panier."
      );
      return;
    }

    if (
      promoCodeData.type === "amount" &&
      toSafeNumber(promoCodeData.amount, 0) > promoEligibleSubtotal
    ) {
      setPromoCodeIsValid(false);
      setPromoCodeData(null);
      setPromoCodeError(
        "Le montant du code promo ne peut pas être supérieur au total des articles éligibles."
      );
    }
  }, [
    promoCodeAllowed,
    promoCodeData,
    promoCodeIsValid,
    promoEligibleSubtotal,
  ]);

  useEffect(() => {
    let nextSubtotal = calculateDiscountedSubtotal({
      subTotal,
      firstOrderDiscountAllowed,
      subscriptionActive,
      promoCodeAllowed,
      promoCodeIsValid,
      promoCodeData,
      basketItems,
    });
    setSubTotalWithDiscount(nextSubtotal);

    let nextTip = 0;
    if (selectedTip === "other") {
      nextTip = toSafeNumber(tips, 0);
      if (nextTip < 0) nextTip = 0;
    } else if (!selectedTip) {
      nextTip = 0;
      setTips(0);
    } else {
      nextTip = (nextSubtotal * toSafeNumber(selectedTip, 0)) / 100;
      setTips(nextTip);
    }
    nextTip = roundMoney(nextTip, 0);
    setTipAmount(nextTip);

    if (deliveryMode === "delivery") {
      const taxableAmount = nextSubtotal + effectiveDeliveryFee;
      const nextTvq = roundMoney((taxableAmount * 9.975) / 100, 0);
      const nextTps = roundMoney((taxableAmount * 5) / 100, 0);
      setTvq(nextTvq);
      setTps(nextTps);
      setTotal(
        roundMoney(effectiveDeliveryFee + nextSubtotal + nextTvq + nextTps + nextTip)
      );
    } else {
      const nextTvq = roundMoney((nextSubtotal * 9.975) / 100, 0);
      const nextTps = roundMoney((nextSubtotal * 5) / 100, 0);
      setTvq(nextTvq);
      setTps(nextTps);
      setTotal(roundMoney(nextSubtotal + nextTvq + nextTps + nextTip, 0));
    }
  }, [
    deliveryMode,
    effectiveDeliveryFee,
    firstOrderDiscountAllowed,
    basketItems,
    promoCodeAllowed,
    promoCodeData,
    promoDiscountAmount,
    promoCodeIsValid,
    selectedTip,
    subTotal,
    subscriptionActive,
    tips,
  ]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/connexion");
    }
    const hasBasketContent = toSafeNumber(basket?.size, 0) > 0;
    let skipEmptyBasketRedirect = false;
    if (typeof window !== "undefined") {
      const lastSuccessRedirectAtRaw =
        window.sessionStorage.getItem("checkout_success_redirect_at") || "";
      const lastSuccessRedirectAt = Number(lastSuccessRedirectAtRaw);
      if (hasBasketContent) {
        window.sessionStorage.removeItem("checkout_success_redirect_at");
      } else if (
        Number.isFinite(lastSuccessRedirectAt) &&
        Date.now() - lastSuccessRedirectAt <= 15000
      ) {
        skipEmptyBasketRedirect = true;
      } else if (lastSuccessRedirectAtRaw) {
        window.sessionStorage.removeItem("checkout_success_redirect_at");
      }
    }

    if (!loading && user && !hasBasketContent && !skipEmptyBasketRedirect) {
      router.replace("/menu");
    }
  }, [basket?.size, loading, user, router]);

  if (loading) {
    return (
      <div className="md:mt-28 mt-20 bg-[#F3F4F6] md:px-14 px-4 pt-8 pb-20 min-h-screen">
        <div className="md:w-[70%] w-full mx-auto">
          <h1 className="font-inter font-semibold text-black md:text-2xl text-lg">
            Finaliser la commande
          </h1>
          <p className="font-inter font-medium text-[#4B5563] md:text-lg text-base">
            Complétez les informations ci-dessous pour confirmer votre commande
          </p>
          <div className="rounded-md bg-white p-6 shadow-md">
            <div className="animate-pulse">
              <div className="w-full h-10 bg-gray-200 mb-4" />
              <div className="w-full h-10 bg-gray-200 mb-4" />
              <div className="w-full h-10 bg-gray-200 mb-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return null;
  }

  return (
    <div className="md:mt-28 mt-20 bg-[#F3F4F6] md:px-14 px-4 pt-8 pb-20 relative">
      <MenuItemModal
        itemId={configuredSubscriptionFreeItemId || null}
        itemUID={selectedFreeItem?.uid || null}
        showMenuItemModal={showSubscriptionItemModal}
        setShowMenuItemModal={setShowSubscriptionItemModal}
        isSubscriptionFreeItem
      />
      <MenuItemModal
        itemId={configuredBirthdayFreeItemId || null}
        itemUID={selectedBirthdayFreeItem?.uid || null}
        showMenuItemModal={showBirthdayItemModal}
        setShowMenuItemModal={setShowBirthdayItemModal}
        isBirthdayFreeItem
      />

      <div className="md:w-[70%] w-full mx-auto">
        {user.isBanned && (
          <div className="bg-red-500 text-white font-inter font-semibold mb-4">
            <p className="text-center py-2 px-4">
              Votre compte a été désactivé. Veuillez contacter le support pour
              plus d&apos;informations.
            </p>
          </div>
        )}

        <WarningBanner
          settings={selectedRestaurant?.settings || {}}
          deliveryMode={deliveryMode}
          setCanOrder={setCanOrder}
          addressValid={isAddressValid}
        />

        <h1 className="font-inter font-semibold text-black md:text-2xl text-lg">
          Finaliser la commande
        </h1>
        <p className="font-inter font-medium text-[#4B5563] md:text-lg text-base">
          Complétez les informations ci-dessous pour confirmer votre commande
        </p>

        <section className="mt-3">
          <OrderTypeBlock
            deliveryMode={deliveryMode}
            setDeliveryMode={setDeliveryMode}
          />

          <AddressesBlock
            address={address}
            setAddress={setAddress}
            selectedRestaurant={selectedRestaurant}
            setSelectedRestaurant={setSelectedRestaurant}
            restaurantsSettings={restaurantsSettings}
            userId={user._id}
            userAddresses={user.addresses}
            deliveryMode={deliveryMode}
          />

          <ScheduleBlock
            scheduleOption={scheduleOption}
            setScheduleOption={setScheduleOption}
            scheduledDateTime={scheduledDateTime}
            setScheduledDateTime={setScheduledDateTime}
            scheduleError={scheduleError}
          />

          {!subscriptionActive && (
            <div className="rounded-md bg-white p-6 shadow-md mt-4 w-full">
              <h2 className="font-inter font-semibold text-black md:text-xl text-base">
                Avec CLUB COURTEAU, vous pourriez économiser
              </h2>
              <p className="font-inter font-bold text-pr text-3xl mt-2">
                {potentialSubscriptionSavings.toFixed(2)}$
              </p>
              <p className="font-inter text-[#6B7280] text-sm mt-1">
                Estimation basée sur cette commande.
              </p>
              <div className="mt-3 rounded-md border border-gray-200 px-3 py-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-inter text-sm text-[#4B5563]">
                    Rabais abonnement (-15%)
                  </p>
                  <p className="font-inter font-semibold text-sm text-black">
                    {potentialSubscriptionDiscountSavings.toFixed(2)}$
                  </p>
                </div>
                {deliveryMode === "delivery" && (
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-inter text-sm text-[#4B5563]">
                      Livraison gratuit
                    </p>
                    <p className="font-inter font-semibold text-sm text-black">
                      {potentialSubscriptionDeliverySavings.toFixed(2)}$
                    </p>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="bg-pr text-black font-bebas-neue text-xl px-4 py-2 rounded-md mt-4 cursor-pointer"
                onClick={() => router.push("/abonnement")}
              >
                Activer CLUB COURTEAU
              </button>
            </div>
          )}

          {subscriptionActive && (
            <div className="rounded-md bg-white p-6 shadow-md mt-4 w-full">
              <h2 className="font-inter font-semibold text-black md:text-xl text-base">
                Article gratuit mensuel
              </h2>
              {configuredSubscriptionFreeItemName ? (
                <p className="font-inter text-sm text-[#6B7280] mt-1">
                  {configuredSubscriptionFreeItemName} gratuit ce mois
                </p>
              ) : null}

              {selectedFreeItem ? (
                <div className="border border-gray-200 rounded-md px-3 py-3 mt-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-inter font-semibold text-sm text-black truncate">
                      {selectedFreeItem.name}
                    </p>
                    <button
                      type="button"
                      className="text-red-600 border border-red-300 rounded-full px-3 py-1 text-xs font-semibold cursor-pointer"
                      onClick={() => removeFromBasket(selectedFreeItem.uid)}
                    >
                      Retirer
                    </button>
                  </div>
                  {selectedFreeItemExtraPrice > 0 && (
                    <p className="font-inter text-sm text-[#4B5563] mt-2">
                      Suppléments: +{selectedFreeItemExtraPrice.toFixed(2)}$
                    </p>
                  )}
                </div>
              ) : null}

              {!configuredSubscriptionFreeItemId ? (
                <p className="font-inter text-sm text-[#6B7280] mt-3">
                  Aucun article gratuit n&apos;est configuré pour le moment.
                </p>
              ) : !canUseMonthlyFreeItem ? (
                <p className="font-inter text-sm text-[#6B7280] mt-3">
                  Votre article gratuit mensuel a déjà été utilisé.
                </p>
              ) : (
                <button
                  type="button"
                  className="bg-pr text-black font-bebas-neue text-xl px-4 py-2 rounded-md mt-4 cursor-pointer"
                  onClick={() => setShowSubscriptionItemModal(true)}
                >
                  {selectedFreeItem ? "Configurer" : "Utiliser"}
                </button>
              )}
            </div>
          )}

          {shouldShowBirthdayFreeItemSection && (
            <div className="rounded-md bg-white p-6 shadow-md mt-4 w-full">
            <h2 className="font-inter font-semibold text-black md:text-xl text-base">
              Cadeau d&apos;anniversaire
            </h2>
            {configuredBirthdayFreeItemName ? (
              <p className="font-inter text-sm text-[#6B7280] mt-1">
                {configuredBirthdayFreeItemName} offert aujourd&apos;hui
              </p>
            ) : null}

            {selectedBirthdayFreeItem ? (
              <div className="border border-gray-200 rounded-md px-3 py-3 mt-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-inter font-semibold text-sm text-black truncate">
                    {selectedBirthdayFreeItem.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-black border border-pr rounded-full px-3 py-1 text-xs font-semibold cursor-pointer"
                      onClick={() => setShowBirthdayItemModal(true)}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="text-red-600 border border-red-300 rounded-full px-3 py-1 text-xs font-semibold cursor-pointer"
                      onClick={() => removeFromBasket(selectedBirthdayFreeItem.uid)}
                    >
                      Retirer
                    </button>
                  </div>
                </div>
                {selectedBirthdayFreeItemExtraPrice > 0 && (
                  <p className="font-inter text-sm text-[#4B5563] mt-2">
                    Suppléments: +{selectedBirthdayFreeItemExtraPrice.toFixed(2)}$
                  </p>
                )}
              </div>
            ) : null}

            {!configuredBirthdayFreeItemId ? (
              <p className="font-inter text-sm text-[#6B7280] mt-3">
                Aucun article anniversaire n&apos;est configuré pour le moment.
              </p>
            ) : !canUseBirthdayFreeItem ? (
              <p className="font-inter text-sm text-[#6B7280] mt-3">
                Cadeau anniversaire indisponible pour cette commande.
              </p>
            ) : (
              <button
                type="button"
                className="bg-pr text-black font-bebas-neue text-xl px-4 py-2 rounded-md mt-4 cursor-pointer"
                onClick={() => setShowBirthdayItemModal(true)}
              >
                {selectedBirthdayFreeItem ? "Modifier" : "Utiliser"}
              </button>
            )}
            </div>
          )}

          <PromoCodeBlock
            userId={user._id}
            basketItems={basketItems}
            promoCodeData={promoCodeData}
            setPromoCodeData={setPromoCodeData}
            promoCodeIsValid={promoCodeIsValid}
            setPromoCodeIsValid={setPromoCodeIsValid}
            firstOrderDiscountAllowed={firstOrderDiscountAllowed}
            promoCodeAllowed={promoCodeAllowed}
            subTotal={subTotal}
            promoCodeError={promoCodeError}
            setPromoCodeError={setPromoCodeError}
          />

          <TipsBlock
            selectedTip={selectedTip}
            setSelectedTip={setSelectedTip}
            setTips={setTips}
            tips={tips}
          />

          <ResumeBlock
            subTotal={subTotal}
            total={total}
            tvq={tvq}
            tps={tps}
            deliveryFee={effectiveDeliveryFee}
            tips={tipAmount}
            firstOrderDiscountAllowed={firstOrderDiscountAllowed}
            promoCodeData={promoCodeData}
            promoCodeIsValid={promoCodeIsValid}
            promoCodeAllowed={promoCodeAllowed}
            deliveryMode={deliveryMode}
            subTotalWithDiscount={subTotalWithDiscount}
            subscriptionActive={subscriptionActive}
            subscriptionDiscountAmount={subscriptionDiscountAmount}
            promoDiscountAmount={promoDiscountAmount}
          />

          <ProcessPaiement
            user={user}
            total={total}
            selectedRestaurant={selectedRestaurant}
            address={address}
            deliveryMode={deliveryMode}
            tipAmount={tipAmount}
            promoCode={promoCodeAllowed && promoCodeIsValid ? promoCodeData : null}
            subTotal={subTotal}
            subTotalWithDiscount={subTotalWithDiscount}
            canOrder={canOrder}
            isScheduledOrder={isScheduledOrder}
            scheduledDateTime={scheduledDateTime}
            subscriptionBenefits={subscriptionBenefits}
            birthdayBenefits={birthdayBenefits}
            orderDiscountPercent={orderDiscountPercent}
            effectiveDeliveryFee={effectiveDeliveryFee}
            isZeroTotalSubscriptionOrder={isZeroTotalSubscriptionOrder}
            setPromoCodeData={setPromoCodeData}
            setPromoCodeIsValid={setPromoCodeIsValid}
            setPromoCodeError={setPromoCodeError}
          />
        </section>
      </div>
    </div>
  );
};

export default CheckoutContent;
