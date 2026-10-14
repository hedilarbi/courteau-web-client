// Textes d'affichage des offres personnalisées (accueil : modal + bannière), identiques à
// l'app mobile (HomeScreen.js).
import { getDeferredActivationLabel, getDiscountExclusionsText } from "./smartOfferHandlers";

/** "2j 4h", "3h 12m", "8m 05s" */
export const formatOfferCountdown = (diffMs) => {
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}j ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
};

/** Grand chiffre + accroche de la bannière selon le type d'offre. */
export const getOfferHeadline = (offer) => {
  const value = Number(offer?.discountValue) || 0;
  switch (offer?.offerType) {
    case "discount_order":
      return { value: `−${value} %`, pitch: "SUR VOTRE COMMANDE" };
    case "discount_category":
      return { value: `−${value} %`, pitch: `SUR LA CATÉGORIE ${String(offer?.targetCategory?.name || "").toUpperCase()}` };
    case "discount_product":
      return { value: `−${value} %`, pitch: `SUR ${String(offer?.targetMenuItem?.name || "UN ARTICLE").toUpperCase()}` };
    case "bonus_basket":
      return { value: `−${value} $`, pitch: "SUR VOTRE COMMANDE" };
    case "split_discount":
      return { value: `−${Number(offer?.discountSteps?.[offer?.currentStep || 0]) || 0} %`, pitch: "SUR VOTRE PROCHAINE COMMANDE" };
    case "free_item":
      return { value: "OFFERT", pitch: String(offer?.freeItem?.name || offer?.freeItems?.[0]?.item?.name || "UN ARTICLE OFFERT").toUpperCase() };
    case "buy_one_get_one":
      return { value: "1 = 2", pitch: "1 ACHETÉ = 1 OFFERT" };
    case "free_delivery":
      return { value: "0 $", pitch: "LIVRAISON OFFERTE" };
    case "loyalty_points":
      return { value: `+${Math.floor(Number(offer?.bonusPoints) || 0)}`, pitch: "POINTS DE FIDÉLITÉ BONUS" };
    case "tiered_discount": {
      // Le plus gros palier fait le titre ("−20 % dès 40 $ d'achat") ; le détail liste tous les paliers.
      const top = [...(offer?.tieredDiscounts || [])]
        .map((t) => ({ threshold: Number(t?.threshold) || 0, discountValue: Number(t?.discountValue) || 0 }))
        .sort((a, b) => b.discountValue - a.discountValue)[0];
      return top
        ? { value: `−${top.discountValue} %`, pitch: `DÈS ${top.threshold} $ D'ACHAT` }
        : { value: "", pitch: "RABAIS PAR PALIERS" };
    }
    case "deferred_cashback":
      return { value: `−${Number(offer?.deferredDiscountValue) || 0} %`, pitch: "SUR UNE PROCHAINE COMMANDE" };
    case "mystery_gift":
      return { value: "?", pitch: "CADEAU MYSTÈRE" };
    default:
      return { value: "", pitch: String(offer?.notificationTitle || "OFFRE EXCLUSIVE").toUpperCase() };
  }
};

/** Phrase descriptive de l'offre. */
export const getOfferDetailText = (offer) => {
  if (!offer) return "";
  const { offerType, discountValue, bonusThreshold, targetCategory, freeItem, notificationBody } = offer;
  const threshold = bonusThreshold > 0 ? ` dès ${bonusThreshold}$ d'achat` : "";
  switch (offerType) {
    case "bonus_basket":
      return `Rabais de ${discountValue}$${threshold || " sur votre commande"}.`;
    case "discount_category":
      return `${discountValue}% de rabais sur les articles de la catégorie ${targetCategory?.name || "ciblée"}${threshold}.`;
    case "discount_order":
      return `${discountValue}% de rabais sur votre commande${threshold}.`;
    case "split_discount": {
      const step = offer.currentStep || 0;
      return `${offer.discountSteps?.[step] || 0}% de rabais — commande ${step + 1}/${offer.discountSteps?.length || 0}.`;
    }
    case "buy_one_get_one":
      return `${offer.triggerItem?.name || "Un article"} acheté = ${offer.freeItem?.name || "un article"} offert.`;
    case "discount_product":
      return `${discountValue}% de rabais sur ${offer.targetMenuItem?.name || "le produit ciblé"}${threshold}.`;
    case "free_delivery":
      return `Livraison gratuite sur votre commande${threshold}.`;
    case "free_item": {
      const itemName = freeItem?.name || offer.freeItems?.[0]?.item?.name || (targetCategory?.name ? `Au choix (${targetCategory.name})` : "Au choix dans notre carte");
      return `Article offert : ${itemName}${threshold}.`;
    }
    case "loyalty_points":
      return `${Math.floor(Number(offer.bonusPoints) || 0)} points de fidélité bonus${threshold}.`;
    case "deferred_cashback":
      // La date d'activation dépend du jour d'achat : elle est calculée pour un achat aujourd'hui.
      return `Achetez aujourd'hui pour ${offer.deferredThreshold || 0}$ et recevez un rabais de ${offer.deferredDiscountValue || 0}% ${getDeferredActivationLabel(offer)}.`;
    case "tiered_discount":
      return `Plus votre panier est gros, plus le rabais augmente : ${[...(offer.tieredDiscounts || [])]
        .map((t) => ({ threshold: Number(t?.threshold) || 0, discountValue: Number(t?.discountValue) || 0 }))
        .sort((a, b) => a.threshold - b.threshold)
        .map((t) => `${t.discountValue} % dès ${t.threshold} $`)
        .join(" · ")}.`;
    case "mystery_gift":
      return `Débloquez un Cadeau Mystère dès ${offer.mysteryThreshold || 0}$ d'achat !`;
    default:
      return notificationBody || "Profitez de votre avantage exclusif.";
  }
};

/** Toutes les offres valent pour une seule commande, sauf le rabais divisé. */
export const isSingleOrderOffer = (offer) => Boolean(offer) && offer.offerType !== "split_discount";

export const SINGLE_ORDER_TEXT = "Cette offre est valable uniquement pour cette commande !";

/** « Desserts, Boissons et les offres ne sont pas compris dans le rabais. » (même texte que l'app) */
export const getExcludedCategoriesText = (offer) => getDiscountExclusionsText(offer);

// ── Détail de commande : avantage de l'offre personnalisée utilisée (identique à l'app) ──
const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatPercent = (value) => {
  const normalized = toSafeNumber(value, 0);
  return Number.isInteger(normalized)
    ? `${normalized}%`
    : `${normalized.toFixed(2)}%`;
};

export const getPersonalizedOfferBenefitLabel = (offer, order, giftItemName) => {
  const value = toSafeNumber(offer?.discountValue, 0);

  switch (offer?.offerType) {
    case "discount_order":
      return `-${formatPercent(value)} sur la commande`;
    case "discount_category":
      return `-${formatPercent(value)} sur la catégorie ${offer?.targetCategory?.name || "ciblée"}`;
    case "discount_product":
      return `-${formatPercent(value)} sur ${offer?.targetMenuItem?.name || "l'article ciblé"}`;
    case "split_discount": {
      const steps = (Array.isArray(offer?.discountSteps) ? offer.discountSteps : [])
        .map(Number)
        .filter((step) => Number.isFinite(step) && step > 0);
      // currentStep a avancé depuis ; l'étape consommée par CETTE commande est sur la commande.
      const stepIndex = Math.floor(toSafeNumber(order?.smartOfferUsageStep, 0));
      return steps[stepIndex]
        ? `-${formatPercent(steps[stepIndex])} — étape ${stepIndex + 1}/${steps.length}`
        : "Rabais en plusieurs étapes";
    }
    case "tiered_discount": {
      const subtotal = toSafeNumber(order?.sub_total, 0);
      const tier = (Array.isArray(offer?.tieredDiscounts) ? offer.tieredDiscounts : [])
        .filter((t) => subtotal >= toSafeNumber(t?.threshold, Infinity))
        .sort((a, b) => toSafeNumber(b?.threshold, 0) - toSafeNumber(a?.threshold, 0))[0];
      return tier
        ? `-${formatPercent(tier.discountValue)} (palier dès ${toSafeNumber(tier.threshold, 0)}$)`
        : "Rabais par paliers";
    }
    case "bonus_basket":
      return `-${value.toFixed(2)}$ sur la commande`;
    case "free_item":
      return `${giftItemName || "Article"} offert`;
    case "buy_one_get_one":
      return `${giftItemName || "Article"} offert (1 acheté = 1 offert)`;
    case "free_delivery":
      return "Livraison offerte";
    case "loyalty_points":
      return `+${toSafeNumber(order?.smartOfferBonusPoints, toSafeNumber(offer?.bonusPoints, 0))} points fidélité`;
    case "mystery_gift": {
      // Priorité à l'article réellement offert dans la commande, puis au nom enregistré.
      const mysteryName = giftItemName || order?.smartOfferMysteryGiftName || offer?.mysteryItemName;
      return mysteryName ? `Cadeau surprise : ${mysteryName}` : "Cadeau surprise offert";
    }
    case "deferred_cashback":
      return "Cashback sur une prochaine commande";
    default:
      return "";
  }
};

