"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import {
  cancelPaymentIntent,
  catchError,
  confirmPaiment,
  createOrder,
  createZeroTotalSubscriptionOrder,
  getPaymentIntentClientSecret,
  getPaymentMethods,
} from "@/services/UserServices";
import {
  checkRestaurantOrderAvailability,
  verifyPromoCode,
} from "@/services/FoodServices";

import { calculateDistance } from "@/utils/locationHandlers";
import { getScheduleValidationError } from "@/utils/dateHandlers";
import {
  useBasket,
  useSelectBasket,
  useSelectBasketItems,
  useSelectBasketOffers,
} from "@/context/BasketContext";
import { useRouter } from "next/navigation";
import Spinner from "./spinner/Spinner";
import Image from "next/image";

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

const buildBasketItemsSubtotal = (basketItems = []) =>
  roundMoney(
    (basketItems || []).reduce((sum, item) => sum + toSafeNumber(item?.price, 0), 0),
    0
  );

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
    return buildBasketItemsSubtotal(basketItems);
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

const buildOrderAvailabilityErrorMessage = (availabilityData = {}) => {
  const unavailableItems = Array.isArray(availabilityData?.unavailableItems)
    ? availabilityData.unavailableItems
    : [];
  const unavailableOffers = Array.isArray(availabilityData?.unavailableOffers)
    ? availabilityData.unavailableOffers
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

  if (!parts.length) {
    return "Impossible de vérifier la disponibilité des articles.";
  }

  return parts.join(" | ");
};

export default function CheckoutCard({
  user,
  total,
  selectedRestaurant,
  address,
  deliveryMode,
  tipAmount,
  promoCode,
  subscriptionBenefits,
  birthdayBenefits,
  orderDiscountPercent,
  effectiveDeliveryFee,
  isZeroTotalSubscriptionOrder,
  subTotalWithDiscount,
  canOrder,
  isScheduledOrder,
  scheduledDateTime,
  setPromoCodeData,
  setPromoCodeIsValid,
  setPromoCodeError,
}) {
  const { clearBasket } = useBasket();
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const basket = useSelectBasket();
  const basketItems = useSelectBasketItems();
  const basketOffers = useSelectBasketOffers();
  const [cardsLoading, setCardsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [selectedPmId, setSelectedPmId] = useState(null);
  const [showCardField, setShowCardField] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [error, setError] = useState(null);
  const paymentFlowLockRef = useRef(false);
  const checkoutAttemptRef = useRef(null);
  const basketSubtotal = useMemo(
    () => roundMoney(basket?.subtotal, 0),
    [basket?.subtotal]
  );
  const normalizedTotal = useMemo(
    () => Math.round(Number(total || 0) * 100) / 100,
    [total]
  );
  const isAddressValid =
    deliveryMode !== "delivery" ||
    (!!address?.address &&
      !!address?.coords?.latitude &&
      !!address?.coords?.longitude);

  const brandIcon = (brand) => {
    switch (brand) {
      case "visa":
        return <Image src="/visa.svg" alt="Visa" width={50} height={22} />;
      case "mastercard":
        return (
          <Image
            src="/mastercard.svg"
            alt="Mastercard"
            width={50}
            height={32}
          />
        );
      case "amex":
        return (
          <Image
            src="/amex.svg"
            alt="American Express"
            width={50}
            height={32}
          />
        );
      default:
        return <Image src="/visa.svg" alt="Visa" width={50} height={32} />;
    }
  };

  // Load saved cards (PaymentMethods)
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setCardsLoading(true);
        if (user?.stripe_id) {
          const response = await getPaymentMethods(user.stripe_id);

          if (!ignore) {
            setCards(response.data || []);
            setShowCardField(!(response.data && response.data.length > 0));
          }
        } else {
          setShowCardField(true);
        }
      } catch (e) {
        setShowCardField(true);
      } finally {
        setCardsLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [user?.stripe_id]);

  const amountCents = useMemo(() => Math.round(normalizedTotal * 100), [
    normalizedTotal,
  ]);
  const requiresCardPayment = amountCents > 0;

  const invalidatePromoCode = (message) => {
    setPromoCodeIsValid?.(false);
    setPromoCodeData?.(null);
    setPromoCodeError?.(message);
  };

  const validatePromoCodeAgainstBasket = (nextPromoData) => {
    const eligibleSubtotal = calculatePromoEligibleSubtotalForBasket({
      basketItems,
      subTotal: basketSubtotal,
      promoCode: nextPromoData,
    });

    if (
      (nextPromoData?.type === "amount" || nextPromoData?.type === "percent") &&
      eligibleSubtotal <= 0
    ) {
      return {
        isValid: false,
        message: "Ce code promo ne s'applique à aucun article de votre panier.",
        eligibleSubtotal,
        promoDiscountAmount: 0,
      };
    }

    if (
      nextPromoData?.type === "amount" &&
      toSafeNumber(nextPromoData?.amount, 0) > eligibleSubtotal
    ) {
      return {
        isValid: false,
        message:
          "Le montant du code promo ne peut pas être supérieur au total des articles éligibles.",
        eligibleSubtotal,
        promoDiscountAmount: 0,
      };
    }

    return {
      isValid: true,
      message: "",
      eligibleSubtotal,
      promoDiscountAmount: calculatePromoDiscountAmountForPromo(
        nextPromoData,
        eligibleSubtotal
      ),
    };
  };

  const revalidatePromoCodeBeforeCheckout = async () => {
    if (!promoCode) {
      return {
        status: true,
        promoCodeData: null,
      };
    }

    const response = await verifyPromoCode(String(promoCode?.code || "").trim(), user._id);

    if (!response?.status || !response?.data) {
      const nextMessage = response?.message || "Code promo invalide.";
      invalidatePromoCode(nextMessage);
      return {
        status: false,
        message: nextMessage,
      };
    }

    const validation = validatePromoCodeAgainstBasket(response.data);
    if (!validation.isValid) {
      invalidatePromoCode(validation.message);
      return {
        status: false,
        message: validation.message,
      };
    }

    const currentPromoId = String(promoCode?._id || "").trim();
    const nextPromoId = String(response.data?._id || "").trim();
    const currentEligibleSubtotal = roundMoney(
      calculatePromoEligibleSubtotalForBasket({
        basketItems,
        subTotal: basketSubtotal,
        promoCode,
      }),
      0
    );
    const nextEligibleSubtotal = roundMoney(validation.eligibleSubtotal, 0);
    const currentDiscountAmount = roundMoney(
      calculatePromoDiscountAmountForPromo(promoCode, currentEligibleSubtotal),
      0
    );
    const nextDiscountAmount = roundMoney(validation.promoDiscountAmount, 0);

    const hasPromoChanged =
      currentPromoId !== nextPromoId ||
      currentEligibleSubtotal !== nextEligibleSubtotal ||
      currentDiscountAmount !== nextDiscountAmount ||
      String(promoCode?.type || "") !== String(response.data?.type || "") ||
      roundMoney(promoCode?.amount, 0) !== roundMoney(response.data?.amount, 0) ||
      roundMoney(promoCode?.percent, 0) !==
        roundMoney(response.data?.percent, 0);

    setPromoCodeData?.(response.data);
    setPromoCodeIsValid?.(true);
    setPromoCodeError?.(null);

    if (hasPromoChanged) {
      return {
        status: false,
        message:
          "Le code promo a été mis à jour. Vérifiez le montant avant de poursuivre.",
      };
    }

    return {
      status: true,
      promoCodeData: response.data,
    };
  };

  const cloneOrderPayload = (payload) =>
    payload ? JSON.parse(JSON.stringify(payload)) : null;

  const buildOrderPayload = (paymentIntentId, options = {}) => {
    const isZeroTotalFlow = Boolean(options?.zeroTotalSubscriptionFlow);
    const resolvedPromoCodeData = options?.promoCodeDataOverride ?? promoCode;
    const resolvedSubTotalAfterDiscount = roundMoney(
      options?.subTotalAfterDiscountOverride,
      subTotalWithDiscount
    );
    const resolvedTotal = roundMoney(options?.totalOverride, total);
    const resolvedTip = roundMoney(options?.tipAmountOverride, tipAmount);

    const orderItems = [];
    const orderOffers = [];
    const orderRewards = [];

    basket.items.forEach((item) => {
      const customizations = item.customization
        ? item.customization.map((customizationItem) => customizationItem._id)
        : [];

      orderItems.push({
        size: item.size?.size || item.size,
        customizations,
        price: roundMoney(item.price, 0),
        basePrice: roundMoney(item.basePrice ?? item.price, 0),
        item: item.id,
        comment: item.comment,
        isSubscriptionFreeItem: Boolean(item.isSubscriptionFreeItem),
        isBirthdayFreeItem: Boolean(item.isBirthdayFreeItem),
      });
    });

    basket.offers.forEach((offer) => {
      const items = [];
      const offerCustomizationMap =
        offer.customization || offer.customizations || {};

      if (offerCustomizationMap) {
        Object.keys(offerCustomizationMap).forEach((itemId) => {
          offerCustomizationMap[itemId].forEach((customizationArray) => {
            const customizationIds = Array.isArray(customizationArray)
              ? customizationArray
                  .map((selection) =>
                    typeof selection === "string"
                      ? selection
                      : selection?._id || null
                  )
                  .filter(Boolean)
              : [];

            items.push({
              item: itemId,
              customizations: customizationIds,
            });
          });
        });
      }

      orderOffers.push({
        offer: offer.id,
        price: roundMoney(offer.price, 0),
        items,
      });
    });

    basket.rewards.forEach((item) => {
      orderRewards.push({ id: item._id, points: item.points });
    });

    const scheduledFor =
      isScheduledOrder &&
      scheduledDateTime &&
      !Number.isNaN(scheduledDateTime.getTime())
        ? scheduledDateTime.toISOString()
        : null;

    return {
      type: deliveryMode,
      address: address.address,
      coords: address.coords,
      restaurant: selectedRestaurant._id,
      order: {
        subTotal: roundMoney(basket.subtotal, 0),
        user_id: user._id,
        orderItems,
        offers: orderOffers,
        rewards: orderRewards,
        paymentMethod: isZeroTotalFlow ? "subscription_free_item" : "card",
        total: resolvedTotal,
        discount: orderDiscountPercent,
        subTotalAfterDiscount: resolvedSubTotalAfterDiscount,
        tip: resolvedTip,
        paymentIntentId: paymentIntentId || null,
        deliveryFee: roundMoney(effectiveDeliveryFee, 0),
        platform: "web",
        promoCode: resolvedPromoCodeData
          ? {
              code: resolvedPromoCodeData.code,
              promoCodeId: resolvedPromoCodeData._id,
            }
          : null,
        subscriptionBenefits,
        birthdayBenefits,
        zeroTotalSubscriptionFlow: isZeroTotalFlow,
        scheduled: {
          isScheduled: isScheduledOrder,
          scheduledFor,
        },
      },
    };
  };

  async function handleNewCardFlow() {
    try {
      if (!stripe || !elements) {
        setError("Stripe non initialisé.");
        return;
      }
      const card = elements.getElement(CardElement);
      if (!card) {
        setError("Erreur avec le formulaire de la carte.");
        return;
      }
      if (!cardComplete) {
        setError("Veuillez compléter les informations de la carte.");
        return;
      }

      if (!user?.email) {
        setError("Email requis.");
        return;
      }

      // 1) Create PaymentMethod on web (like Expo)
      const pmRes = await stripe.createPaymentMethod({
        type: "card",
        card,
        billing_details: { email: user.email.trim() },
      });
      if (pmRes.error || !pmRes.paymentMethod?.id) {
        setError(
          pmRes.error?.message ||
            "Erreur lors de la création du moyen de paiement."
        );
        return;
      }

      // 2) Ask server to create & confirm manual-capture PI
      return getPaymentIntentClientSecret(
        user._id,
        amountCents,
        user.email.trim(),
        pmRes.paymentMethod.id,
        false
      );
    } catch (e) {
      setError(e?.message || "Erreur lors de la création du paiement.");

      await catchError(user?._id || "", e?.message || "unknown", "CheckoutWeb");
    }
  }

  async function handleSavedCardFlow(pmId) {
    try {
      return getPaymentIntentClientSecret(
        user._id,
        amountCents,
        user.email.trim(),
        pmId,
        true
      );
    } catch (e) {
      setError(e?.message || "Erreur lors de la création du paiement.");

      await catchError(user?._id || "", e?.message || "unknown", "CheckoutWeb");
    }
  }

  async function processPi(pi) {
    if (!pi?.id) {
      setError("Erreur lors du traitement du paiement.");
      return;
    }

    // SCA/3DS
    if (pi.status === "requires_action" && pi.client_secret && stripe) {
      const result = await stripe.handleCardAction(pi.client_secret);
      if (result.error) {
        if (result.error.code === "payment_intent_authentication_failure") {
          setError("Échec de l'authentification 3D Secure.");
          return;
        }
        setError(
          result.error.message || "Erreur lors de l'authentification 3D Secure."
        );
        return;
      }

      const response = await confirmPaiment(result.paymentIntent.id);

      if (!response.status) {
        setError(
          response.message || "Erreur lors de la confirmation du paiement."
        );
        return;
      }
      const updated = response.data.data;
      if (
        updated?.status === "requires_capture" ||
        updated?.status === "processing" ||
        updated?.status === "succeeded"
      ) {
        handlePaymentReady(updated.id);
        return;
      }
      setError(`Statut paiement inattendu.`);
      return;
    }

    // No 3DS required → capturable later by backoffice
    if (
      pi.status === "requires_capture" ||
      pi.status === "processing" ||
      pi.status === "succeeded"
    ) {
      handlePaymentReady(pi.id);
      return;
    }

    setError(`Statut paiement inattendu`);
  }

  async function onPay() {
    if (paymentFlowLockRef.current || loading) return;
    paymentFlowLockRef.current = true;
    setLoading(true);
    setError(null);

    try {
      if (user?.isBanned) {
        setError(
          "Votre compte a été désactivé. Veuillez contacter le support."
        );
        return;
      }
      if (!selectedRestaurant) {
        setError("Veuillez sélectionner un restaurant.");
        return;
      }
      if (!requiresCardPayment) {
        if (!isZeroTotalSubscriptionOrder) {
          setError(
            "Une commande à total 0 est possible uniquement avec un article gratuit éligible (abonnement ou anniversaire)."
          );
          return;
        }
        await handlePaymentReady(null, { zeroTotalSubscriptionFlow: true });
        return;
      }

      if (!user?.email) {
        setError("Email requis.");
        return;
      }
      if (deliveryMode === "delivery") {
        if (
          !address?.address ||
          !address?.coords.latitude ||
          !address?.coords.longitude
        ) {
          setError("Veuillez sélectionner une adresse de livraison valide.");
          return;
        }
      }

      if (deliveryMode === "delivery") {
        if (
          !address?.address ||
          !address?.coords ||
          !address?.coords.latitude ||
          !address?.coords.longitude
        ) {
          setError("Veuillez sélectionner une adresse de livraison valide.");
          return;
        }

        const radius = selectedRestaurant?.settings?.delivery_range || 6;
        const distance = calculateDistance(
          address.coords,
          selectedRestaurant.location
        );

        if (distance > radius) {
          setError(`L'adresse est hors de la zone de livraison .`);
          return;
        }
      }

      if (isScheduledOrder) {
        if (!scheduledDateTime) {
          setError(
            "Veuillez sélectionner une date et une heure pour la commande programmée."
          );
          return;
        }
        const validationError = getScheduleValidationError(
          scheduledDateTime,
          selectedRestaurant
        );
        if (validationError) {
          setError(validationError);
          return;
        }
      }

      const availabilityResponse = await checkRestaurantOrderAvailability(
        selectedRestaurant._id,
        basketItems.map((item) => ({ item: item.id })),
        basketOffers.map((offer) => ({ offer: offer.id }))
      );

      if (!availabilityResponse?.status) {
        setError(
          availabilityResponse?.message ||
            "Impossible de vérifier la disponibilité des articles."
        );
        return;
      }

      if (availabilityResponse?.data?.isValid === false) {
        setError(buildOrderAvailabilityErrorMessage(availabilityResponse.data));
        return;
      }

      const promoRevalidation = await revalidatePromoCodeBeforeCheckout();
      if (!promoRevalidation?.status) {
        setError(
          promoRevalidation?.message ||
            "Le code promo doit être revérifié avant le paiement."
        );
        return;
      }

      const draftOrderPayload = buildOrderPayload(null, {
        zeroTotalSubscriptionFlow: false,
        promoCodeDataOverride: promoRevalidation?.promoCodeData ?? promoCode,
      });

      if (!stripe || !elements) {
        if (!isZeroTotalSubscriptionOrder) {
          setError("Stripe non initialisé.");
          return;
        }
      }

      let pi;
      checkoutAttemptRef.current = {
        zeroTotalSubscriptionFlow: isZeroTotalSubscriptionOrder,
        orderPayload: cloneOrderPayload(draftOrderPayload),
      };

      if (isZeroTotalSubscriptionOrder) {
        await handlePaymentReady(null, { zeroTotalSubscriptionFlow: true });
        return;
      }

      if (selectedPmId) {
        const response = await handleSavedCardFlow(selectedPmId);

        if (!response.status) {
          setError(response.message);
          return;
        }
        pi = response.data;
      } else if (showCardField) {
        const response = await handleNewCardFlow();
        if (!response.status) {
          setError(response.message);
          return;
        }
        pi = response.data;
      } else {
        setError("Aucun moyen de paiement sélectionné.");
        return;
      }

      await processPi(pi);
    } catch (e) {
      setError(e?.message || "Erreur lors du traitement du paiement.");
      await catchError(user?._id || "", e?.message || "unknown", "CheckoutWeb");
    } finally {
      paymentFlowLockRef.current = false;
      setLoading(false);
    }
  }

  const handlePaymentReady = async (pi, options = {}) => {
    try {
      const isZeroTotalFlow = Boolean(
        options?.zeroTotalSubscriptionFlow ||
          checkoutAttemptRef.current?.zeroTotalSubscriptionFlow
      );
      const order =
        cloneOrderPayload(checkoutAttemptRef.current?.orderPayload) ||
        buildOrderPayload(pi, {
          zeroTotalSubscriptionFlow: isZeroTotalFlow,
        });

      if (order?.order) {
        order.order.paymentIntentId = pi || null;
      }

      const response = isZeroTotalFlow
        ? await createZeroTotalSubscriptionOrder(order)
        : await createOrder(order);
      if (!response?.status || !response.data) {
        if (pi && !isZeroTotalFlow) {
          await cancelPaymentIntent(pi);
        }
        checkoutAttemptRef.current = null;
        setError(
          response?.message ||
            "Erreur lors de la création de la commande."
        );
        return;
      } else {
        checkoutAttemptRef.current = null;
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            "checkout_success_redirect_at",
            String(Date.now())
          );
        }
        clearBasket();
        router.replace("/success?id=" + response.data.orderId);
      }
    } catch (error) {
      if (pi && !options?.zeroTotalSubscriptionFlow) {
        await cancelPaymentIntent(pi);
      }
      checkoutAttemptRef.current = null;
      console.error("Erreur dans handlePaymentReady :", error);
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Erreur lors de la création de la commande."
      );
    } finally {
      setLoading(false);
    }
  };

  if (cardsLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-md w-full space-y-4">
      {!requiresCardPayment && (
        <div className="text-sm text-gray-600 font-inter">
          Aucun paiement requis pour cette commande.
        </div>
      )}
      {/* Saved cards */}
      {requiresCardPayment && cards?.length > 0 && (
        <div className="space-y-2 mt-4">
          <div className="font-semibold">Cartes enregistrées</div>
          {cards.map((pm) => (
            <button
              type="button"
              key={pm.id}
              onClick={() => {
                setSelectedPmId(pm.id);
                setShowCardField(false);
              }}
              className={`w-full border rounded p-2 text-left flex items-center ${
                selectedPmId === pm.id ? "ring-2 ring-pr" : ""
              }`}
            >
              {brandIcon(pm.card?.brand)}
              <p className="font-inter font-semibold ml-2">
                **** **** **** {pm.card.last4}
              </p>
            </button>
          ))}
          {!showCardField && (
            <button
              type="button"
              className="w-full border-dashed border rounded p-3"
              onClick={() => {
                setShowCardField(true);
                setSelectedPmId(null);
              }}
            >
              + Utiliser une nouvelle carte
            </button>
          )}
        </div>
      )}

      {/* New card */}
      {requiresCardPayment && showCardField && (
        <div className="space-y-2">
          <div className="font-semibold">Nouvelle carte</div>
          <div className="border rounded p-3">
            <CardElement
              options={{ hidePostalCode: true }}
              onChange={(e) => setCardComplete(!!e.complete)}
            />
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between">
        <span>Total</span>
        <span className="font-bold">${Number(total || 0).toFixed(2)}</span>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <button
        type="button"
        onClick={onPay}
        disabled={
          loading ||
          (requiresCardPayment &&
            !!showCardField &&
            !cardComplete &&
            !selectedPmId) ||
          !canOrder ||
          !isAddressValid ||
          user.isBanned ||
          (requiresCardPayment && (!stripe || !elements || !total || total <= 0))
        }
        className={`w-full rounded-md bg-pr font-bebas-neue text-xl py-3 font-bold disabled:bg-gray-400 disabled:cursor-not-allowed`}
      >
        {loading ? "Traitement..." : requiresCardPayment ? "Payer" : "Confirmer"}
      </button>
      {!isAddressValid && deliveryMode === "delivery" && (
        <div className="text-red-600 text-sm">
          Adresse de livraison invalide ou incomplète. Veuillez la mettre à
          jour.
        </div>
      )}
    </div>
  );
}
