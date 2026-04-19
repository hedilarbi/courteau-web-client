export const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const roundMoney = (value, fallback = 0) => {
  const normalized = toSafeNumber(value, fallback);
  return Math.round(normalized * 100) / 100;
};

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

export const getOfferItemCategoryIds = (offer) => {
  const offerItems = Array.isArray(offer?.items) ? offer.items : [];

  return [
    ...new Set(
      offerItems
        .map((entry) =>
          String(
            entry?.item?.category?._id ||
              entry?.item?.category ||
              entry?.category?._id ||
              entry?.category ||
              "",
          ).trim(),
        )
        .filter(Boolean),
    ),
  ];
};

export const buildBasketItemsSubtotal = (basketItems = []) =>
  roundMoney(
    (basketItems || []).reduce(
      (sum, item) => sum + toSafeNumber(item?.price, 0),
      0,
    ),
    0,
  );

export const buildBasketOffersSubtotal = (basketOffers = []) =>
  roundMoney(
    (basketOffers || []).reduce(
      (sum, offer) => sum + toSafeNumber(offer?.price, 0),
      0,
    ),
    0,
  );

export const isBasketItemEligibleForPromo = (item, promoCode) => {
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

export const isBasketOfferEligibleForPromo = (offer, promoCode) => {
  const promoExcludedCategoryIds = getPromoExcludedCategoryIds(promoCode);
  const promoLegacyCategoryId = getPromoLegacyCategoryId(promoCode);
  const categoryIds = getOfferItemCategoryIds(offer);

  if (promoExcludedCategoryIds.length) {
    return !categoryIds.some((categoryId) =>
      promoExcludedCategoryIds.includes(categoryId),
    );
  }

  if (promoLegacyCategoryId) {
    return categoryIds.some((categoryId) => categoryId === promoLegacyCategoryId);
  }

  return true;
};

export const calculatePromoEligibleSubtotalForBasket = ({
  basketItems = [],
  basketOffers = [],
  subTotal = 0,
  promoCode = null,
}) => {
  const promoExcludedCategoryIds = getPromoExcludedCategoryIds(promoCode);
  const promoLegacyCategoryId = getPromoLegacyCategoryId(promoCode);

  if (!promoCode) {
    return roundMoney(subTotal, 0);
  }

  if (!promoExcludedCategoryIds.length && !promoLegacyCategoryId) {
    return roundMoney(
      buildBasketItemsSubtotal(basketItems) +
        buildBasketOffersSubtotal(basketOffers),
      0,
    );
  }

  const eligibleItemsSubtotal = (basketItems || []).reduce((sum, item) => {
    if (!isBasketItemEligibleForPromo(item, promoCode)) return sum;
    return sum + toSafeNumber(item?.price, 0);
  }, 0);

  const eligibleOffersSubtotal = (basketOffers || []).reduce((sum, offer) => {
    if (!isBasketOfferEligibleForPromo(offer, promoCode)) return sum;
    return sum + toSafeNumber(offer?.price, 0);
  }, 0);

  return roundMoney(eligibleItemsSubtotal + eligibleOffersSubtotal, 0);
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
  const promoExcludedCategoryIds = getPromoExcludedCategoryIds(promoCode);
  if (!promoExcludedCategoryIds.length) return [];

  const excludedItems = (basketItems || []).filter(
    (item) => !isBasketItemEligibleForPromo(item, promoCode),
  );
  const excludedOffers = (basketOffers || []).filter(
    (offer) => !isBasketOfferEligibleForPromo(offer, promoCode),
  );

  return [...excludedItems, ...excludedOffers];
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
