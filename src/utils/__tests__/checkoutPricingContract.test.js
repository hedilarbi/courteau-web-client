// Contrat de prix partagé avec le serveur (lecourteau-server/tests/fixtures, copié par
// `npm run contract:sync` du serveur) : le site doit faire payer exactement le total que le serveur
// recalcule pour chaque scénario.
import contract from "../__fixtures__/checkout-pricing-contract.json";
import { computeCheckoutPricing } from "@/utils/checkoutPricing";

const FREE_ITEM_FLAGS = ["isSubscriptionFreeItem", "isBirthdayFreeItem", "isSmartOfferFreeItem"];

// Article tel que MenuItemModal l'ajoute au panier : un article offert ne coûte que ses suppléments.
const toBasketItem = (selection, index) => {
  const menuItem = contract.catalog.menuItems[selection.menuItem];
  const customization = selection.toppings.map((toppingId) => ({
    _id: toppingId,
    price: contract.catalog.toppings[toppingId],
  }));
  const extras = customization.reduce((sum, topping) => sum + topping.price, 0);
  const basePrice = menuItem.prices[selection.size];
  const isFree = FREE_ITEM_FLAGS.some((flag) => selection[flag]);
  return {
    uid: `ligne-${index}`,
    id: selection.menuItem,
    size: selection.size,
    price: isFree ? extras : basePrice + extras,
    basePrice,
    originalPrice: basePrice + extras,
    category: menuItem.category,
    promoLocked: menuItem.promoLocked,
    customization,
    ...Object.fromEntries(FREE_ITEM_FLAGS.map((flag) => [flag, Boolean(selection[flag])])),
  };
};

const toBasketOffer = (selection) => ({
  id: selection.offer,
  price: contract.catalog.offers[selection.offer],
  customization: {},
});

// Pourboire choisi dans TipsBlock : pourcentage proposé, ou « autre » avec un montant libre.
const toTipState = (tip) => {
  if (tip?.percent) return { selectedTip: tip.percent, customTip: 0 };
  if (tip?.amount) return { selectedTip: "other", customTip: tip.amount };
  return { selectedTip: null, customTip: 0 };
};

const priceScenario = (scenario) => {
  const basket = contract.baskets[scenario.basket];
  const basketItems = (basket.items || []).map(toBasketItem);
  const basketOffers = (basket.offers || []).map(toBasketOffer);
  const subTotal = [...basketItems, ...basketOffers].reduce((sum, line) => sum + line.price, 0);
  const promoCodeData = scenario.promoCode ? contract.promoCodes[scenario.promoCode] : null;
  const smartOffer = scenario.smartOffer ? contract.smartOffers[scenario.smartOffer] : null;

  return computeCheckoutPricing({
    user: contract.users[scenario.user],
    basketItems,
    basketOffers,
    subTotal,
    promoCodeData,
    promoCodeIsValid: Boolean(promoCodeData),
    smartOffer,
    smartOfferActivated: Boolean(smartOffer),
    deliveryMode: scenario.deliveryMode,
    restaurantDeliveryFee: contract.restaurantDeliveryFee,
    ...toTipState(scenario.tip),
    now: new Date(contract.now),
  });
};

test.each(contract.scenarios.map((scenario) => [scenario.name, scenario]))(
  "contrat de prix : %s",
  (_name, scenario) => {
    const pricing = priceScenario(scenario);
    const { discountedSubtotal, deliveryFee, tip, tps, tvq, referralDiscountApplied, total } = scenario.expected;

    expect({
      discountedSubtotal: pricing.discountedSubtotal,
      deliveryFee: pricing.effectiveDeliveryFee,
      tip: pricing.tipAmount,
      tps: pricing.tps,
      tvq: pricing.tvq,
      referralDiscountApplied: pricing.referralDiscountApplied,
      total: pricing.total,
    }).toEqual({ discountedSubtotal, deliveryFee, tip, tps, tvq, referralDiscountApplied, total });
  },
);
