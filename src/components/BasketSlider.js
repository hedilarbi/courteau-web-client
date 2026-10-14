import { useBasket, useSelectBasket } from "@/context/BasketContext";
import { sendGTMEvent } from "@next/third-parties/google";
import Image from "next/image";
import React, { useRef } from "react";
import { MdClose } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { IoPencilSharp } from "react-icons/io5";

import OfferModal from "./OfferModal";
import MenuItemModal from "./MenuItemModal";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useSmartOffer } from "@/context/SmartOfferContext";
import {
  SUBSCRIPTION_DISCOUNT_PERCENT,
  getDeferredActivationLabel,
  getSingleSmartOfferGiftOption,
  buildBuyOneGetOneTriggerLabel,
  getBuyOneGetOneTriggerId,
  getBasketItemMenuItemId,
  getSmartOfferConditionStatus,
  getSmartOfferGiftOptions,
  getSmartOfferGiftStatus,
  isBuyOneGetOneOffer,
  isSmartOfferGiftMissing,
  isSmartOfferThresholdReachedWithoutEligibleItems,
  NOTHING_ELIGIBLE_MESSAGE,
  smartOfferReplacesOtherDiscounts,
  isSmartOfferAppliedToOrder,
  MISSING_GIFT_MESSAGE,
  MISSING_GIFT_TITLE,
} from "@/utils/smartOfferHandlers";
import { getExcludedCategoriesText, getOfferDetailText, getOfferHeadline } from "@/utils/smartOfferDisplay";
import NoUserModal from "./NoUserModal";

const BasketSlider = ({ setShowBasketSlider, showBasketSlider }) => {
  const basket = useSelectBasket();
  const { user, loading, addPoints } = useUser();
  // smartOfferActivated = offre utilisable (désactivée manuellement au checkout → masquée ici).
  const { smartOffer: availableSmartOffer, smartOfferActivated } = useSmartOffer();
  const smartOffer = smartOfferActivated ? availableSmartOffer : null;
  const smartOfferThreshold = Math.max(
    0,
    smartOffer?.offerType === "deferred_cashback"
      ? (Number(smartOffer?.deferredThreshold) || Number(smartOffer?.bonusThreshold) || 0)
      : smartOffer?.offerType === "mystery_gift"
      ? (Number(smartOffer?.mysteryThreshold) || Number(smartOffer?.bonusThreshold) || 0)
      : (Number(smartOffer?.bonusThreshold) || 0),
  );
  const trackedBasketSubtotal = Math.max(0, Number(basket.subtotal) || 0);
  // Cashback (étape 1) : il ne remplace pas la remise 1re commande / abonnement, et son seuil se
  // calcule sur le sous-total APRÈS cette remise (comme l'app et le serveur).
  const userSubscriptionActive = (() => {
    const status = String(user?.subscriptionStatus || "").toLowerCase();
    const periodEnd = user?.subscriptionCurrentPeriodEnd ? new Date(user.subscriptionCurrentPeriodEnd).getTime() : null;
    return Boolean(user?.subscriptionIsActive) ||
      (["active", "trialing"].includes(status) && (!Number.isFinite(periodEnd) || periodEnd > Date.now()));
  })();
  const progressSubtotal = smartOffer?.offerType === "deferred_cashback" && user
    ? Math.round(
        trackedBasketSubtotal *
          (!user.firstOrderDiscountApplied ? 0.8 : userSubscriptionActive ? (100 - SUBSCRIPTION_DISCOUNT_PERCENT) / 100 : 1) *
          100,
      ) / 100
    : trackedBasketSubtotal;
  const smartOfferProgress =
    smartOfferThreshold > 0
      ? Math.min(100, (progressSubtotal / smartOfferThreshold) * 100)
      : 100;
  const smartOfferUnlocked =
    Boolean(smartOffer) &&
    (smartOfferThreshold <= 0 || progressSubtotal >= smartOfferThreshold);
  const smartOfferRemaining = Math.max(
    0,
    smartOfferThreshold - progressSubtotal,
  );
  const singleSmartOfferGift = getSingleSmartOfferGiftOption(smartOffer);
  const excludedCategoriesText = getExcludedCategoriesText(smartOffer);

  // Rabais actif, mêmes règles que le checkout : offre dont la condition est remplie >
  // 1re commande (20 %) > abonnement.
  const activeDiscount = (() => {
    const total = trackedBasketSubtotal;
    if (!user || !(total > 0)) return null;
    if (smartOffer && smartOfferReplacesOtherDiscounts(smartOffer)) {
      const { discountAmount } = getSmartOfferConditionStatus({
        smartOffer,
        basketItems: basket.items,
        subTotal: total,
      });
      // Même règle que le checkout (isSmartOfferAppliedToOrder) ; mode choisi au checkout :
      // livraison par défaut.
      if (isSmartOfferAppliedToOrder({ smartOffer, basketItems: basket.items, subTotal: total })) {
        return discountAmount > 0
          ? { isSmartOffer: true, amount: discountAmount, label: "Offre personnalisée", title: `Offre personnalisée : −${discountAmount.toFixed(2)}$`, text: getOfferDetailText(smartOffer) }
          : null;
      }
    }
    if (!user.firstOrderDiscountApplied) {
      return {
        amount: Math.round(total * 20) / 100,
        label: "Rabais 1re commande −20 %",
        title: `Rabais 1re commande : −20 % (−${(Math.round(total * 20) / 100).toFixed(2)}$)`,
        text: "Profitez de 20 % de rabais sur votre première commande.",
      };
    }
    const status = String(user.subscriptionStatus || "").toLowerCase();
    const periodEnd = user.subscriptionCurrentPeriodEnd ? new Date(user.subscriptionCurrentPeriodEnd).getTime() : null;
    const subscriptionActive =
      Boolean(user.subscriptionIsActive) ||
      (["active", "trialing"].includes(status) && (!Number.isFinite(periodEnd) || periodEnd > Date.now()));
    if (subscriptionActive) {
      return {
        amount: Math.round(total * SUBSCRIPTION_DISCOUNT_PERCENT) / 100,
        label: `Rabais abonné −${SUBSCRIPTION_DISCOUNT_PERCENT} %`,
        title: `Rabais abonné : −${SUBSCRIPTION_DISCOUNT_PERCENT} % (−${(Math.round(total * SUBSCRIPTION_DISCOUNT_PERCENT) / 100).toFixed(2)}$)`,
        text: `Votre abonnement Club Courteau vous fait économiser ${SUBSCRIPTION_DISCOUNT_PERCENT} % sur cette commande.`,
      };
    }
    return null;
  })();

  const { removeFromBasket, removeOfferFromBasket, removeRewardFromBasket } =
    useBasket();
  const [showOfferModal, setShowOfferModal] = React.useState(false);
  const [showItemModal, setShowItemModal] = React.useState(false);
  const [itemId, setItemId] = React.useState(null);
  const [offerId, setOfferId] = React.useState(null);
  const [itemUID, setItemUID] = React.useState(null);
  const [itemLockedSize, setItemLockedSize] = React.useState(null);
  const [offerUID, setOfferUID] = React.useState(null);
  const [showNoUserModal, setShowNoUserModal] = React.useState(false);
  const beginCheckoutSentRef = useRef(false);
  const router = useRouter();

  React.useEffect(() => {
    if (showBasketSlider) {
      beginCheckoutSentRef.current = false;
    }
  }, [showBasketSlider]);

  // Boutons de l'offre (article visé, article déclencheur du 1 acheté = 1 offert) : on ferme le
  // panier et on va sur la page de l'article, où le client le choisit et le personnalise.
  const openArticlePage = (menuItem) => {
    // La page article accepte le slug, ou à défaut l'identifiant de l'article.
    const target = (typeof menuItem === "object" ? menuItem?.slug || menuItem?._id : menuItem) || "";
    setShowBasketSlider(false);
    router.push(target ? `/menu/articles/${encodeURIComponent(String(target))}` : "/menu");
  };

  const [showMissingGiftDialog, setShowMissingGiftDialog] = React.useState(false);
  const closeGiftWarning = () => setShowMissingGiftDialog(false);
  const addGiftFromWarning = () => {
    setShowMissingGiftDialog(false);
    setShowBasketSlider(false);
    router.push("/menu/cadeaux");
  };
  const continueWithoutGift = () => {
    setShowMissingGiftDialog(false);
    handleNav(true);
  };

  const handleNav = (skipGiftCheck = false) => {
    if (!user) {
      setShowNoUserModal(true);
      return;
    }
    // Garde-fou : cadeau débloqué mais pas ajouté → on prévient avant d'aller payer.
    if (
      skipGiftCheck !== true &&
      isSmartOfferGiftMissing({
        smartOffer,
        basketItems: basket.items,
        basketSubtotal: trackedBasketSubtotal,
        includeMystery: false,
      })
    ) {
      setShowMissingGiftDialog(true);
      return;
    }
    if (beginCheckoutSentRef.current) return;
    beginCheckoutSentRef.current = true;
    setShowBasketSlider(false);

    const ecommerceItems = [
      ...basket.items.map((item) => ({
        item_id: String(item.id),
        item_name: item.name,
        price: Number(item.price) || 0,
        quantity: 1,
        ...(item.categoryName
          ? { item_category: item.categoryName }
          : {}),
      })),
      ...basket.offers.map((offer) => ({
        item_id: String(offer.id),
        item_name: offer.name,
        price: Number(offer.price) || 0,
        quantity: 1,
      })),
      ...basket.rewards.map((reward) => ({
        item_id: String(reward._id || reward.id),
        item_name: reward.name,
        price: Number(reward.extraPrice) || 0,
        quantity: 1,
      })),
    ];

    sendGTMEvent({ ecommerce: null });
    sendGTMEvent({
      event: "begin_checkout",
      ecommerce: {
        currency: "CAD",
        value: Number(basket.subtotal) || 0,
        items: ecommerceItems,
      },
    });
    router.push("/checkout");
  };

  const handleRemoveReward = (reward) => {
    removeRewardFromBasket(reward.uid || reward._id);
    addPoints(Number(reward.points) || 0);
  };

  return (
    <>
    <button
      type="button"
      aria-label="Fermer le panier"
      onClick={() => setShowBasketSlider(false)}
      className={`fixed inset-0 z-40 bg-[#1a1714]/45 backdrop-blur-[2px] transition-opacity duration-300 ${showBasketSlider ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
    />
    <div
      className={`${
        showBasketSlider ? "translate-x-0" : "translate-x-full"
      } fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-[520px] flex-col border-l border-[#e5ddcf] bg-[#fffdf9] shadow-[-24px_0_60px_rgba(26,23,20,.2)] transition-transform duration-300 ease-out`}
    >
      {showMissingGiftDialog && (
      <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60"
              onClick={closeGiftWarning}
            >
              <div className="bg-white rounded-2xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                <p className="font-bold text-lg">{MISSING_GIFT_TITLE}</p>
                <p className="text-sm text-gray-600 mt-2">{MISSING_GIFT_MESSAGE}</p>
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
                    Continuer sans
                  </button>
                </div>
              </div>
            </div>
      )}
      {showNoUserModal && (
        <NoUserModal
          showNoUserModal={showNoUserModal}
          setShowNoUserModal={setShowNoUserModal}
        />
      )}

      {showOfferModal && (
        <OfferModal
          setShowOfferModal={setShowOfferModal}
          itemId={offerId}
          itemUID={offerUID}
          showOfferModal={showOfferModal}
        />
      )}

      {showItemModal && (
        <MenuItemModal
          setShowMenuItemModal={setShowItemModal}
          itemId={itemId}
          itemUID={itemUID}
          showMenuItemModal={showItemModal}
          lockedSize={itemLockedSize}
        />
      )}

      <header className="flex items-center justify-between border-b border-[#ece5d9] bg-white px-5 py-4 md:px-7">
        <div>
          <p className="text-[10px] font-bold tracking-[.16em] text-[#9c9184]">VOTRE COMMANDE</p>
          <h2 className="font-bebas-neue text-3xl leading-none">LE PANIER <span className="text-pr">({basket.size})</span></h2>
        </div>
        <button
          aria-label="Fermer le panier"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#e5ddcf] text-black transition hover:border-pr hover:bg-[#fdf0d6]"
          onClick={() => setShowBasketSlider(false)}
        >
          <MdClose size={28} />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
      {smartOffer && (
        // Carte sombre à contour jaune : elle doit sauter aux yeux sur le fond clair du panier.
        <div className="mb-4 overflow-hidden rounded-2xl border-2 border-pr bg-[#151513] p-4 text-white shadow-[0_12px_28px_rgba(0,0,0,.28)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bebas-neue text-sm tracking-[2px] text-pr">★ Offre personnalisée</p>
              {(() => {
                const { value, pitch } = getOfferHeadline(smartOffer);
                return (
                  <p className="mt-1 flex flex-wrap items-baseline gap-x-2 font-bebas-neue leading-none">
                    {value && <span className="text-4xl text-pr">{value}</span>}
                    <span className="text-xl text-white">{pitch}</span>
                  </p>
                );
              })()}
              {/* Détail utile seulement quand le titre ne dit pas tout (cadeau, paliers…). */}
              {["buy_one_get_one", "free_item", "tiered_discount", "mystery_gift"].includes(smartOffer.offerType) && (
                <p className="text-xs text-gray-300 mt-2">{getOfferDetailText(smartOffer)}</p>
              )}
              {activeDiscount?.isSmartOffer && smartOffer.offerType !== "tiered_discount" && (
                <p className="text-xs font-bold text-green-400 mt-1">{activeDiscount.title.replace("Offre personnalisée", "Rabais appliqué")}</p>
              )}
              {excludedCategoriesText && (
                <p className="text-xs font-semibold text-red-300 mt-1">{excludedCategoriesText}</p>
              )}
              {/* Seuil atteint mais rien de remisable : l'offre ne rapporte rien sur ce panier. */}
              {isSmartOfferThresholdReachedWithoutEligibleItems({ smartOffer, basketItems: basket.items, subTotal: trackedBasketSubtotal }) && (
                <p className="text-xs font-semibold text-pr mt-1">
                  Votre offre ne s&apos;applique pas à ce panier. {NOTHING_ELIGIBLE_MESSAGE}
                  {activeDiscount && !activeDiscount.isSmartOffer ? " En attendant, votre autre rabais s'applique." : ""}
                </p>
              )}
            </div>
            {smartOfferThreshold > 0 && (
              <p className="text-xs font-bold text-white whitespace-nowrap">
                {progressSubtotal.toFixed(2)}$ / {smartOfferThreshold.toFixed(2)}$
              </p>
            )}
          </div>

          {smartOfferThreshold > 0 && (
            <div className="h-2 bg-white/15 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-[#F7A600] rounded-full transition-all duration-300"
                style={{ width: `${smartOfferProgress}%` }}
              />
            </div>
          )}

          {smartOffer.offerType === "deferred_cashback" ? (
            <p className={`text-xs font-semibold mt-2 ${smartOfferUnlocked ? "text-green-400" : "text-gray-300"}`}>
              {smartOfferUnlocked
                ? `Seuil atteint ! ${smartOffer.deferredDiscountValue}% de rabais sur votre prochaine commande dès ${getDeferredActivationLabel(smartOffer)}`
                : `Encore ${smartOfferRemaining.toFixed(2)}$ pour débloquer ${smartOffer.deferredDiscountValue}% de rabais sur votre prochaine commande (${getDeferredActivationLabel(smartOffer)})`}
            </p>
          ) : smartOfferThreshold > 0 && smartOffer.offerType !== "tiered_discount" ? (
            // Sans seuil (ou paliers) : pas de ligne « Seuil atteint », les blocs dédiés suffisent.
            <>
            <p
              className={`text-xs font-semibold mt-2 ${
                smartOfferUnlocked ? "text-green-400" : "text-gray-300"
              }`}
            >
              {/* Mêmes libellés que le panier de l'app (CardScreen). */}
              {smartOfferUnlocked
                ? smartOffer.offerType === "bonus_basket"
                  ? `Seuil atteint — ${smartOffer.discountValue}$ de rabais`
                  : smartOffer.offerType === "discount_order"
                  ? `Seuil atteint — ${smartOffer.discountValue}% de rabais`
                  : smartOffer.offerType === "free_delivery"
                  ? "Livraison gratuite débloquée !"
                  : smartOffer.offerType === "loyalty_points"
                  ? `Seuil atteint — ${Math.floor(Number(smartOffer.bonusPoints) || 0)} points de fidélité bonus`
                  : "Seuil atteint !"
                : smartOffer.offerType === "loyalty_points"
                ? `Encore ${smartOfferRemaining.toFixed(2)}$ pour gagner ${Math.floor(Number(smartOffer.bonusPoints) || 0)} points de fidélité bonus`
                : `Encore ${smartOfferRemaining.toFixed(2)}$ pour débloquer : ${
                    smartOffer.offerType === "bonus_basket"
                      ? `${smartOffer.discountValue}$ de rabais`
                      : smartOffer.offerType === "discount_order"
                      ? `${smartOffer.discountValue}% de rabais`
                      : smartOffer.offerType === "free_delivery"
                      ? "la livraison gratuite"
                      : smartOffer.offerType === "free_item"
                      ? singleSmartOfferGift?.item?.name || "l’article offert"
                      : smartOffer.offerType === "buy_one_get_one"
                      ? "le cadeau"
                      : smartOffer.offerType === "mystery_gift"
                      ? "le cadeau mystère"
                      : smartOffer.offerType === "split_discount"
                      ? "le rabais divisé"
                      : "le rabais"
                  }`}
            </p>
            {smartOfferUnlocked && ["free_delivery", "split_discount", "bonus_basket"].includes(smartOffer.offerType) && (
              <p className="text-xs text-green-400 mt-1">
                {smartOffer.offerType === "free_delivery"
                  ? "Les frais de livraison seront de 0$ au paiement"
                  : smartOffer.offerType === "split_discount"
                  ? "Le rabais divisé s'appliquera au paiement"
                  : `${smartOffer.discountValue}$ de rabais sera appliqué à votre commande`}
              </p>
            )}
            </>
          ) : null}

          {/* Rabais par paliers : progression vers le 1er palier ; une fois atteint, rabais obtenu
              + progression vers le palier suivant. */}
          {smartOffer.offerType === "tiered_discount" && (() => {
            const tiers = [...(smartOffer.tieredDiscounts || [])]
              .map((tier) => ({ threshold: Number(tier?.threshold) || 0, discountValue: Number(tier?.discountValue) || 0 }))
              .sort((a, b) => a.threshold - b.threshold);
            if (!tiers.length) return null;
            const total = trackedBasketSubtotal;
            const currentTier = [...tiers].reverse().find((tier) => total >= tier.threshold) || null;
            const nextTier = tiers.find((tier) => total < tier.threshold) || null;
            const segmentStart = currentTier ? currentTier.threshold : 0;
            const progress = nextTier
              ? Math.max(0, Math.min(1, (total - segmentStart) / Math.max(0.01, nextTier.threshold - segmentStart)))
              : 1;
            const { discountAmount } = getSmartOfferConditionStatus({ smartOffer, basketItems: basket.items, subTotal: total });
            return (
              <div className="mt-3">
                <p className={`text-xs font-bold ${currentTier ? "text-green-400" : "text-pr"}`}>
                  {currentTier
                    ? discountAmount > 0
                      ? `Palier atteint : ${currentTier.discountValue}% de rabais (−${discountAmount.toFixed(2)}$)`
                      : `Palier ${currentTier.discountValue}% atteint (rien à remiser)`
                    : `Encore ${(tiers[0].threshold - total).toFixed(2)}$ pour débloquer ${tiers[0].discountValue}% de rabais`}
                </p>
                {currentTier && (
                  <p className="text-xs text-gray-300 mt-0.5">
                    {nextTier
                      ? `Encore ${(nextTier.threshold - total).toFixed(2)}$ pour passer à ${nextTier.discountValue}% de rabais.`
                      : "Vous avez atteint le palier maximum !"}
                  </p>
                )}
                <div className="h-2 bg-white/15 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${nextTier ? "bg-[#F7A600]" : "bg-[#10B981]"}`}
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                {nextTier && (
                  <div className="flex justify-between mt-1 text-[11px] font-bold">
                    <span className="text-gray-400">
                      {currentTier ? `${currentTier.discountValue}% · ${currentTier.threshold}$` : "0$"}
                    </span>
                    <span className="text-pr">{nextTier.discountValue}% dès {nextTier.threshold}$</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Rabais sur une catégorie / un produit : comme le panier de l'app, on dit au client s'il
              manque l'article visé, avec un bouton pour l'ajouter. */}
          {smartOffer.offerType === "discount_category" && (() => {
            const targetCategoryId = String(smartOffer.targetCategory?._id || smartOffer.targetCategory || "");
            const targetCategoryName = smartOffer.targetCategory?.name || "de la catégorie";
            const hasCategoryItem = basket.items.some(
              (item) => !item?.isSmartOfferFreeItem && String(item?.category?._id || item?.category || "") === targetCategoryId,
            );
            return (
              <div className={`mt-3 rounded-xl border p-3 ${hasCategoryItem ? "border-green-400/40 bg-green-400/10" : "border-pr/50 bg-pr/10"}`}>
                <p className={`text-sm font-semibold ${hasCategoryItem ? "text-green-400" : "text-white"}`}>
                  {hasCategoryItem
                    ? `Le rabais s'applique uniquement à vos articles « ${targetCategoryName} », pas au reste du panier. Ajoutez-en d'autres pour en profiter davantage.`
                    : `Le rabais s'applique uniquement aux articles de la catégorie « ${targetCategoryName} ». Ajoutez-en un pour en profiter.`}
                </p>
                <button
                  type="button"
                  className="mt-3 w-full rounded-lg bg-pr px-3 py-2.5 font-bebas-neue text-lg tracking-wide text-black cursor-pointer hover:brightness-95"
                  onClick={() => {
                    setShowBasketSlider(false);
                    router.push(smartOffer.targetCategory?.slug ? `/menu/${smartOffer.targetCategory.slug}` : "/menu");
                  }}
                >
                  {hasCategoryItem ? "Ajouter un autre" : `Voir les ${String(targetCategoryName).toLowerCase()}`}
                </button>
              </div>
            );
          })()}
          {smartOffer.offerType === "discount_product" && (() => {
            const targetProductId = String(smartOffer.targetMenuItem?._id || smartOffer.targetMenuItem || "");
            const targetProductName = smartOffer.targetMenuItem?.name || "";
            const hasProductItem = basket.items.some(
              (item) => !item?.isSmartOfferFreeItem && getBasketItemMenuItemId(item) === targetProductId,
            );
            return (
              <div className={`mt-3 rounded-xl border p-3 ${hasProductItem ? "border-green-400/40 bg-green-400/10" : "border-pr/50 bg-pr/10"}`}>
                <p className={`text-sm font-semibold ${hasProductItem ? "text-green-400" : "text-white"}`}>
                  {hasProductItem
                    ? `Le rabais s'applique à « ${targetProductName} » dans votre panier. Ajoutez-en un autre pour cumuler le rabais sur celui-ci aussi.`
                    : targetProductName
                      ? `Ajoutez « ${targetProductName} » à votre panier pour bénéficier de ${smartOffer.discountValue}% de rabais sur celui-ci.`
                      : `Ajoutez l'article en promotion à votre panier pour bénéficier de ${smartOffer.discountValue}% de rabais sur celui-ci.`}
                </p>
                {targetProductId && (
                  <button
                    type="button"
                    className="mt-3 w-full rounded-lg bg-pr px-3 py-2.5 font-bebas-neue text-lg tracking-wide text-black cursor-pointer hover:brightness-95"
                    onClick={() => openArticlePage(smartOffer.targetMenuItem)}
                  >
                    {hasProductItem ? "Ajouter un autre" : "Ajouter l'article"}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Offres à cadeau : article déclencheur (1 acheté = 1 offert) puis ajout du cadeau */}
          {["free_item", "buy_one_get_one", "mystery_gift"].includes(smartOffer.offerType) && (() => {
            const hasGiftInCart = basket.items.some((item) => item?.isSmartOfferFreeItem);
            const giftStatus = getSmartOfferGiftStatus({
              smartOffer,
              basketItems: basket.items,
              basketSubtotal: trackedBasketSubtotal,
            });
            const giftUnlocked = smartOffer.offerType === "mystery_gift" ? smartOfferUnlocked : giftStatus.unlocked;
            const triggerId = getBuyOneGetOneTriggerId(smartOffer);
            const needsTrigger = isBuyOneGetOneOffer(smartOffer) && triggerId && !giftStatus.hasTrigger;
            const hasGiftOptions = getSmartOfferGiftOptions(smartOffer).length > 0;
            return (
              <>
                {needsTrigger && (
                  <button
                    type="button"
                    className="mt-3 w-full rounded-lg bg-pr px-3 py-2.5 font-bebas-neue text-lg tracking-wide text-black cursor-pointer hover:brightness-95"
                    onClick={() => openArticlePage(smartOffer.triggerItem)}
                  >
                    Ajouter {buildBuyOneGetOneTriggerLabel(smartOffer)}
                  </button>
                )}
                {hasGiftInCart ? (
                  <p className="text-xs font-semibold text-green-400 mt-2">Votre cadeau est dans le panier.</p>
                ) : giftUnlocked && smartOffer.offerType === "mystery_gift" ? (
                  // Le cadeau mystère se découvre et s'ajoute au checkout, pas dans le panier.
                  <p className="text-xs font-semibold text-green-400 mt-2">
                    {hasGiftOptions
                      ? "Cadeau Mystère débloqué ! Découvrez-le au paiement."
                      : "Cadeau Mystère débloqué ! Il sera ajouté à votre commande."}
                  </p>
                ) : giftUnlocked && hasGiftOptions ? (
                  <button
                    type="button"
                    className="mt-3 w-full rounded-lg bg-pr px-3 py-2.5 font-bebas-neue text-lg tracking-wide text-black cursor-pointer hover:brightness-95"
                    onClick={() => {
                      setShowBasketSlider(false);
                      router.push("/menu/cadeaux");
                    }}
                  >
                    {singleSmartOfferGift
                      ? "Ajouter mon cadeau"
                      : `Choisissez votre ${String(
                          smartOffer.targetCategory?.name ||
                            smartOffer.freeItems?.[0]?.item?.category?.name ||
                            "cadeau",
                        ).toLowerCase()}`}
                  </button>
                ) : null}
              </>
            );
          })()}
        </div>
      )}
      {basket.size !== 0 ? (
        <div className="rounded-2xl border border-[#ece5d9] bg-white p-4 md:p-5">
          <div className="">
            {basket.items.length > 0 && (
              <div>
                <p className="text-black font-inter text-base mt-4 font-semibold">
                  Articles
                </p>
                {basket.items.map((item, index) => (
                  <div
                    key={item.uid}
                    className={`${
                      index === basket.items.length - 1
                        ? "border-b-0"
                        : "border-b-2"
                    } flex flex-row gap-3 border-[#ece5d9] py-4 items-start`}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={70}
                      height={70}
                      className="h-20 w-20 shrink-0 rounded-xl object-cover md:h-24 md:w-24"
                    />

                    <div className="flex-1 w-full flex-col">
                      <div className="flex justify-between  w-full">
                        <p className="text-black font-semibold font-inter text-base  ">
                          {item.name}
                        </p>
                        <p className="text-pr font-semibold font-inter text-base">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-[#4B5563] text-inter font-medium text-xs mt-1">
                        Format: {item.size.size}
                      </p>
                      {item.customization.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-inter font-semibold text-black">
                            Personnalisations:
                          </p>
                          <div className="mt-1 ml-4 text-xs font-inter">
                            {item.customization.map((custom, index) => (
                              <div key={index} className="flex items-center">
                                <div className="h-2 w-2 rounded-full bg-pr mr-2"></div>

                                <p className="text-[#4B5563] capitalize">
                                  {custom.name}
                                  {custom.price > 0 &&
                                    `(+$${custom.price.toFixed(2)} )`}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {item.comment && (
                        <div className="mt-2">
                          <p className="text-xs font-inter text-gray-600">
                            Commentaire: {item.comment ? item.comment : "Aucun"}
                          </p>
                        </div>
                      )}
                      <div className="flex justify-between w-full mt-2">
                        <button
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#fdf0d6] px-3 py-2 text-xs font-semibold text-[#8a5f00]"
                          onClick={() => {
                            setItemId(item.id);
                            setItemUID(item.uid);
                            setItemLockedSize(null);
                            setShowItemModal(true);
                          }}
                        >
                          <IoPencilSharp />
                          <p className="font-inter font-medium">Modifier</p>
                        </button>
                        <button
                          className="flex cursor-pointer items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-[#a3342b] hover:bg-red-50"
                          onClick={() => removeFromBasket(item.uid)}
                        >
                          <FaTrash />
                          <p className="font-inter font-semibold">Supprimer</p>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {basket.offers.length > 0 && (
              <div>
                <p className="text-black font-inter text-base mt-4 font-semibold">
                  Offres
                </p>
                {basket.offers.map((item, index) => (
                  <div
                    key={item.uid}
                    className={`${
                      index === basket.offers.length - 1
                        ? "border-b-0"
                        : "border-b-2"
                    } flex flex-row gap-3 py-4 border-[#ece5d9] items-start`}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={70}
                      height={70}
                      className="h-20 w-20 shrink-0 rounded-xl object-cover md:h-24 md:w-24"
                    />

                    <div className="flex-1 w-full flex-col">
                      <div className="flex justify-between  w-full">
                        <p className="text-black font-semibold font-inter text-base  ">
                          {item.name}
                        </p>
                        <p className="text-pr font-semibold font-inter text-base">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      {/* Offre à choix : rappel des articles choisis. */}
                      {Number(item.itemsToChoose) > 0 && Array.isArray(item.items) && item.items.length > 0 && (
                        <p className="text-xs font-inter text-gray-600 mt-1">
                          {item.items
                            .map((line) => `${Number(line?.quantity) > 1 ? `${line.quantity} × ` : ""}${line?.item?.name || ""}`)
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}

                      {item.customization && (
                        <div className="mt-2">
                          <p className="text-xs font-inter font-semibold text-black">
                            Personnalisations:
                          </p>
                          <div className="mt-1 ml-4 text-xs font-inter">
                            {Object.entries(item.customization).map(
                              ([key, customArr], idx) => {
                                const matchedItem = item.items?.find(
                                  (i) => i.item._id === key,
                                );

                                const itemName = matchedItem
                                  ? matchedItem.item.name
                                  : key;
                                return (
                                  <div key={key + idx}>
                                    {customArr.map((custom, i) => (
                                      <div key={i} className="mb-1">
                                        <p className="text-black font-semibold">
                                          {itemName} ({i + 1})
                                        </p>
                                        {custom.map((c) => (
                                          <div
                                            key={c._id}
                                            className="flex items-center ml-2"
                                          >
                                            <div className="h-2 w-2 rounded-full bg-pr mr-2"></div>
                                            <p className="text-[#4B5563] capitalize">
                                              {c.name}
                                              {c.price > 0 &&
                                                `(+${c.price.toFixed(2)})`}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}
                      {item.comment && (
                        <div className="mt-2">
                          <p className="text-xs font-inter text-gray-600">
                            Commentaire: {item.comment ? item.comment : "Aucun"}
                          </p>
                        </div>
                      )}
                      <div className="flex justify-between w-full mt-2">
                        <button
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#fdf0d6] px-3 py-2 text-xs font-semibold text-[#8a5f00]"
                          onClick={() => {
                            setOfferId(item.id);
                            setOfferUID(item.uid);
                            setShowOfferModal(true);
                          }}
                        >
                          <IoPencilSharp />
                          <p className="font-inter font-medium">Modifier</p>
                        </button>
                        <button
                          className="flex cursor-pointer items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-[#a3342b] hover:bg-red-50"
                          onClick={() => removeOfferFromBasket(item.uid)}
                        >
                          <FaTrash />
                          <p className="font-inter font-semibold">Supprimer</p>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {basket.rewards.length > 0 && (
              <div>
                <p className="text-black font-inter text-base mt-4 font-semibold">
                  Récompenses
                </p>
                {basket.rewards.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between py-2 border-b border-gray-200 ${
                      index === basket.rewards.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <Image
                      src={item.item.image}
                      alt={item.item.name}
                      width={70}
                      height={70}
                      className="object-cover rounded-xl  md:w-40  w-14  h-30"
                    />
                    <div className="ml-2 min-w-0 flex-1">
                      <p className="text-sm font-inter text-gray-700">
                        {item.item.name}
                      </p>
                      {item.size && (
                        <p className="text-xs font-inter text-gray-500 mt-1">
                          Taille : {item.size?.size || item.size}
                        </p>
                      )}
                      {item.customization?.length > 0 && (
                        <p className="text-xs font-inter text-gray-500 mt-1">
                          Personnalisations :{" "}
                          {item.customization
                            .map((customization) => customization?.name)
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                      {Number(item.extraPrice) > 0 && (
                        <p className="text-xs font-inter font-semibold text-pr mt-1">
                          Extras : ${Number(item.extraPrice).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <button
                      className="bg-red-500 flex items-center justify-center gap-2 text-white text-sm cursor-pointer px-3 py-2 rounded-md mt-2"
                      onClick={() => handleRemoveReward(item)}
                    >
                      <FaTrash />
                      <p className="font-inter font-semibold">Supprimer</p>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#ddd4c4] bg-white p-8 text-center">
          <p className="font-bebas-neue text-3xl">VOTRE PANIER EST VIDE</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#8a8074]">Ajoutez vos plats préférés depuis le menu pour commencer votre commande.</p>
        </div>
      )}
      </div>
      {basket.size !== 0 && (
        <div className="border-t border-[#ece5d9] bg-white px-5 py-4 shadow-[0_-12px_30px_rgba(26,23,20,.06)] md:px-7">
          {/* Comme le panier de l'app : nouveau prix + ancien prix barré quand un rabais s'applique. */}
          <div className="flex justify-between items-end w-full">
            <div>
              <p className="text-black font-semibold md:text-base text-sm">Sous-total</p>
              {activeDiscount?.amount > 0 && (
                <p className="text-xs font-semibold text-green-700">{activeDiscount.label} : −{activeDiscount.amount.toFixed(2)}$</p>
              )}
            </div>
            <p className="flex items-baseline gap-2">
              {activeDiscount?.amount > 0 && (
                <span className="font-bebas-neue text-xl text-[#9b9184] line-through">${basket.subtotal.toFixed(2)}</span>
              )}
              <span className="font-bebas-neue text-3xl text-black">
                ${Math.max(0, Math.round((basket.subtotal - (activeDiscount?.amount || 0)) * 100) / 100).toFixed(2)}
              </span>
            </p>
          </div>
          <div className="mt-2">
            <button
              className={`${
                basket.size === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-pr cursor-pointer"
              } w-full rounded-xl px-4 py-4 font-bebas-neue text-xl tracking-wider text-black transition hover:-translate-y-0.5`}
              disabled={basket.size === 0}
              onClick={handleNav}
            >
              PASSER LA COMMANDE
            </button>
            <p className="mt-3 text-center text-sm text-[#6e6659]">
              <span
                className="cursor-pointer font-semibold underline decoration-pr decoration-2 underline-offset-4"
                onClick={() => setShowBasketSlider(false)}
              >
                Continuer mes achats
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default BasketSlider;
