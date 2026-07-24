export const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const roundMoney = (value, fallback = 0) => {
  const normalized = toSafeNumber(value, fallback);
  return Math.round(normalized * 100) / 100;
};

const PROMO_ALWAYS_EXCLUDED_CATEGORY_NAME = "promos";

export const getPromoExcludedCategoryIds = (promoCode) => {
  if (!Array.isArray(promoCode?.excludedCategories)) return [];

  return [
    ...new Set(
      promoCode.excludedCategories
        .map((entry) => String(entry?._id || entry || "").trim())
        .filter(Boolean),
    ),
  ];
};

export const getPromoLegacyCategoryId = (promoCode) =>
  String(promoCode?.category?._id || promoCode?.category || "").trim();

export const getBasketItemCategoryId = (basketItem) =>
  String(basketItem?.category?._id || basketItem?.category || "").trim();

export const getBasketItemCategoryName = (basketItem) =>
  String(
    basketItem?.categoryName || basketItem?.category?.name || "",
  ).trim();

export const isPromosCategoryName = (name) =>
  String(name || "").trim().toLowerCase() ===
  PROMO_ALWAYS_EXCLUDED_CATEGORY_NAME;

export const buildBasketItemsSubtotal = (basketItems = []) =>
  roundMoney(
    (basketItems || []).reduce(
      (sum, item) => sum + toSafeNumber(item?.price, 0),
      0,
    ),
    0,
  );

// Menu items in the "Promos" category are never eligible for a promo code
// discount, regardless of how the promo code itself is configured.
export const isBasketItemEligibleForPromo = (item, promoCode) => {
  if (isPromosCategoryName(getBasketItemCategoryName(item))) return false;

  const promoExcludedCategoryIds = getPromoExcludedCategoryIds(promoCode);
  const promoLegacyCategoryId = getPromoLegacyCategoryId(promoCode);
  const categoryId = getBasketItemCategoryId(item);

  if (promoExcludedCategoryIds.length) {
    return !promoExcludedCategoryIds.includes(categoryId);
  }

  if (promoLegacyCategoryId) {
    return categoryId === promoLegacyCategoryId;
  }

  return true;
};

// Offers are never eligible for a promo code discount.
export const isBasketOfferEligibleForPromo = () => false;

export const calculatePromoEligibleSubtotalForBasket = ({
  basketItems = [],
  subTotal = 0,
  promoCode = null,
}) => {
  if (!promoCode) {
    return roundMoney(subTotal, 0);
  }

  const eligibleItemsSubtotal = (basketItems || []).reduce((sum, item) => {
    if (!isBasketItemEligibleForPromo(item, promoCode)) return sum;
    return sum + toSafeNumber(item?.price, 0);
  }, 0);

  return roundMoney(eligibleItemsSubtotal, 0);
};

export const calculatePromoDiscountAmountForPromo = (
  promoCode,
  eligibleSubtotal,
) => {
  if (!promoCode) return 0;

  if (promoCode.type === "percent") {
    return roundMoney(
      eligibleSubtotal * (toSafeNumber(promoCode?.percent, 0) / 100),
      0,
    );
  }

  if (promoCode.type === "amount") {
    return roundMoney(
      Math.min(toSafeNumber(promoCode?.amount, 0), eligibleSubtotal),
      0,
    );
  }

  return 0;
};

export const getPromoExcludedBasketEntries = ({
  basketItems = [],
  basketOffers = [],
  promoCode = null,
}) => {
  if (!promoCode) return [];

  const excludedItems = (basketItems || []).filter(
    (item) => !isBasketItemEligibleForPromo(item, promoCode),
  );

  // Offers are never eligible for a promo code discount.
  return [...excludedItems, ...(basketOffers || [])];
};

export const buildPromoExcludedItemsLabel = (items = []) => {
  const counts = new Map();

  items.forEach((item) => {
    const name = String(item?.name || "").trim();
    if (!name) return;
    counts.set(name, (counts.get(name) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([name, count]) => (count > 1 ? `${name} x${count}` : name))
    .join(", ");
};
