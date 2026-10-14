/**
 * Règles partagées des offres personnalisées (smart offers).
 *
 * La logique de `buy_one_get_one` reproduit volontairement, côté client, celle
 * appliquée par le serveur dans
 * services/ordersServices/createOrderService.js (bloc "buy_one_get_one") :
 * le cadeau n'est débloqué que si l'article déclencheur — à la bonne taille et
 * payé, donc distinct du cadeau lui-même — est présent dans le panier.
 *
 * Sans ce contrôle côté client, l'utilisateur peut choisir et personnaliser un
 * cadeau puis voir sa commande rejetée au moment du paiement.
 */

const normalizeId = (value) => String(value || "").trim();

const normalizeSize = (value) =>
  String(value?.size ?? value ?? "")
    .trim()
    .toLowerCase();

/** Identifiant du MenuItem d'une ligne de panier (le panier stocke `id`). */
export const getBasketItemMenuItemId = (basketItem) =>
  normalizeId(basketItem?.id || basketItem?.item || basketItem?._id);

/** Taille d'une ligne de panier, `size` pouvant être une chaîne ou un objet. */
export const getBasketItemSize = (basketItem) =>
  normalizeSize(basketItem?.size);

export const isBuyOneGetOneOffer = (smartOffer) =>
  smartOffer?.offerType === "buy_one_get_one";

/** MenuItem déclencheur configuré sur l'offre, ou "" si absent. */
export const getBuyOneGetOneTriggerId = (smartOffer) =>
  normalizeId(smartOffer?.triggerItem?._id || smartOffer?.triggerItem);

export const getBuyOneGetOneTriggerName = (smartOffer) =>
  String(smartOffer?.triggerItem?.name || "").trim();

export const getBuyOneGetOneTriggerSize = (smartOffer) =>
  normalizeSize(smartOffer?.triggerItemSize);

/**
 * L'article déclencheur payant est-il dans le panier ?
 *
 * Le cadeau (`isSmartOfferFreeItem`) est exclu : un utilisateur ne peut pas
 * déclencher l'offre avec l'article offert lui-même.
 */
export const hasBuyOneGetOneTriggerInBasket = (
  basketItems = [],
  smartOffer = null,
) => {
  const triggerId = getBuyOneGetOneTriggerId(smartOffer);
  if (!triggerId) return false;

  const expectedSize = getBuyOneGetOneTriggerSize(smartOffer);

  return (basketItems || []).some((basketItem) => {
    if (basketItem?.isSmartOfferFreeItem) return false;
    if (getBasketItemMenuItemId(basketItem) !== triggerId) return false;
    return !expectedSize || getBasketItemSize(basketItem) === expectedSize;
  });
};

/**
 * État de déblocage du cadeau, tous types confondus.
 *
 * Le seuil `bonusThreshold` est vérifié pour TOUS les types : le serveur
 * l'applique globalement dans createOrderService.js, avant les branches
 * spécifiques à chaque offerType. Un `buy_one_get_one` configuré avec un seuil
 * exige donc à la fois l'article déclencheur ET le sous-total minimum.
 *
 * Retourne le détail des conditions manquantes pour pouvoir l'afficher.
 */
export const getSmartOfferGiftStatus = ({
  smartOffer = null,
  basketItems = [],
  basketSubtotal = 0,
}) => {
  if (!smartOffer) {
    return { unlocked: false, needsTrigger: false, hasTrigger: false, thresholdMet: false, threshold: 0, missingAmount: 0 };
  }

  const threshold = Number(smartOffer?.bonusThreshold) || 0;
  const subtotal = Number(basketSubtotal) || 0;
  const thresholdMet = threshold <= 0 || subtotal >= threshold;

  const needsTrigger = isBuyOneGetOneOffer(smartOffer);
  const hasTrigger = needsTrigger
    ? hasBuyOneGetOneTriggerInBasket(basketItems, smartOffer)
    : true;

  return {
    unlocked: thresholdMet && hasTrigger,
    needsTrigger,
    hasTrigger,
    thresholdMet,
    threshold,
    missingAmount: Math.max(0, threshold - subtotal),
  };
};

export const isSmartOfferGiftUnlocked = (params) =>
  getSmartOfferGiftStatus(params).unlocked;

/** Cadeaux proposés par l'offre : `freeItems` si présent, sinon `freeItem` seul. */
export const getSmartOfferGiftOptions = (smartOffer) =>
  (Array.isArray(smartOffer?.freeItems) && smartOffer.freeItems.length
    ? smartOffer.freeItems
    : smartOffer?.freeItem
      ? [{ item: smartOffer.freeItem, size: smartOffer.giftItemSize || "" }]
      : [])
    .map((option) => {
      const item =
        option?.item && typeof option.item === "object"
          ? option.item
          : { _id: option?.item };
      return {
        item,
        id: normalizeId(item?._id),
        size: String(option?.size || "").trim(),
      };
    })
    .filter((option) => option.id);

/** Le cadeau unique de l'offre, ou null s'il y a un choix à faire (ou rien). */
export const getSingleSmartOfferGiftOption = (smartOffer) => {
  const options = getSmartOfferGiftOptions(smartOffer);
  return options.length === 1 ? options[0] : null;
};

/**
 * Ouvre le flux d'ajout du cadeau : directement la personnalisation quand il n'y
 * a qu'un seul article possible, sinon l'écran de choix.
 */
export const openSmartOfferGift = (navigation, smartOffer, returnTo) => {
  // Le cadeau mystère s'ajoute depuis le checkout et y ramène (il s'y découvre) ; les autres
  // cadeaux ramènent au panier.
  if (smartOffer?.offerType === "mystery_gift") returnTo = "Checkout";
  const singleGift = getSingleSmartOfferGiftOption(smartOffer);
  if (singleGift) {
    navigation.navigate("Customize", {
      id: singleGift.id,
      isSmartOfferFreeItem: true,
      lockedSize: singleGift.size,
      returnTo,
    });
    return;
  }
  navigation.navigate("SmartOfferGiftSelection", { returnTo });
};

export const isSplitDiscountOffer = (smartOffer) =>
  smartOffer?.offerType === "split_discount";

/**
 * Progression d'un rabais divisé sur plusieurs commandes.
 *
 * `discountSteps` est la liste des pourcentages, `currentStep` l'index de la
 * prochaine étape à consommer. Le serveur incrémente `currentStep` à chaque
 * commande (createOrderService.js, bloc "split_discount") et bascule l'offre en
 * "applied" quand toutes les étapes sont épuisées. À la première utilisation il
 * recalcule `validUntil` = firstAppliedAt + followupValidityDays : la date
 * limite affichée doit donc toujours venir de `validUntil`, jamais de la règle.
 *
 * Retourne null si l'offre n'est pas un rabais divisé ou si elle est mal
 * configurée (aucune étape exploitable).
 */
export const getSplitDiscountStatus = (smartOffer) => {
  if (!isSplitDiscountOffer(smartOffer)) return null;

  const steps = (
    Array.isArray(smartOffer?.discountSteps) ? smartOffer.discountSteps : []
  )
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!steps.length) return null;

  const totalSteps = steps.length;
  const rawIndex = Math.floor(Number(smartOffer?.currentStep) || 0);
  const currentIndex = Math.min(Math.max(0, rawIndex), totalSteps);
  const isComplete = currentIndex >= totalSteps;

  const validUntil = smartOffer?.validUntil
    ? new Date(smartOffer.validUntil)
    : null;
  const hasValidDeadline =
    validUntil instanceof Date && !Number.isNaN(validUntil.getTime());

  return {
    steps,
    totalSteps,
    currentIndex,
    // Numéro affiché à l'utilisateur (1-based), borné sur la dernière étape.
    currentStepNumber: Math.min(currentIndex + 1, totalSteps),
    currentPercent: isComplete ? 0 : steps[currentIndex],
    usedSteps: currentIndex,
    remainingSteps: Math.max(0, totalSteps - currentIndex),
    nextPercents: isComplete ? [] : steps.slice(currentIndex + 1),
    isComplete,
    hasStarted: currentIndex > 0,
    // Seuil optionnel : le serveur le vérifie pour tous les types d'offres
    // (createOrderService, avant les branches par offerType), donc il doit être
    // annoncé à l'utilisateur et non appliqué en silence.
    threshold: Math.max(0, Number(smartOffer?.bonusThreshold) || 0),
    validUntil: hasValidDeadline ? validUntil : null,
  };
};

/** Nombre de jours entiers restants avant `validUntil`, ou null. */
export const getDaysUntil = (date, now = new Date()) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 86400000));
};

/** Libellé de l'article déclencheur, taille incluse quand elle est imposée. */
export const buildBuyOneGetOneTriggerLabel = (smartOffer) => {
  const name = getBuyOneGetOneTriggerName(smartOffer) || "l'article requis";
  const size = String(smartOffer?.triggerItemSize || "").trim();
  return size ? `${name} (${size})` : name;
};

const DEFERRED_TIMEZONE = "America/Toronto";
const DEFERRED_DAY_BY_RULE = {
  next_monday: 1,
  next_week: 1,
  next_tuesday: 2,
  next_wednesday: 3,
  next_thursday: 4,
  next_friday: 5,
  next_saturday: 6,
  next_sunday: 0,
};
const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const getTorontoWeekday = (date) =>
  WEEKDAYS_EN.indexOf(new Intl.DateTimeFormat("en-US", { timeZone: DEFERRED_TIMEZONE, weekday: "long" }).format(date));
const getTorontoDayKey = (date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: DEFERRED_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

/**
 * Date d'activation de la récompense d'un cashback différé, calculée comme le serveur
 * (DeferredCashbackService.getDeferredActivationDate) : le PROCHAIN jour visé, ou tout de suite
 * pour "immediate" / "next_weekend" quand on est déjà le week-end.
 */
export const getDeferredActivationDate = (offer, now = new Date()) => {
  const rule = offer?.deferredActivationRule || "immediate";
  if (rule === "immediate") return now;
  const today = getTorontoWeekday(now);
  const atDayOffset = (offset) => new Date(now.getTime() + offset * 86400000);
  if (rule === "next_weekend") {
    if (today === 6 || today === 0) return now;
    return atDayOffset(6 - today);
  }
  const targetDay = DEFERRED_DAY_BY_RULE[rule] ?? (Number.isInteger(offer?.deferredTargetDay) ? offer.deferredTargetDay : null);
  if (targetDay === null || today < 0) return null;
  return atDayOffset(((targetDay - today + 7) % 7) || 7);
};

/** "aujourd'hui" ou "le lundi 12 octobre" : quand la récompense du cashback devient utilisable. */
export const getDeferredActivationLabel = (offer, now = new Date()) => {
  const date = getDeferredActivationDate(offer, now);
  if (!date) return "prochainement";
  if (getTorontoDayKey(date) === getTorontoDayKey(now)) return "aujourd'hui";
  return `le ${date.toLocaleDateString("fr-CA", { timeZone: DEFERRED_TIMEZONE, weekday: "long", day: "numeric", month: "long" })}`;
};

/**
 * Cadeau débloqué mais pas encore au panier : le client a rempli la condition d'une offre
 * qui donne un article (seuil atteint, article déclencheur présent…) sans l'ajouter. Sert à
 * l'avertir avant le paiement, sinon il commande sans son cadeau puis réclame.
 */
export const isSmartOfferGiftMissing = ({
  smartOffer = null,
  basketItems = [],
  basketSubtotal = 0,
  // Le cadeau mystère ne se découvre qu'au checkout : le panier ne le vérifie pas.
  includeMystery = true,
}) => {
  if (!smartOffer || !["free_item", "buy_one_get_one", "mystery_gift"].includes(smartOffer.offerType)) return false;
  if (!includeMystery && smartOffer.offerType === "mystery_gift") return false;
  if ((basketItems || []).some((item) => item?.isSmartOfferFreeItem)) return false;
  // Rien à ajouter (ex. cadeau mystère préparé par le restaurant, sans article configuré).
  if (!getSmartOfferGiftOptions(smartOffer).length) return false;
  if (smartOffer.offerType === "mystery_gift") {
    const threshold = Number(smartOffer.mysteryThreshold) || Number(smartOffer.bonusThreshold) || 0;
    return (Number(basketSubtotal) || 0) >= threshold;
  }
  return getSmartOfferGiftStatus({ smartOffer, basketItems, basketSubtotal }).unlocked;
};

export const MISSING_GIFT_TITLE = "Vous n'avez pas ajouté votre cadeau !";
export const MISSING_GIFT_MESSAGE =
  "Vous avez débloqué un article offert, mais il n'est pas encore dans votre panier. Ajoutez-le avant de commander, sinon vous ne le recevrez pas.";

/** Rabais abonnement (%), appliqué quand ni offre personnalisée ni 1re commande ne s'appliquent. */
export const SUBSCRIPTION_DISCOUNT_PERCENT = 15;

// Détermine si une smart offer PRODUIT RÉELLEMENT son effet en ce moment (article/catégorie
// ciblé présent au panier, seuil atteint, etc.) — par opposition à "l'offre existe et est
// active" (ce que `smartOfferActivated` seul indique). Centralise une logique auparavant
// dupliquée (et divergente) entre calculateDiscountedSubtotal, personalizedDiscountAmount et
// la vérification faite à la soumission de la commande : une offre discount_category/
// discount_product sans seuil était par ex. traitée comme "active" même sans l'article ciblé
// au panier, ce qui annulait à tort la remise première commande / abonnement avant que le
// client n'ait réellement ajouté l'article concerné.
/** Offres "globales" (rabais sur tout le panier) qui acceptent des catégories exclues. */
export const OFFER_TYPES_WITH_EXCLUDED_CATEGORIES = ["discount_order", "split_discount", "bonus_basket", "tiered_discount"];

const getExcludedCategoryIds = (smartOffer) =>
  OFFER_TYPES_WITH_EXCLUDED_CATEGORIES.includes(smartOffer?.offerType)
    ? (smartOffer?.excludedCategories || []).map((category) => normalizeId(category?._id || category)).filter(Boolean)
    : [];

/** Noms des catégories exclues du rabais (si elles sont peuplées par le serveur). */
export const getExcludedCategoryNames = (smartOffer) =>
  OFFER_TYPES_WITH_EXCLUDED_CATEGORIES.includes(smartOffer?.offerType)
    ? (smartOffer?.excludedCategories || []).map((category) => String(category?.name || "").trim()).filter(Boolean)
    : [];

/** Rabais globaux (sur tout le panier) : ne couvrent jamais les offres (combos) du panier. */
export const GLOBAL_DISCOUNT_OFFER_TYPES = ["discount_order", "split_discount", "tiered_discount"];

/** Rabais global, y compris la récompense d'un cashback (discount_order isDeferredReward). */
export const isGlobalDiscountOffer = (smartOffer) =>
  GLOBAL_DISCOUNT_OFFER_TYPES.includes(smartOffer?.offerType);

/**
 * Remarque « X, Y ne sont pas compris dans le rabais » : catégories exclues de l'offre + les
 * offres (combos) pour un rabais global. Pour un cashback, vaut pour sa récompense future.
 */
export const getDiscountExclusionsText = (smartOffer) => {
  if (!smartOffer) return "";
  const appliesToReward = smartOffer.offerType === "deferred_cashback";
  const names = appliesToReward
    ? (smartOffer?.excludedCategories || []).map((category) => String(category?.name || "").trim()).filter(Boolean)
    : getExcludedCategoryNames(smartOffer);
  if (isGlobalDiscountOffer(smartOffer) || appliesToReward) names.push("les offres");
  if (!names.length) return "";
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}` : names[0];
  const label = list.charAt(0).toUpperCase() + list.slice(1);
  // Cashback : le rabais n'existe pas encore, il viendra sur une prochaine commande.
  const future = appliesToReward;
  const verb = names.length > 1
    ? future ? "ne seront pas compris" : "ne sont pas compris"
    : names[0] === "les offres"
      ? future ? "ne seront pas comprises" : "ne sont pas comprises"
      : future ? "ne sera pas compris" : "n'est pas compris";
  return `${label} ${verb} dans ${future ? "votre rabais à venir" : "le rabais"}.`;
};

/**
 * Une offre personnalisée remplace la remise 1re commande / abonnement… sauf l'étape 1 d'un
 * cashback : elle ne remise rien sur cette commande, les autres remises restent appliquées et
 * le seuil du cashback se calcule sur le sous-total APRÈS ces remises (comme le serveur).
 */
export const smartOfferReplacesOtherDiscounts = (smartOffer) =>
  Boolean(smartOffer) && smartOffer.offerType !== "deferred_cashback";

/**
 * Seuil / palier atteint, mais rien de remisable dans le panier (que des offres du menu, des
 * catégories exclues ou des articles promo) : l'offre ne produit aucun rabais. Le rabais
 * abonnement / 1re commande s'applique alors à sa place (l'offre ne prend le dessus que
 * lorsqu'elle rapporte réellement quelque chose).
 */
export const NOTHING_ELIGIBLE_MESSAGE =
  "Votre rabais ne s'applique pas aux offres ni aux catégories exclues. Ajoutez des articles du menu pour en profiter.";

export const isSmartOfferThresholdReachedWithoutEligibleItems = ({ smartOffer, basketItems = [], subTotal = 0 }) => {
  if (!smartOffer || !OFFER_TYPES_WITH_EXCLUDED_CATEGORIES.includes(smartOffer.offerType)) return false;
  const sub = parseFloat(subTotal) || 0;
  const reached = smartOffer.offerType === "tiered_discount"
    ? (smartOffer.tieredDiscounts || []).some((tier) => sub >= (Number(tier?.threshold) || 0))
    : sub >= (Number(smartOffer.bonusThreshold) || 0);
  if (!reached || sub <= 0) return false;
  return getSmartOfferConditionStatus({ smartOffer, basketItems, subTotal: sub }).discountAmount <= 0;
};

/** Articles du panier appartenant à une catégorie exclue du rabais de l'offre. */
export const getBasketItemsExcludedFromOffer = (basketItems = [], smartOffer = null) => {
  const excludedIds = getExcludedCategoryIds(smartOffer);
  if (!excludedIds.length) return [];
  return (basketItems || []).filter((item) =>
    excludedIds.includes(normalizeId(item?.category?._id || item?.category)),
  );
};

export const getSmartOfferConditionStatus = ({ smartOffer, basketItems = [], subTotal = 0 }) => {
  if (!smartOffer) return { conditionMet: false, discountAmount: 0 };
  const sub = parseFloat(subTotal) || 0;
  const threshold = smartOffer.bonusThreshold || 0;
  if (threshold > 0 && sub < threshold) {
    return { conditionMet: false, discountAmount: 0 };
  }

  const offerType = smartOffer.offerType;
  // Mêmes règles que le serveur (createOrderService) : les articles des catégories exclues ne
  // sont jamais remisés ; si rien d'autre n'est remisable, l'offre ne s'applique pas.
  const excludedItems = getBasketItemsExcludedFromOffer(basketItems, smartOffer);
  const excludedSubtotal = excludedItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

  if (offerType === "discount_order") {
    // Comme le serveur : seuls les articles remisables comptent — jamais les offres du panier
    // (combos), ni les catégories exclues, ni les articles verrouillés promo.
    const discountableSubtotal = basketItems.reduce(
      (sum, item) => (item?.promoLocked || excludedItems.includes(item) ? sum : sum + (parseFloat(item.price) || 0)),
      0,
    );
    return {
      conditionMet: discountableSubtotal > 0,
      discountAmount: Math.round(discountableSubtotal * (smartOffer.discountValue / 100) * 100) / 100,
    };
  }
  if (offerType === "split_discount") {
    const stepPercent = Number(smartOffer.discountSteps?.[smartOffer.currentStep || 0]) || 0;
    const discountableSubtotal = basketItems.reduce(
      (sum, item) => (item?.promoLocked || excludedItems.includes(item) ? sum : sum + (parseFloat(item.price) || 0)),
      0,
    );
    return {
      conditionMet: discountableSubtotal > 0,
      discountAmount: Math.round(discountableSubtotal * (stepPercent / 100) * 100) / 100,
    };
  }
  if (offerType === "bonus_basket") {
    const eligibleSubtotal = Math.max(0, sub - excludedSubtotal);
    const discountAmount = Math.min(Number(smartOffer.discountValue) || 0, eligibleSubtotal);
    return { conditionMet: discountAmount > 0, discountAmount: Math.round(discountAmount * 100) / 100 };
  }
  if (offerType === "tiered_discount") {
    // Palier choisi sur le sous-total complet (comme le serveur) ; le pourcentage ne s'applique
    // qu'aux articles remisables (ni verrouillés promo, ni de catégorie exclue).
    const tiers = smartOffer.tieredDiscounts || [];
    const sortedTiers = [...tiers].sort((a, b) => b.threshold - a.threshold);
    const appliedTier = sortedTiers.find((t) => sub >= t.threshold);
    const discountableSubtotal = basketItems.reduce(
      (sum, item) => (item?.promoLocked || excludedItems.includes(item) ? sum : sum + (parseFloat(item.price) || 0)),
      0,
    );
    const discountAmount = appliedTier
      ? Math.round(discountableSubtotal * (appliedTier.discountValue / 100) * 100) / 100
      : 0;
    return { conditionMet: discountAmount > 0, discountAmount };
  }
  if (["deferred_cashback", "mystery_gift", "free_delivery", "loyalty_points"].includes(offerType)) {
    // Pas de déduction immédiate sur le sous-total, mais la condition (seuil déjà vérifié
    // ci-dessus) suffit à considérer l'offre comme "en train de s'appliquer".
    return { conditionMet: true, discountAmount: 0 };
  }
  if (offerType === "discount_category") {
    const targetCatId = String(smartOffer.targetCategory?._id || smartOffer.targetCategory || "");
    if (!targetCatId) return { conditionMet: false, discountAmount: 0 };
    const catSubtotal = basketItems.reduce((acc, item) => {
      const itemCat = String(item.category || "");
      return itemCat && itemCat === targetCatId && !item.promoLocked ? acc + (parseFloat(item.price) || 0) : acc;
    }, 0);
    const configuredValue = Number(smartOffer.discountValue) || 0;
    const discountAmount = smartOffer.smartClientValueType === "discount_amount"
      ? Math.min(configuredValue, catSubtotal)
      : catSubtotal * (configuredValue / 100);
    return {
      conditionMet: catSubtotal > 0,
      discountAmount: Math.round(discountAmount * 100) / 100,
    };
  }
  if (["free_item", "buy_one_get_one"].includes(offerType)) {
    let matchingItem = null;
    if (smartOffer.freeItems?.length > 0) {
      matchingItem = basketItems.find((item) =>
        smartOffer.freeItems.some(
          (f) =>
            getBasketItemMenuItemId(item) === String(f.item?._id || f.item || "") &&
            item.size === f.size,
        ),
      );
    } else {
      const freeItemId = String(smartOffer.freeItem?._id || smartOffer.freeItem || "");
      const targetCatId = String(smartOffer.targetCategory?._id || smartOffer.targetCategory || "");
      if (freeItemId) {
        matchingItem = basketItems.find((item) => getBasketItemMenuItemId(item) === freeItemId);
      }
      if (!matchingItem && targetCatId) {
        matchingItem = basketItems.find(
          (item) => String(item.category?._id || item.category || "") === targetCatId,
        );
      }
    }
    // Le prix de base de l'article gratuit est déjà à 0 dans le panier (CustomizeScreen) —
    // seule la présence de l'article compte ici, pas de déduction supplémentaire.
    return { conditionMet: Boolean(matchingItem), discountAmount: 0 };
  }
  if (offerType === "discount_product") {
    const targetMenuItemId = String(smartOffer.targetMenuItem?._id || smartOffer.targetMenuItem || "");
    if (!targetMenuItemId) return { conditionMet: false, discountAmount: 0 };
    // Comme le serveur : TOUS les exemplaires de l'article ciblé sont remisés (pas seulement
    // le premier), et rien si l'article est verrouillé pour les promotions.
    const matchingItems = basketItems.filter(
      (item) => getBasketItemMenuItemId(item) === targetMenuItemId && !item.promoLocked,
    );
    const matchingSubtotal = matchingItems.reduce((acc, item) => acc + (parseFloat(item.price) || 0), 0);
    const configuredValue = Number(smartOffer.discountValue) || 0;
    const productDiscount = smartOffer.smartClientValueType === "discount_amount"
      ? Math.min(configuredValue, matchingSubtotal)
      : matchingSubtotal * (configuredValue / 100);
    return matchingItems.length
      ? {
          conditionMet: true,
          discountAmount: Math.round(productDiscount * 100) / 100,
        }
      : { conditionMet: false, discountAmount: 0 };
  }

  return { conditionMet: false, discountAmount: 0 };
};

/**
 * L'offre s'applique-t-elle VRAIMENT à cette commande ? Règle unique du checkout, utilisée à la
 * fois pour envoyer l'offre avec la commande ET pour décider si elle remplace la remise
 * 1re commande / abonnement : les deux décisions ne peuvent donc plus diverger (sinon le client
 * perd sa remise sans recevoir l'offre, ou le serveur refuse la commande).
 *  - cadeau mystère : son propre seuil (mysteryThreshold) ;
 *  - article offert / 1 acheté = 1 offert : cadeau débloqué ET choisi dans le panier ;
 *  - livraison gratuite : seulement en livraison, et si la livraison est payante sans l'offre
 *    (deliveryFeeWithoutOffer : 0 pour un abonné, déjà livré gratuitement ; null = inconnu) ;
 *  - cashback : seuil calculé après la remise 1re commande / abonnement (cashbackThresholdBase).
 */
export const isSmartOfferAppliedToOrder = ({
  smartOffer,
  basketItems = [],
  subTotal = 0,
  deliveryMode = "delivery",
  deliveryFeeWithoutOffer = null,
  cashbackThresholdBase = null,
}) => {
  if (!smartOffer) return false;
  const sub = parseFloat(subTotal) || 0;
  const offerType = smartOffer.offerType;

  if (offerType === "deferred_cashback") {
    const threshold = Number(smartOffer.deferredThreshold) || Number(smartOffer.bonusThreshold) || 0;
    const base = cashbackThresholdBase === null ? sub : Number(cashbackThresholdBase) || 0;
    return base >= threshold;
  }
  if (["free_item", "buy_one_get_one"].includes(offerType)) {
    const giftUnlocked = getSmartOfferGiftStatus({ smartOffer, basketItems, basketSubtotal: sub }).unlocked;
    const giftSelected = (basketItems || []).some((item) => item?.isSmartOfferFreeItem);
    return giftUnlocked && giftSelected;
  }

  const { conditionMet } = getSmartOfferConditionStatus({ smartOffer, basketItems, subTotal: sub });
  if (!conditionMet) return false;
  if (offerType === "mystery_gift") return sub >= (Number(smartOffer.mysteryThreshold) || 0);
  if (offerType === "free_delivery") {
    return deliveryMode === "delivery" && (deliveryFeeWithoutOffer === null || Number(deliveryFeeWithoutOffer) > 0);
  }
  return true;
};
