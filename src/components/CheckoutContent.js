"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useSmartOffer } from "@/context/SmartOfferContext";
import {
  useBasket,
  useSelectBasket,
  useSelectBasketItems,
  useSelectBasketOffers,
  useSelectBasketTotal,
} from "@/context/BasketContext";

import { getClosestRestaurant, hasValidCoords } from "@/utils/locationHandlers";
import { getScheduleValidationError } from "@/utils/dateHandlers";
import {
  getBasketItemMenuItemId,
  getBasketItemSize,
  getBasketItemsExcludedFromOffer,
  getDiscountExclusionsText,
  isGlobalDiscountOffer,
  isSmartOfferThresholdReachedWithoutEligibleItems,
  NOTHING_ELIGIBLE_MESSAGE,
  smartOfferReplacesOtherDiscounts,
  isSmartOfferAppliedToOrder,
  getDeferredActivationLabel,
  getSingleSmartOfferGiftOption,
  getSmartOfferConditionStatus,
  getSmartOfferGiftOptions,
  getSmartOfferGiftStatus,
  getBuyOneGetOneTriggerId,
  buildBuyOneGetOneTriggerLabel,
  isBuyOneGetOneOffer,
  isSmartOfferGiftMissing,
  MISSING_GIFT_MESSAGE,
  MISSING_GIFT_TITLE,
} from "@/utils/smartOfferHandlers";
import { getSubscriptionConfig } from "@/services/SubscriptionServices";
import {
  checkRestaurantOrderAvailability,
} from "@/services/FoodServices";
import toast from "react-hot-toast";
import {
  calculatePromoDiscountAmountForPromo,
  calculatePromoEligibleSubtotalForBasket,
  roundMoney,
  toSafeNumber,
} from "@/utils/promoCodeHelpers";
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

const buildOrderAvailabilityErrorMessage = (availabilityData = {}) => {
  if (availabilityData?.message) {
    return availabilityData.message;
  }

  const unavailableItems = Array.isArray(availabilityData?.unavailableItems)
    ? availabilityData.unavailableItems
    : [];
  const unavailableOffers = Array.isArray(availabilityData?.unavailableOffers)
    ? availabilityData.unavailableOffers
    : [];
  const unavailableToppings = Array.isArray(availabilityData?.unavailableToppings)
    ? availabilityData.unavailableToppings
    : [];
  const parts = [];

  if (unavailableItems.length > 0) {
    parts.push(
      `Articles indisponibles: ${unavailableItems
        .map((item) => item?.name)
        .filter(Boolean)
        .join(", ")}`
    );
  }

  if (unavailableOffers.length > 0) {
    parts.push(
      `Offres indisponibles: ${unavailableOffers
        .map((offer) => offer?.name)
        .filter(Boolean)
        .join(", ")}`
    );
  }

  if (unavailableToppings.length > 0) {
    parts.push(
      `Personnalisations indisponibles: ${unavailableToppings
        .map((t) => t?.name)
        .filter(Boolean)
        .join(", ")}`
    );
  }

  if (!parts.length) {
    return "Certains articles de votre panier ne sont plus disponibles pour cette succursale.";
  }

  return parts.join(" | ");
};

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

// Calcul partagé avec l'app mobile (utils/smartOfferHandlers) : catégories exclues, tous les
// exemplaires de l'article ciblé, articles verrouillés promo… identique au serveur.
const calculateSmartOfferDiscount = ({ smartOffer, smartOfferActivated, subTotal, basketItems }) => {
  if (!smartOfferActivated || !smartOffer) return 0;
  return getSmartOfferConditionStatus({ smartOffer, basketItems, subTotal }).discountAmount;
};

const calculateDiscountedSubtotal = ({
  subTotal = 0,
  firstOrderDiscountAllowed = false,
  subscriptionActive = false,
  promoCodeAllowed = false,
  promoCodeIsValid = false,
  promoCodeData = null,
  basketItems = [],
  basketOffers = [],
  smartOffer = null,
  smartOfferActivated = false,
}) => {
  let nextSubtotal = toSafeNumber(subTotal, 0);

  const shouldApplyPromoCode = Boolean(
    promoCodeAllowed && promoCodeIsValid && promoCodeData
  );

  // A validated promo code replaces the activated Smart Offer for this order.
  // `smartOfferActivated` = l'offre s'applique vraiment à la commande (smartOfferAppliedToOrder,
  // même règle que l'envoi de l'offre) : elle remplace alors la remise 1re commande / abonnement.
  if (smartOfferActivated && smartOffer && !shouldApplyPromoCode && smartOfferReplacesOtherDiscounts(smartOffer)) {
    const { discountAmount } = getSmartOfferConditionStatus({ smartOffer, basketItems, subTotal: nextSubtotal });
    return roundMoney(Math.max(0, nextSubtotal - discountAmount), 0);
  }

  const shouldApplyFirstOrderDiscount =
    firstOrderDiscountAllowed && !shouldApplyPromoCode;

  if (shouldApplyFirstOrderDiscount) {
    nextSubtotal *= 0.8;
  } else if (shouldApplyPromoCode) {
    const eligibleSubtotal = calculatePromoEligibleSubtotalForBasket({
      basketItems,
      basketOffers,
      subTotal,
      promoCode: promoCodeData,
    });
    const promoDiscountAmount = calculatePromoDiscountAmountForPromo(
      promoCodeData,
      eligibleSubtotal,
      basketItems
    );
    nextSubtotal -= promoDiscountAmount;
  } else if (subscriptionActive) {
    nextSubtotal *= (100 - SUBSCRIPTION_DISCOUNT_PERCENT) / 100;
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
  const { removeFromBasket, convertSmartOfferGiftToPaid, restoreSmartOfferGift } = useBasket();
  const basket = useSelectBasket();
  const basketItems = useSelectBasketItems();
  const basketOffers = useSelectBasketOffers();
  const subTotal = useSelectBasketTotal();
  const router = useRouter();
  const {
    smartOffer,
    smartOfferActivated,
    smartOfferAvailable,
    smartOfferManuallyDisabled,
    activateSmartOffer,
    deactivateSmartOffer,
    clearSmartOffer,
  } = useSmartOffer();
  const [instructions, setInstructions] = useState("");
  // Choix proposé quand le client désactive une offre alors qu'un cadeau est au panier.
  const [giftDisableDialog, setGiftDisableDialog] = useState(null);

  const [tips, setTips] = useState("");
  const [selectedTip, setSelectedTip] = useState(0);
  const [scheduleOption, setScheduleOption] = useState("now");
  const [scheduledDateTime, setScheduledDateTime] = useState(null);
  const [scheduleError, setScheduleError] = useState("");
  const [deliveryMode, setDeliveryMode] = useState("delivery");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [promoCodeData, setPromoCodeData] = useState(null);
  const [promoCodeIsValid, setPromoCodeIsValid] = useState(false);
  const [promoCodeError, setPromoCodeError] = useState(null);
  const [isBasketAvailable, setIsBasketAvailable] = useState(true);
  const [basketErrorMessage, setBasketErrorMessage] = useState("");
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
  const [referralDiscountApplied, setReferralDiscountApplied] = useState(0);
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
  const [showSmartOfferItemModal, setShowSmartOfferItemModal] = useState(false);
  const [smartOfferItemChoice, setSmartOfferItemChoice] = useState(null);
  // Article normal à ajouter depuis l'offre (article ciblé, article déclencheur du 1 acheté = 1 offert).
  const [showRegularItemModal, setShowRegularItemModal] = useState(false);
  const [regularItemChoice, setRegularItemChoice] = useState(null);
  const [showUpdateRestaurantModal, setShowUpdateRestaurantModal] =
    useState(false);
  const [isSuccessRedirecting, setIsSuccessRedirecting] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.sessionStorage.getItem("checkout_success_redirecting") === "1"
    );
  });

  const isScheduledOrder = scheduleOption === "later";
  const isAddressValid =
    deliveryMode !== "delivery" ||
    !!String(address?.address || "").trim();

  const subscriptionActive = isUserSubscriptionActive(user);
  const firstOrderDiscountAllowed =
    !user?.firstOrderDiscountApplied;
  const promoCodeAllowed = true;
  const promoCodeApplied = Boolean(
    promoCodeAllowed && promoCodeIsValid && promoCodeData
  );
  const smartOfferSelectedForOrder = Boolean(
    smartOfferActivated && smartOffer && !promoCodeApplied
  );
  const smartOfferEffectiveThreshold = toSafeNumber(
    smartOffer?.offerType === "deferred_cashback"
      ? (smartOffer?.deferredThreshold || smartOffer?.bonusThreshold)
      : smartOffer?.offerType === "mystery_gift"
      ? (smartOffer?.mysteryThreshold || smartOffer?.bonusThreshold)
      : smartOffer?.bonusThreshold,
    0
  );
  // Cadeau (free_item / buy_one_get_one) : même règle que l'app — seuil atteint ET, pour un
  // « 1 acheté = 1 offert », article déclencheur présent au panier.
  // Cashback (étape 1) : seuil sur le sous-total APRÈS la remise 1re commande / abonnement.
  const cashbackThresholdBase = roundMoney(
    toSafeNumber(subTotal, 0) *
      (firstOrderDiscountAllowed && !promoCodeApplied
        ? 0.8
        : subscriptionActive && !promoCodeApplied
          ? (100 - SUBSCRIPTION_DISCOUNT_PERCENT) / 100
          : 1),
    0
  );
  const smartOfferThresholdReached = smartOffer?.offerType === "deferred_cashback"
    ? cashbackThresholdBase >= smartOfferEffectiveThreshold
    : ["free_item", "buy_one_get_one"].includes(smartOffer?.offerType)
    ? getSmartOfferGiftStatus({ smartOffer, basketItems, basketSubtotal: toSafeNumber(subTotal, 0) }).unlocked
    : toSafeNumber(subTotal, 0) >= smartOfferEffectiveThreshold;
  // Frais de livraison sans l'offre (abonné : déjà gratuite) : une offre de livraison gratuite
  // ne s'applique que s'ils sont payants.
  const deliveryFeeWithoutOffer =
    deliveryMode === "delivery" && !subscriptionActive
      ? toSafeNumber(selectedRestaurant?.settings?.delivery_fee, 0)
      : 0;
  // `selected` = offre retenue pour la commande. Règle commune avec l'app
  // (isSmartOfferAppliedToOrder) : elle décide à la fois de l'envoi de l'offre et de la remise
  // 1re commande / abonnement qu'elle remplace.
  const isSmartOfferApplicable = (selected) => Boolean(
    selected &&
      isSmartOfferAppliedToOrder({
        smartOffer,
        basketItems,
        subTotal: toSafeNumber(subTotal, 0),
        deliveryMode,
        deliveryFeeWithoutOffer,
        cashbackThresholdBase,
      }) &&
      (smartOffer?.offerType === "loyalty_points"
        ? toSafeNumber(smartOffer?.bonusPoints, 0) > 0
        : true)
  );
  const smartOfferAppliedToOrder = isSmartOfferApplicable(smartOfferSelectedForOrder);
  // Brut (ignore la désactivation manuelle) : sert à savoir quelle réduction l'offre annule,
  // pour proposer de la désactiver… ou de la réactiver.
  const smartOfferAvailableForOrder = Boolean(
    smartOfferAvailable && smartOffer && !promoCodeApplied
  );
  const smartOfferConditionMetRaw = isSmartOfferApplicable(smartOfferAvailableForOrder);
  // L'étape 1 du cashback ne remplace pas la remise 1re commande / abonnement.
  const smartOfferReplacesDiscounts =
    smartOfferAppliedToOrder && smartOfferReplacesOtherDiscounts(smartOffer);
  const cancelledDiscountInfo =
    smartOfferReplacesOtherDiscounts(smartOffer) &&
    (smartOfferConditionMetRaw || (smartOfferAvailable && smartOfferManuallyDisabled))
      ? firstOrderDiscountAllowed && !promoCodeApplied
        ? { label: "votre réduction de 20% sur la première commande" }
        : subscriptionActive && !promoCodeApplied
        ? { label: `votre rabais abonnement de ${SUBSCRIPTION_DISCOUNT_PERCENT}%` }
        : null
      : null;
  const singleSmartOfferGift = getSingleSmartOfferGiftOption(smartOffer);
  // Ce qui, dans CE panier, n'est pas remisé : articles des catégories exclues et, pour un rabais
  // global, les offres (combos). + la remarque générale de l'offre (même texte que l'app).
  const showDiscountExclusions =
    smartOfferActivated && smartOffer && !promoCodeApplied && smartOffer.offerType !== "deferred_cashback";
  const discountExclusionsText = showDiscountExclusions
    ? getDiscountExclusionsText(smartOffer)
    : "";
  const excludedBasketItemNames = showDiscountExclusions
    ? [...new Set([
        ...getBasketItemsExcludedFromOffer(basketItems, smartOffer).map((item) => item.name),
        ...(isGlobalDiscountOffer(smartOffer) ? (basketOffers || []).map((offer) => offer.name) : []),
      ].filter(Boolean))]
    : [];

  // Garde-fou avant paiement : cadeau débloqué mais pas ajouté au panier.
  const [showMissingGiftDialog, setShowMissingGiftDialog] = useState(false);
  const giftWarningAcknowledgedRef = useRef(false);
  const pendingPayActionRef = useRef(null);
  const beforePay = (action) => {
    const giftMissing =
      smartOfferActivated &&
      !promoCodeApplied &&
      isSmartOfferGiftMissing({ smartOffer, basketItems, basketSubtotal: toSafeNumber(subTotal, 0) });
    if (!giftMissing || giftWarningAcknowledgedRef.current) return true;
    pendingPayActionRef.current = action || null;
    setShowMissingGiftDialog(true);
    return false;
  };
  const closeGiftWarning = () => {
    pendingPayActionRef.current = null;
    setShowMissingGiftDialog(false);
  };
  const addGiftFromWarning = () => {
    closeGiftWarning();
    router.push("/menu/cadeaux");
  };
  const continueWithoutGift = () => {
    giftWarningAcknowledgedRef.current = true;
    const action = pendingPayActionRef.current;
    closeGiftWarning();
    // Apple Pay ne peut pas être relancé par programme : le client reclique (sans nouvel avertissement).
    if (action) action();
  };

  const handleToggleSmartOffer = () => {
    if (smartOfferManuallyDisabled) {
      activateSmartOffer();
      // Un ancien cadeau gardé au prix normal redevient gratuit s'il correspond toujours à un
      // cadeau de l'offre et n'a pas changé de taille (les suppléments restent facturés).
      const giftOptions = getSmartOfferGiftOptions(smartOffer);
      const formerGift = basketItems.find(
        (item) =>
          item?.wasSmartOfferGift &&
          getBasketItemSize(item) === item.smartOfferGiftSize &&
          giftOptions.some(
            (option) =>
              option.id === getBasketItemMenuItemId(item) &&
              (!option.size || option.size.toLowerCase() === getBasketItemSize(item))
          )
      );
      if (formerGift) restoreSmartOfferGift(formerGift.uid);
      return;
    }
    const gifts = basketItems.filter((item) => item?.isSmartOfferFreeItem);
    if (!gifts.length) {
      deactivateSmartOffer();
      return;
    }
    setGiftDisableDialog({
      gifts,
      names: gifts.map((item) => item.name).filter(Boolean).join(", ") || "L'article offert",
      paidTotal: gifts.reduce(
        (sum, item) => sum + toSafeNumber(item.basePrice, 0) + toSafeNumber(item.price, 0),
        0
      ),
    });
  };
  const shouldApplyFirstOrderDiscount =
    firstOrderDiscountAllowed &&
    !promoCodeApplied &&
    !smartOfferReplacesDiscounts;
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
    subscriptionActive &&
    !shouldApplyFirstOrderDiscount &&
    !promoCodeApplied &&
    !smartOfferReplacesDiscounts;

  const smartOfferFreeItemOptions = useMemo(() => {
    const configuredItems = Array.isArray(smartOffer?.freeItems)
      ? smartOffer.freeItems
      : [];
    const options = configuredItems
      .map((entry) => ({
        id: String(entry?.item?._id || entry?.item || "").trim(),
        name: entry?.item?.name || "Article offert",
        size: String(entry?.size || "").trim(),
      }))
      .filter((entry) => entry.id);

    if (options.length > 0) return options;
    const legacyId = String(smartOffer?.freeItem?._id || smartOffer?.freeItem || "").trim();
    return legacyId
      ? [{ id: legacyId, name: smartOffer?.freeItem?.name || "Article offert", size: "" }]
      : [];
  }, [smartOffer?.freeItem, smartOffer?.freeItems]);
  const selectedSmartOfferFreeItem =
    basketItems.find((item) => item.isSmartOfferFreeItem) || null;

  const selectedFreeItem =
    basketItems.find((item) => item.isSubscriptionFreeItem) || null;
  const selectedBirthdayFreeItem =
    basketItems.find((item) => item.isBirthdayFreeItem) || null;
  const shouldShowBirthdayFreeItemSection =
    Boolean(configuredBirthdayFreeItemId) &&
    !smartOfferReplacesDiscounts &&
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
      ? (smartOfferAppliedToOrder &&
          smartOffer?.offerType === "free_delivery" &&
          toSafeNumber(subTotal, 0) >= toSafeNumber(smartOffer?.bonusThreshold, 0)) ||
        subscriptionActive
        ? 0
        : restaurantDeliveryFee
      : 0;
  const submittedDeliveryFee =
    smartOfferAppliedToOrder && smartOffer?.offerType === "free_delivery"
      ? restaurantDeliveryFee
      : effectiveDeliveryFee;

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
      basketOffers,
      subTotal,
      promoCode: promoCodeAllowed ? promoCodeData : null,
    });
  }, [
    basketOffers,
    basketItems,
    promoCodeAllowed,
    promoCodeData,
    subTotal,
  ]);
  const promoDiscountAmount =
    promoCodeAllowed && promoCodeIsValid && promoCodeData
      ? calculatePromoDiscountAmountForPromo(
          promoCodeData,
          promoEligibleSubtotal,
          basketItems
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

  const isZeroTotalReferralOrder =
    normalizedTotal <= 0 &&
    !isZeroTotalSubscriptionOrder &&
    referralDiscountApplied > 0;

  const isZeroTotalPromoOrder =
    normalizedTotal <= 0 &&
    !isZeroTotalSubscriptionOrder &&
    !isZeroTotalReferralOrder &&
    promoCodeApplied;

  const hasOrphanedSmartOfferFreeItem = Boolean(
    selectedSmartOfferFreeItem && !smartOfferAppliedToOrder
  );

  const orderDiscountPercent = shouldApplyFirstOrderDiscount
    ? 20
    : shouldApplySubscriptionDiscount
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
    const hasSelectedAddress = !!String(address?.address || "").trim();
    if (
      user &&
      user.addresses &&
      user.addresses.length > 0 &&
      !loading &&
      !hasSelectedAddress
    ) {
      const defaultAddress = user.addresses[0];
      setAddress(defaultAddress);

      if (hasValidCoords(defaultAddress?.coords)) {
        const restaurantIndex = getClosestRestaurant(
          defaultAddress.coords,
          restaurantsSettings
        );
        const closestRestaurant = restaurantsSettings[restaurantIndex];
        if (closestRestaurant) {
          setSelectedRestaurant(closestRestaurant);
        }
      }
    }
  }, [address?.address, loading, restaurantsSettings, user]);

  useEffect(() => {
    const verifyAvailabilityOnRestaurantChange = async () => {
      if (
        !selectedRestaurant?._id ||
        (basketItems.length === 0 && basketOffers.length === 0)
      )
        return;

      try {
        const availabilityResponse = await checkRestaurantOrderAvailability(
          selectedRestaurant._id,
          basketItems.map((item) => ({
            item: item.id,
            customizations: (item.customization || []).map((c) => c._id || c).filter(Boolean),
          })),
          basketOffers.map((offer) => ({
            offer: offer.id,
            items: offer.customization
              ? Object.keys(offer.customization).map((itemId) => ({
                  item: itemId,
                  customizations: (offer.customization[itemId]?.[0] || [])
                    .map((c) => (typeof c === "string" ? c : c?._id))
                    .filter(Boolean),
                }))
              : [],
          })),
          { orderType: deliveryMode }
        );

        if (
          availabilityResponse?.status &&
          availabilityResponse?.data?.isValid === false
        ) {
          const message = buildOrderAvailabilityErrorMessage(
            availabilityResponse.data
          );
          setIsBasketAvailable(false);
          setBasketErrorMessage(message);
          toast.error(message, { duration: 5000 });
        } else {
          setIsBasketAvailable(true);
          setBasketErrorMessage("");
        }
      } catch (error) {
        console.error("Availability check failed on restaurant change", error);
      }
    };

    verifyAvailabilityOnRestaurantChange();
  }, [selectedRestaurant?._id, basketItems, basketOffers, deliveryMode]);


  useEffect(() => {
    if (deliveryMode !== "delivery") {
      setScheduleOption("now");
      setScheduledDateTime(null);
      setScheduleError("");
    }
  }, [deliveryMode]);

  useEffect(() => {
    if (deliveryMode === "delivery" && paymentMethod !== "card") {
      setPaymentMethod("card");
    }
  }, [deliveryMode, paymentMethod]);

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
    if (!selectedSmartOfferFreeItem?.uid) return;
    const selectedId = String(selectedSmartOfferFreeItem.id || "").trim();
    const selectedSize = String(
      selectedSmartOfferFreeItem.size?.size || selectedSmartOfferFreeItem.size || ""
    ).trim().toLowerCase();
    const matchingOption = smartOfferFreeItemOptions.find(
      (option) =>
        option.id === selectedId &&
        (!option.size || option.size.toLowerCase() === selectedSize)
    );

    if (
      !smartOfferSelectedForOrder ||
      !smartOfferThresholdReached ||
      // Le cadeau mystère a aussi un article cadeau : sans lui dans la liste, son cadeau était
      // retiré du panier dès le retour au checkout (commandes web toujours sans cadeau).
      !["free_item", "buy_one_get_one", "mystery_gift"].includes(smartOffer?.offerType) ||
      !matchingOption
    ) {
      removeFromBasket(selectedSmartOfferFreeItem.uid);
    }
  }, [
    removeFromBasket,
    selectedSmartOfferFreeItem?.id,
    selectedSmartOfferFreeItem?.size,
    selectedSmartOfferFreeItem?.uid,
    smartOffer?.offerType,
    smartOfferSelectedForOrder,
    smartOfferThresholdReached,
    smartOfferFreeItemOptions,
  ]);

  useEffect(() => {
    if (!smartOfferAppliedToOrder) return;

    if (selectedFreeItem?.uid) {
      removeFromBasket(selectedFreeItem.uid);
    }
    if (selectedBirthdayFreeItem?.uid) {
      removeFromBasket(selectedBirthdayFreeItem.uid);
    }
  }, [
    removeFromBasket,
    selectedBirthdayFreeItem?.uid,
    selectedFreeItem?.uid,
    smartOfferAppliedToOrder,
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
        "Ce code promo ne s'applique à aucun article ou offre de votre panier."
      );
      return;
    }


  }, [
    promoCodeAllowed,
    promoCodeData,
    promoCodeIsValid,
    promoEligibleSubtotal,
  ]);

  // Smart offer discount amount for display in ResumeBlock
  const smartOfferDiscountAmount = useMemo(
    () =>
      calculateSmartOfferDiscount({
        smartOffer,
        smartOfferActivated: smartOfferAppliedToOrder,
        subTotal,
        basketItems,
      }),
    [smartOffer, smartOfferAppliedToOrder, subTotal, basketItems]
  );

  useEffect(() => {
    let nextSubtotal = calculateDiscountedSubtotal({
      subTotal,
      firstOrderDiscountAllowed,
      subscriptionActive,
      promoCodeAllowed,
      promoCodeIsValid,
      promoCodeData,
      basketItems,
      basketOffers,
      smartOffer,
      smartOfferActivated: smartOfferAppliedToOrder,
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
      const totalValueBeforeReferral = roundMoney(
        effectiveDeliveryFee + nextSubtotal + nextTvq + nextTps + nextTip,
        0
      );
      const nextReferralDiscount = Math.min(
        toSafeNumber(user?.referralBalance, 0),
        totalValueBeforeReferral
      );
      setReferralDiscountApplied(nextReferralDiscount);
      setTotal(roundMoney(totalValueBeforeReferral - nextReferralDiscount, 0));
    } else {
      const nextTvq = roundMoney((nextSubtotal * 9.975) / 100, 0);
      const nextTps = roundMoney((nextSubtotal * 5) / 100, 0);
      setTvq(nextTvq);
      setTps(nextTps);
      const nextReferralDiscount = Math.min(
        toSafeNumber(user?.referralBalance, 0),
        roundMoney(nextSubtotal + nextTvq + nextTps + nextTip, 0)
      );
      setReferralDiscountApplied(nextReferralDiscount);
      setTotal(
        roundMoney(nextSubtotal + nextTvq + nextTps + nextTip - nextReferralDiscount, 0)
      );
    }
  }, [
    deliveryMode,
    effectiveDeliveryFee,
    firstOrderDiscountAllowed,
    basketOffers,
    basketItems,
    promoCodeAllowed,
    promoCodeData,
    promoDiscountAmount,
    promoCodeIsValid,
    selectedTip,
    subTotal,
    subscriptionActive,
    tips,
    user?.referralBalance,
    smartOffer,
    smartOfferAppliedToOrder,
  ]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/connexion");
    }
    const hasBasketContent = toSafeNumber(basket?.size, 0) > 0;
    let skipEmptyBasketRedirect = false;
    if (typeof window !== "undefined") {
      const isRedirectingFlag =
        window.sessionStorage.getItem("checkout_success_redirecting") === "1";
      const lastSuccessRedirectAtRaw =
        window.sessionStorage.getItem("checkout_success_redirect_at") || "";
      const lastSuccessRedirectAt = Number(lastSuccessRedirectAtRaw);
      if (hasBasketContent) {
        window.sessionStorage.removeItem("checkout_success_redirecting");
        window.sessionStorage.removeItem("checkout_success_redirect_at");
        setIsSuccessRedirecting(false);
      } else if (
        Number.isFinite(lastSuccessRedirectAt) &&
        Date.now() - lastSuccessRedirectAt <= 15000
      ) {
        skipEmptyBasketRedirect = true;
        setIsSuccessRedirecting(true);
      } else if (lastSuccessRedirectAtRaw) {
        window.sessionStorage.removeItem("checkout_success_redirecting");
        window.sessionStorage.removeItem("checkout_success_redirect_at");
        setIsSuccessRedirecting(false);
      } else if (!isRedirectingFlag) {
        setIsSuccessRedirecting(false);
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

  if (isSuccessRedirecting) {
    return (
      <div className="md:mt-28 mt-20 bg-[#F3F4F6] md:px-14 px-4 pt-8 pb-20 min-h-screen">
        <div className="md:w-[70%] w-full mx-auto">
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
      <MenuItemModal
        key={`${smartOfferItemChoice?.id || "smart-offer-item"}-${smartOfferItemChoice?.size || "default"}`}
        itemId={smartOfferItemChoice?.id || null}
        itemUID={selectedSmartOfferFreeItem?.uid || null}
        showMenuItemModal={showSmartOfferItemModal}
        setShowMenuItemModal={setShowSmartOfferItemModal}
        isSmartOfferFreeItem
        lockedSize={smartOfferItemChoice?.size || ""}
      />
      {regularItemChoice && (
        <MenuItemModal
          key={`regular-${regularItemChoice.id}-${regularItemChoice.size || "default"}`}
          itemId={regularItemChoice.id}
          itemUID={null}
          showMenuItemModal={showRegularItemModal}
          setShowMenuItemModal={setShowRegularItemModal}
          lockedSize={regularItemChoice.size || ""}
        />
      )}

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

        {!isBasketAvailable && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm mb-4 flex items-start gap-3">
            <svg className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold font-inter">Articles indisponibles</p>
              <p className="font-inter text-sm mt-0.5">{basketErrorMessage}</p>
            </div>
          </div>
        )}

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
            showUpdateRestaurantModal={showUpdateRestaurantModal}
            setShowUpdateRestaurantModal={setShowUpdateRestaurantModal}
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

          {subscriptionActive && !smartOfferReplacesDiscounts && (
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

          {showMissingGiftDialog && (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
              onClick={closeGiftWarning}
            >
              <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                <p className="font-bold text-lg">{MISSING_GIFT_TITLE}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {smartOffer?.offerType === "mystery_gift"
                    ? "Votre cadeau mystère est débloqué, mais il n'est pas dans votre panier. Il n'est pas ajouté automatiquement : ajoutez-le avant de payer, sinon vous ne le recevrez pas."
                    : MISSING_GIFT_MESSAGE}
                </p>
                <div className="mt-5 space-y-2">
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-lg bg-[#F7A600] text-[#111827] font-bold text-sm cursor-pointer"
                    onClick={addGiftFromWarning}
                  >
                    Ajouter mon cadeau
                  </button>
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-lg border border-red-300 text-red-600 font-bold text-sm cursor-pointer"
                    onClick={continueWithoutGift}
                  >
                    Payer sans mon cadeau
                  </button>
                </div>
              </div>
            </div>
          )}

          {giftDisableDialog && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
              onClick={() => setGiftDisableDialog(null)}
            >
              <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                <p className="font-bold text-lg">{giftDisableDialog.names} ne sera plus offert</p>
                <p className="text-sm text-gray-600 mt-2">
                  Sans votre offre personnalisée, cet article n&apos;est plus gratuit. Que voulez-vous en faire ?
                </p>
                <div className="mt-5 space-y-2">
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-lg bg-[#F7A600] text-[#111827] font-bold text-sm cursor-pointer"
                    onClick={() => {
                      giftDisableDialog.gifts.forEach((item) => convertSmartOfferGiftToPaid(item.uid));
                      deactivateSmartOffer();
                      setGiftDisableDialog(null);
                    }}
                  >
                    Le garder ({giftDisableDialog.paidTotal.toFixed(2)} $)
                  </button>
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-lg border border-red-300 text-red-600 font-bold text-sm cursor-pointer"
                    onClick={() => {
                      giftDisableDialog.gifts.forEach((item) => removeFromBasket(item.uid));
                      deactivateSmartOffer();
                      setGiftDisableDialog(null);
                    }}
                  >
                    Retirer l&apos;article
                  </button>
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-lg text-gray-600 text-sm cursor-pointer"
                    onClick={() => setGiftDisableDialog(null)}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl mt-4 p-4 bg-white border border-[#ECE5D9]">
            <label htmlFor="order-instructions" className="font-bold text-sm">
              Instructions (optionnel)
            </label>
            <textarea
              id="order-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Instructions pour le restaurant ou le livreur"
              rows={2}
              maxLength={500}
              className="w-full mt-2 p-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-[#F7A600]"
            />
          </div>

          <PromoCodeBlock
            userId={user._id}
            basketItems={basketItems}
            basketOffers={basketOffers}
            promoCodeData={promoCodeData}
            setPromoCodeData={setPromoCodeData}
            promoCodeIsValid={promoCodeIsValid}
            setPromoCodeIsValid={setPromoCodeIsValid}
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

          {/* Bannières smart offers : regroupées juste au-dessus du récapitulatif de la commande. */}
          {smartOffer && (
            <div
              className="rounded-2xl overflow-hidden mt-4"
              style={{
                background: smartOfferActivated
                  ? "linear-gradient(135deg, #052E16, #064E3B)"
                  : "linear-gradient(135deg, #111827, #1F2937)",
                border: `1px solid ${smartOfferActivated ? "#10B981" : "#374151"}`,
              }}
            >
              <div
                className="h-1"
                style={{
                  background: smartOfferActivated
                    ? "linear-gradient(90deg, #10B981, #34D399)"
                    : "linear-gradient(90deg, #F7A600, #FF6B35)",
                }}
              />
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="text-xs font-bold tracking-widest uppercase"
                      style={{ color: smartOfferActivated ? "#10B981" : "#F7A600" }}
                    >
                      {smartOfferManuallyDisabled
                        ? "Offre personnalisée désactivée"
                        : smartOfferActivated
                        ? "Offre activée"
                        : "Offre personnalisée disponible"}
                    </p>
                    <p className="text-white text-sm font-semibold mt-0.5 truncate">
                      {smartOffer.offerType === "discount_category"
                        ? `${smartOffer.discountValue}% de rabais sur la catégorie ${smartOffer.targetCategory?.name || ""}`
                        : smartOffer.offerType === "discount_product"
                        ? `${smartOffer.discountValue}% de rabais sur ${smartOffer.targetMenuItem?.name || "l'article ciblé"}`
                        : smartOffer.offerType === "bonus_basket"
                        ? `Rabais de ${smartOffer.discountValue}$ dès ${toSafeNumber(smartOffer.bonusThreshold, 0).toFixed(2)}$ d'achat`
                        : smartOffer.notificationTitle}
                    </p>
                    {/* Détail par type d'offre : mêmes textes et actions que le checkout de l'app. */}
                    {smartOfferActivated && promoCodeApplied ? (
                      <div className="mt-3">
                        <p className="text-sm font-bold text-[#F7A600]">Code promo appliqué</p>
                        <p className="text-xs text-gray-300 mt-1">
                          L&apos;offre personnalisée est suspendue le temps d&apos;utiliser ce code promo. Supprimez le code promo pour réactiver votre offre.
                        </p>
                      </div>
                    ) : smartOfferSelectedForOrder && isSmartOfferThresholdReachedWithoutEligibleItems({ smartOffer, basketItems, subTotal: toSafeNumber(subTotal, 0) }) ? (
                      // Seuil / palier atteint mais rien de remisable : l'offre ne rapporte rien,
                      // la remise 1re commande / abonnement s'applique à sa place.
                      <div className="mt-3">
                        <p className="text-sm font-bold text-[#F7A600]">Seuil atteint, mais rien à remiser</p>
                        <p className="text-xs text-gray-300 mt-1">{NOTHING_ELIGIBLE_MESSAGE}</p>
                        {(firstOrderDiscountAllowed || subscriptionActive) && (
                          <p className="text-xs font-semibold mt-1" style={{ color: "#34D399" }}>
                            En attendant, {firstOrderDiscountAllowed
                              ? "votre réduction de 20% sur la première commande"
                              : `votre rabais abonnement de ${SUBSCRIPTION_DISCOUNT_PERCENT}%`} s&apos;applique à cette commande.
                          </p>
                        )}
                      </div>
                    ) : smartOfferSelectedForOrder && (() => {
                      const offerType = smartOffer.offerType;
                      const basketSubtotal = toSafeNumber(subTotal, 0);
                      const ok = "#34D399";
                      const pending = "#F7A600";
                      const ProgressBar = ({ value, max, color }) => (
                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mt-2.5">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.round((value / Math.max(0.01, max)) * 100))}%`, backgroundColor: color }}
                          />
                        </div>
                      );
                      const ActionButton = ({ label, onClick, color = "#F7A600" }) => (
                        <button
                          type="button"
                          onClick={onClick}
                          className="mt-3 px-4 py-2 rounded-lg text-xs font-bold text-black cursor-pointer"
                          style={{ backgroundColor: color }}
                        >
                          {label}
                        </button>
                      );
                      const openRegularItem = (id, size = "") => {
                        setRegularItemChoice({ id, size });
                        setShowRegularItemModal(true);
                      };
                      const threshold = toSafeNumber(smartOffer.bonusThreshold, 0);
                      const reached = threshold <= 0 || basketSubtotal >= threshold;
                      const missing = Math.max(0, threshold - basketSubtotal).toFixed(2);

                      if (offerType === "discount_order") {
                        return (
                          <div className="mt-3">
                            <p className="text-sm font-bold" style={{ color: reached ? ok : pending }}>
                              {reached ? `${smartOffer.discountValue}% de rabais appliqué` : `Encore ${missing}$ pour débloquer le rabais`}
                            </p>
                            {threshold > 0 && <ProgressBar value={basketSubtotal} max={threshold} color={reached ? ok : pending} />}
                          </div>
                        );
                      }
                      if (offerType === "bonus_basket") {
                        return (
                          <div className="mt-3">
                            <p className="text-sm font-bold" style={{ color: reached ? ok : pending }}>
                              {reached
                                ? `Seuil atteint — ${smartOffer.discountValue}$ de rabais actif`
                                : `Encore ${missing}$ pour obtenir ${smartOffer.discountValue}$ de rabais`}
                            </p>
                            {threshold > 0 && <ProgressBar value={basketSubtotal} max={threshold} color={reached ? ok : pending} />}
                          </div>
                        );
                      }
                      if (offerType === "discount_category") {
                        const targetCatId = String(smartOffer.targetCategory?._id || smartOffer.targetCategory || "");
                        const hasCategoryItem = basketItems.some((item) => {
                          const itemCat = String(item.category?._id || item.category || "");
                          return itemCat && itemCat === targetCatId;
                        });
                        return (
                          <div className="mt-2">
                            <p className="text-xs text-gray-300">
                              {hasCategoryItem
                                ? "Le rabais s'applique uniquement aux articles de cette catégorie, pas au reste de la commande."
                                : "Le rabais s'applique uniquement aux articles de cette catégorie. Ajoutez-en un pour en profiter."}
                            </p>
                            {!hasCategoryItem && (
                              <ActionButton
                                label="Ouvrir le menu"
                                onClick={() => router.push(smartOffer.targetCategory?.slug ? `/menu/${smartOffer.targetCategory.slug}` : "/menu")}
                              />
                            )}
                          </div>
                        );
                      }
                      if (offerType === "discount_product") {
                        const targetMenuItemId = String(smartOffer.targetMenuItem?._id || smartOffer.targetMenuItem || "");
                        const targetMenuItemName = smartOffer.targetMenuItem?.name || "";
                        const hasProductItem = basketItems.some((item) => getBasketItemMenuItemId(item) === targetMenuItemId);
                        return (
                          <div className="mt-2">
                            <p className="text-xs text-gray-300">
                              {hasProductItem
                                ? `Le rabais s'applique à « ${targetMenuItemName || "cet article"} » dans votre panier`
                                : targetMenuItemName
                                ? `Ajoutez « ${targetMenuItemName} » à votre panier pour bénéficier du rabais`
                                : "Ajoutez l'article en promotion à votre panier pour bénéficier du rabais"}
                            </p>
                            {!hasProductItem && (
                              <ActionButton
                                label="Ajouter l'article"
                                onClick={() => (targetMenuItemId ? openRegularItem(targetMenuItemId) : router.push("/menu"))}
                              />
                            )}
                          </div>
                        );
                      }
                      if (offerType === "deferred_cashback") {
                        const defThreshold = toSafeNumber(smartOffer.deferredThreshold, 0) || threshold;
                        const defReached = cashbackThresholdBase >= defThreshold;
                        return (
                          <div className="mt-3">
                            <p className="text-sm font-bold" style={{ color: defReached ? ok : pending }}>
                              {defReached
                                ? `Seuil atteint ! ${smartOffer.deferredDiscountValue}% de rabais sur votre prochaine commande dès ${getDeferredActivationLabel(smartOffer)}`
                                : `Encore ${Math.max(0, defThreshold - cashbackThresholdBase).toFixed(2)}$ pour débloquer votre réduction de ${smartOffer.deferredDiscountValue}% (${getDeferredActivationLabel(smartOffer)})`}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              La réduction sera activée {getDeferredActivationLabel(smartOffer)} et valable {smartOffer.deferredValidityDays || 7} jours.
                            </p>
                            <ProgressBar value={cashbackThresholdBase} max={defThreshold || 1} color={defReached ? ok : pending} />
                          </div>
                        );
                      }
                      if (offerType === "tiered_discount") {
                        const sortedTiers = [...(smartOffer.tieredDiscounts || [])]
                          .map((tier) => ({ threshold: toSafeNumber(tier?.threshold, 0), discountValue: toSafeNumber(tier?.discountValue, 0) }))
                          .sort((a, b) => a.threshold - b.threshold);
                        let currentTier = null;
                        let nextTier = null;
                        for (const tier of sortedTiers) {
                          if (basketSubtotal >= tier.threshold) currentTier = tier;
                          else if (!nextTier) nextTier = tier;
                        }
                        const maxTier = sortedTiers[sortedTiers.length - 1];
                        return (
                          <div className="mt-3">
                            <p className="text-sm font-bold" style={{ color: currentTier ? ok : pending }}>
                              {currentTier ? `${currentTier.discountValue}% de rabais débloqué !` : "Débloquez des rabais progressifs"}
                            </p>
                            {nextTier && (
                              <p className="text-xs text-gray-300 mt-1">
                                Encore {(nextTier.threshold - basketSubtotal).toFixed(2)}$ pour atteindre le palier {nextTier.discountValue}% !
                              </p>
                            )}
                            {!nextTier && currentTier && (
                              <p className="text-xs text-gray-300 mt-1">Vous avez atteint le palier maximum !</p>
                            )}
                            <ProgressBar value={basketSubtotal} max={maxTier?.threshold || 1} color={currentTier ? ok : pending} />
                          </div>
                        );
                      }
                      if (offerType === "mystery_gift") {
                        const mysThreshold = toSafeNumber(smartOffer.mysteryThreshold, 0);
                        const mysReached = basketSubtotal >= mysThreshold;
                        return (
                          <div className="mt-3">
                            <p className="text-sm font-bold" style={{ color: mysReached ? "#8B5CF6" : pending }}>
                              {mysReached
                                ? selectedSmartOfferFreeItem
                                  ? "Cadeau Mystère ajouté à votre commande"
                                  : smartOfferFreeItemOptions.length > 0
                                    // Le cadeau n'est PAS ajouté tout seul : le client doit cliquer.
                                    ? "Cadeau Mystère débloqué ! Ajoutez-le à votre panier pour le recevoir."
                                    : "Cadeau Mystère débloqué ! Le restaurant l'ajoutera à votre commande."
                                : `Encore ${(mysThreshold - basketSubtotal).toFixed(2)}$ pour débloquer votre Cadeau Mystère !`}
                            </p>
                            <ProgressBar value={basketSubtotal} max={mysThreshold || 1} color={mysReached ? "#8B5CF6" : pending} />
                            {mysReached && !selectedSmartOfferFreeItem && smartOfferFreeItemOptions.length > 0 && (
                              <ActionButton
                                color="#8B5CF6"
                                label={singleSmartOfferGift ? "Ajouter mon cadeau" : "Personnaliser mon cadeau"}
                                onClick={() => router.push("/menu/cadeaux")}
                              />
                            )}
                          </div>
                        );
                      }
                      // Livraison offerte mais commande à emporter : l'offre ne rapporte rien.
                      if (offerType === "free_delivery" && deliveryMode !== "delivery") {
                        return (
                          <div className="mt-3">
                            <p className="text-sm font-bold" style={{ color: pending }}>Votre offre : la livraison gratuite</p>
                            <p className="text-xs text-gray-300 mt-1">
                              Elle ne s&apos;applique qu&apos;en livraison. Choisissez la livraison pour en profiter.
                            </p>
                            <ActionButton label="Passer en livraison" onClick={() => setDeliveryMode("delivery")} />
                          </div>
                        );
                      }
                      if (offerType === "free_delivery") {
                        return (
                          <div className="mt-3">
                            <p className="text-sm font-bold" style={{ color: reached ? ok : pending }}>
                              {reached ? "Livraison gratuite activée" : `Encore ${missing}$ pour débloquer la livraison gratuite`}
                            </p>
                            {threshold > 0 && <ProgressBar value={basketSubtotal} max={threshold} color={reached ? ok : pending} />}
                          </div>
                        );
                      }
                      if (offerType === "loyalty_points") {
                        const bonusPoints = Math.max(0, Math.floor(toSafeNumber(smartOffer.bonusPoints, 0)));
                        return (
                          <div className="mt-3">
                            <p className="text-sm font-bold" style={{ color: reached ? ok : pending }}>
                              {reached
                                ? `Seuil atteint — ${bonusPoints} points de fidélité bonus sont offerts`
                                : `Encore ${missing}$ pour gagner ${bonusPoints} points de fidélité bonus`}
                            </p>
                            {!reached && <p className="text-xs text-gray-400 mt-1">Objectif : {threshold.toFixed(2)}$</p>}
                            {threshold > 0 && <ProgressBar value={basketSubtotal} max={threshold} color={reached ? ok : pending} />}
                          </div>
                        );
                      }
                      if (offerType === "split_discount") {
                        return threshold > 0 ? (
                          <div className="mt-3">
                            <p className="text-sm font-bold" style={{ color: reached ? ok : pending }}>
                              {reached ? "Le rabais divisé s'appliquera au paiement" : `Encore ${missing}$ pour débloquer le rabais divisé`}
                            </p>
                            <ProgressBar value={basketSubtotal} max={threshold} color={reached ? ok : pending} />
                          </div>
                        ) : null;
                      }
                      if (["free_item", "buy_one_get_one"].includes(offerType)) {
                        const isBogo = isBuyOneGetOneOffer(smartOffer);
                        const giftStatus = getSmartOfferGiftStatus({ smartOffer, basketItems, basketSubtotal });
                        const freeItemReached = giftStatus.unlocked;
                        const hasFreeItemInCart = Boolean(selectedSmartOfferFreeItem);
                        let itemLabel = singleSmartOfferGift?.item?.name || (smartOffer.freeItems?.length > 0
                          ? (smartOffer.targetCategory?.name ? `Au choix (${smartOffer.targetCategory.name})` : "Article offert au choix")
                          : (smartOffer.freeItem?.name || (smartOffer.targetCategory?.name ? `Au choix (${smartOffer.targetCategory.name})` : "Au choix dans le menu")));
                        if (String(smartOffer.giftItemSize || "").trim()) itemLabel += ` (${smartOffer.giftItemSize.trim()})`;
                        const triggerId = getBuyOneGetOneTriggerId(smartOffer);
                        return (
                          <div className="mt-3">
                            <p className="text-sm font-bold" style={{ color: freeItemReached ? ok : pending }}>
                              {freeItemReached
                                ? hasFreeItemInCart
                                  ? `Article gratuit appliqué : ${itemLabel}`
                                  : `${isBogo ? "Cadeau débloqué" : "Seuil atteint"} — Article offert : ${itemLabel}`
                                : isBogo && !giftStatus.hasTrigger
                                ? `Ajoutez ${buildBuyOneGetOneTriggerLabel(smartOffer)} pour débloquer : ${itemLabel}`
                                : `Encore ${giftStatus.missingAmount.toFixed(2)}$ pour débloquer : ${itemLabel}`}
                            </p>
                            {hasFreeItemInCart ? (
                              <div className="flex items-center gap-2 flex-wrap mt-1">
                                <span className="text-xs text-gray-300">
                                  L&apos;article offert est dans votre panier et déduit de votre commande.
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeFromBasket(selectedSmartOfferFreeItem.uid)}
                                  className="text-xs text-red-300 underline cursor-pointer"
                                >
                                  Retirer
                                </button>
                              </div>
                            ) : giftStatus.threshold > 0 && !freeItemReached ? (
                              <p className="text-xs text-gray-400 mt-1">Objectif panier : {giftStatus.threshold.toFixed(2)}$</p>
                            ) : null}
                            {giftStatus.threshold > 0 && (
                              <ProgressBar value={basketSubtotal} max={giftStatus.threshold} color={freeItemReached ? ok : pending} />
                            )}
                            {freeItemReached && !hasFreeItemInCart && isBogo && !singleSmartOfferGift && (
                              <p className="text-xs text-gray-300 mt-2">Personnalisez votre article offert pour l&apos;ajouter au panier.</p>
                            )}
                            {isBogo && !giftStatus.hasTrigger && triggerId && (
                              <ActionButton
                                label={`Ajouter ${buildBuyOneGetOneTriggerLabel(smartOffer)}`}
                                onClick={() => openRegularItem(triggerId, smartOffer.triggerItemSize || "")}
                              />
                            )}
                            {freeItemReached && !hasFreeItemInCart && smartOfferFreeItemOptions.length > 0 && (
                              <ActionButton
                                label={singleSmartOfferGift
                                  ? "Ajouter mon cadeau"
                                  : isBogo
                                  ? "Personnaliser"
                                  : `Choisir mon ${String(
                                      smartOffer.targetCategory?.name ||
                                        smartOffer.freeItems?.[0]?.item?.category?.name ||
                                        "cadeau",
                                    ).toLowerCase()}`}
                                onClick={() => router.push("/menu/cadeaux")}
                              />
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {smartOfferActivated && smartOfferDiscountAmount > 0 && (
                      <p className="text-sm mt-2" style={{ color: "#34D399" }}>
                        Économie : -{smartOfferDiscountAmount.toFixed(2)}$
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {(discountExclusionsText || excludedBasketItemNames.length > 0) && (
            <div className="rounded-2xl mt-4 p-4 bg-[#111827] border border-red-500">
              {discountExclusionsText && (
                <p className="text-sm text-red-300">{discountExclusionsText}</p>
              )}
              {excludedBasketItemNames.length > 0 && (
                <p className={`text-sm font-semibold text-red-300 ${discountExclusionsText ? "mt-1" : ""}`}>
                  Dans votre panier : {excludedBasketItemNames.join(", ")}.
                </p>
              )}
            </div>
          )}

          {cancelledDiscountInfo && (
            <div
              className="rounded-2xl mt-4 p-4 bg-[#111827] border"
              style={{ borderColor: smartOfferManuallyDisabled ? "#6B7280" : "#F7A600" }}
            >
              <p className="font-bold text-sm" style={{ color: smartOfferManuallyDisabled ? "#D1D5DB" : "#F7A600" }}>
                {smartOfferManuallyDisabled
                  ? "Offre personnalisée désactivée"
                  : "Votre offre remplace une autre réduction"}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {smartOfferManuallyDisabled
                  ? `${cancelledDiscountInfo.label} est appliqué à la place.`
                  : `Votre offre personnalisée annule ${cancelledDiscountInfo.label}. Vous ne pouvez pas cumuler les deux.`}
              </p>
              <button
                type="button"
                onClick={handleToggleSmartOffer}
                className={`w-full mt-3 py-2.5 rounded-lg text-sm font-bold cursor-pointer ${
                  smartOfferManuallyDisabled
                    ? "bg-[#F7A600] text-[#111827]"
                    : "bg-[#1F2937] text-[#F7A600] border border-gray-500"
                }`}
              >
                {smartOfferManuallyDisabled ? "Réactiver l'offre" : "Désactiver l'offre"}
              </button>
            </div>
          )}

          <ResumeBlock
            subTotal={subTotal}
            total={total}
            tvq={tvq}
            tps={tps}
            deliveryFee={effectiveDeliveryFee}
            tips={tipAmount}
            firstOrderDiscountAllowed={shouldApplyFirstOrderDiscount}
            promoCodeData={promoCodeData}
            promoCodeIsValid={promoCodeIsValid}
            promoCodeAllowed={promoCodeAllowed}
            deliveryMode={deliveryMode}
            subTotalWithDiscount={subTotalWithDiscount}
            subscriptionActive={subscriptionActive}
            subscriptionDiscountAmount={subscriptionDiscountAmount}
            promoDiscountAmount={promoDiscountAmount}
            smartOfferDiscountAmount={
              smartOfferAppliedToOrder ? smartOfferDiscountAmount : 0
            }
            referralDiscountApplied={referralDiscountApplied}
          />

          <ProcessPaiement
            user={user}
            total={total}
            selectedRestaurant={selectedRestaurant}
            address={address}
            deliveryMode={deliveryMode}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            tipAmount={tipAmount}
            promoCode={promoCodeAllowed && promoCodeIsValid ? promoCodeData : null}
            subTotal={subTotal}
            subTotalWithDiscount={subTotalWithDiscount}
            canOrder={canOrder && !hasOrphanedSmartOfferFreeItem}
            isBasketAvailable={isBasketAvailable}
            isScheduledOrder={isScheduledOrder}
            scheduledDateTime={scheduledDateTime}
            subscriptionBenefits={subscriptionBenefits}
            birthdayBenefits={birthdayBenefits}
            orderDiscountPercent={orderDiscountPercent}
            effectiveDeliveryFee={submittedDeliveryFee}
            referralDiscountApplied={referralDiscountApplied}
            isZeroTotalSubscriptionOrder={isZeroTotalSubscriptionOrder}
            isZeroTotalReferralOrder={isZeroTotalReferralOrder}
            isZeroTotalPromoOrder={isZeroTotalPromoOrder}
            setPromoCodeData={setPromoCodeData}
            setPromoCodeIsValid={setPromoCodeIsValid}
            setPromoCodeError={setPromoCodeError}
            onChangeRestaurant={() => setShowUpdateRestaurantModal(true)}
            onChangeAddress={() =>
              document
                .getElementById("checkout-addresses")
                ?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
            personalizedOfferId={smartOfferAppliedToOrder ? smartOffer._id : undefined}
            instructions={instructions}
            beforePay={beforePay}
            onOrderSuccess={() => {
              clearSmartOffer();
            }}
          />
        </section>
      </div>
    </div>
  );
};

export default CheckoutContent;
