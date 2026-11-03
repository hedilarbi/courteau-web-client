import {
  calculateTipAmount,
  getOrderedBasketItems,
  sumSmartOfferGifts,
} from "@/utils/checkoutPricing";

const pizza = { uid: "1", id: "pizza", price: 20.5 };
const giftWithExtra = { uid: "2", id: "frites", price: 2.5, isSmartOfferFreeItem: true };

// Régression : le site gardait le cadeau d'offre personnalisée dans la commande avec un code
// promo, ce qui cumulait cadeau + code et faisait payer ses suppléments.
test("avec un code promo, le cadeau d'offre personnalisée sort de la commande", () => {
  expect(getOrderedBasketItems({ basketItems: [pizza, giftWithExtra], promoCodeApplied: true })).toEqual([pizza]);
  expect(sumSmartOfferGifts([pizza, giftWithExtra])).toBe(2.5);
});

test("sans code promo, le cadeau reste dans la commande", () => {
  expect(getOrderedBasketItems({ basketItems: [pizza, giftWithExtra], promoCodeApplied: false })).toEqual([
    pizza,
    giftWithExtra,
  ]);
});

test("pourboire : un montant libre négatif ou invalide vaut 0", () => {
  expect(calculateTipAmount({ selectedTip: "other", customTip: -4, discountedSubtotal: 30 })).toBe(0);
  expect(calculateTipAmount({ selectedTip: "other", customTip: "abc", discountedSubtotal: 30 })).toBe(0);
  expect(calculateTipAmount({ selectedTip: null, customTip: 5, discountedSubtotal: 30 })).toBe(0);
});
