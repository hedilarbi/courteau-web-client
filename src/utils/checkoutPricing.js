// Calcul du prix du checkout du site. Le serveur en garde une reproduction
// (lecourteau-server/services/ordersServices/orderPricing) qui recalcule chaque commande :
// le contrat de prix (__fixtures__) vérifie que le site, l'app et le serveur s'accordent.
import {
  getSmartOfferConditionStatus,
  isSmartOfferAppliedToOrder,
  smartOfferReplacesOtherDiscounts,
  SUBSCRIPTION_DISCOUNT_PERCENT,
} from "@/utils/smartOfferHandlers";
import {
  calculatePromoDiscountAmountForPromo,
  calculatePromoEligibleSubtotalForBasket,
  roundMoney,
  toSafeNumber,
} from "@/utils/promoCodeHelpers";

export const calculateSmartOfferDiscount = ({ smartOffer, smartOfferActivated, subTotal, basketItems }) => {
  if (!smartOfferActivated || !smartOffer) return 0;
  return getSmartOfferConditionStatus({ smartOffer, basketItems, subTotal }).discountAmount;
};

// Un code promo remplace l'offre personnalisée : son cadeau sort de la commande (prix et ligne),
// comme dans l'app et au serveur. Sinon le client cumulerait le cadeau et le code.
export const sumSmartOfferGifts = (basketItems = []) =>
  basketItems.reduce(
    (sum, item) => (item?.isSmartOfferFreeItem ? sum + toSafeNumber(item.price, 0) : sum),
    0
  );

export const getOrderedBasketItems = ({ basketItems = [], promoCodeApplied }) =>
  promoCodeApplied
    ? basketItems.filter((item) => !item?.isSmartOfferFreeItem)
    : basketItems;

export const calculateDiscountedSubtotal = ({
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
    nextSubtotal = Math.max(0, nextSubtotal - sumSmartOfferGifts(basketItems));
    const eligibleSubtotal = calculatePromoEligibleSubtotalForBasket({
      basketItems,
      basketOffers,
      subTotal: nextSubtotal,
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


export const isUserSubscriptionActive = (user, now = new Date()) => {
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
  const notExpired = !hasValidPeriodEnd || periodEnd.getTime() > now.getTime();
  return Boolean(user?.subscriptionIsActive) || (statusActive && notExpired);
};

// Seuil du cashback (étape 1) : sous-total APRÈS la remise 1re commande / abonnement.
export const getCashbackThresholdBase = ({
  subTotal,
  firstOrderDiscountAllowed,
  subscriptionActive,
  promoCodeApplied,
}) =>
  roundMoney(
    toSafeNumber(subTotal, 0) *
      (firstOrderDiscountAllowed && !promoCodeApplied
        ? 0.8
        : subscriptionActive && !promoCodeApplied
          ? (100 - SUBSCRIPTION_DISCOUNT_PERCENT) / 100
          : 1),
    0
  );

// `selected` = offre retenue pour la commande. Règle commune avec l'app
// (isSmartOfferAppliedToOrder) : elle décide à la fois de l'envoi de l'offre et de la remise
// 1re commande / abonnement qu'elle remplace.
export const isSmartOfferApplicable = ({
  selected,
  smartOffer,
  basketItems,
  subTotal,
  deliveryMode,
  deliveryFeeWithoutOffer,
  cashbackThresholdBase,
}) =>
  Boolean(
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

export const getEffectiveDeliveryFee = ({
  deliveryMode,
  subscriptionActive,
  smartOfferAppliedToOrder,
  smartOffer,
  subTotal,
  restaurantDeliveryFee,
}) =>
  deliveryMode === "delivery"
    ? (smartOfferAppliedToOrder &&
        smartOffer?.offerType === "free_delivery" &&
        toSafeNumber(subTotal, 0) >= toSafeNumber(smartOffer?.bonusThreshold, 0)) ||
      subscriptionActive
      ? 0
      : toSafeNumber(restaurantDeliveryFee, 0)
    : 0;

// Pourboire en % du sous-total remisé, ou montant libre (« other ») ; jamais négatif.
export const calculateTipAmount = ({ selectedTip, customTip, discountedSubtotal }) => {
  if (selectedTip === "other") return roundMoney(Math.max(0, toSafeNumber(customTip, 0)), 0);
  if (!selectedTip) return 0;
  return roundMoney((discountedSubtotal * toSafeNumber(selectedTip, 0)) / 100, 0);
};

// Même calcul que l'app et que le serveur (orderPricing/checkoutTotals) : le crédit de
// parrainage est déduit d'abord du sous-total, avant les taxes, puis le reste du total.
export const calculateCheckoutTotals = ({
  deliveryMode,
  discountedSubtotal,
  effectiveDeliveryFee,
  tipAmount,
  referralBalance,
}) => {
  const normalizedSubtotal = roundMoney(discountedSubtotal, 0);
  const deliveryFee =
    deliveryMode === "delivery" ? roundMoney(effectiveDeliveryFee, 0) : 0;
  const balance = toSafeNumber(referralBalance, 0);
  const referralOnSubtotal = Math.min(balance, normalizedSubtotal);
  const subtotalAfterReferral = roundMoney(normalizedSubtotal - referralOnSubtotal, 0);
  const taxBase = subtotalAfterReferral + deliveryFee;
  const tvq = roundMoney((taxBase * 9.975) / 100, 0);
  const tps = roundMoney((taxBase * 5) / 100, 0);
  const totalBeforeRemainingReferral = roundMoney(
    subtotalAfterReferral + deliveryFee + tvq + tps + tipAmount,
    0
  );
  const referralOnTotal = Math.min(
    Math.max(0, balance - referralOnSubtotal),
    totalBeforeRemainingReferral
  );
  return {
    tvq,
    tps,
    referralDiscountApplied: roundMoney(referralOnSubtotal + referralOnTotal, 0),
    total: roundMoney(totalBeforeRemainingReferral - referralOnTotal, 0),
  };
};

/**
 * Total payé sur le site, à partir de l'état du checkout (client, panier, code promo validé,
 * offre activée par le client, pourboire choisi).
 */
export const computeCheckoutPricing = ({
  user,
  basketItems = [],
  basketOffers = [],
  subTotal = 0,
  promoCodeData = null,
  promoCodeIsValid = false,
  smartOffer = null,
  smartOfferActivated = false,
  deliveryMode = "delivery",
  restaurantDeliveryFee = 0,
  selectedTip = null,
  customTip = 0,
  now = new Date(),
}) => {
  const subscriptionActive = isUserSubscriptionActive(user, now);
  const firstOrderDiscountAllowed = !user?.firstOrderDiscountApplied;
  const promoCodeApplied = Boolean(promoCodeIsValid && promoCodeData);
  const deliveryFeeWithoutOffer =
    deliveryMode === "delivery" && !subscriptionActive
      ? toSafeNumber(restaurantDeliveryFee, 0)
      : 0;
  const smartOfferAppliedToOrder = isSmartOfferApplicable({
    selected: Boolean(smartOfferActivated && smartOffer && !promoCodeApplied),
    smartOffer,
    basketItems,
    subTotal,
    deliveryMode,
    deliveryFeeWithoutOffer,
    cashbackThresholdBase: getCashbackThresholdBase({
      subTotal,
      firstOrderDiscountAllowed,
      subscriptionActive,
      promoCodeApplied,
    }),
  });
  const effectiveDeliveryFee = getEffectiveDeliveryFee({
    deliveryMode,
    subscriptionActive,
    smartOfferAppliedToOrder,
    smartOffer,
    subTotal,
    restaurantDeliveryFee,
  });
  const discountedSubtotal = calculateDiscountedSubtotal({
    subTotal,
    firstOrderDiscountAllowed,
    subscriptionActive,
    promoCodeAllowed: true,
    promoCodeIsValid,
    promoCodeData,
    basketItems,
    basketOffers,
    smartOffer,
    smartOfferActivated: smartOfferAppliedToOrder,
  });
  const tipAmount = calculateTipAmount({ selectedTip, customTip, discountedSubtotal });
  return {
    ...calculateCheckoutTotals({
      deliveryMode,
      discountedSubtotal,
      effectiveDeliveryFee,
      tipAmount,
      referralBalance: user?.referralBalance,
    }),
    discountedSubtotal,
    effectiveDeliveryFee,
    tipAmount,
    smartOfferAppliedToOrder,
  };
};
