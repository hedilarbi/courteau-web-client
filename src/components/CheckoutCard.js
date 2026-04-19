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

import { calculateDistance, hasValidCoords } from "@/utils/locationHandlers";
import { getScheduleValidationError } from "@/utils/dateHandlers";
import {
  calculatePromoDiscountAmountForPromo,
  calculatePromoEligibleSubtotalForBasket,
  roundMoney,
  toSafeNumber,
} from "@/utils/promoCodeHelpers";
import {
  useBasket,
  useSelectBasket,
  useSelectBasketItems,
  useSelectBasketOffers,
} from "@/context/BasketContext";
import { useRouter } from "next/navigation";
import Spinner from "./spinner/Spinner";
import Image from "next/image";

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
        .join(", ")}`,
    );
  }

  if (unavailableOffers.length > 0) {
    parts.push(
      `Offres indisponibles: ${unavailableOffers
        .map((offer) => offer?.name)
        .filter(Boolean)
        .join(", ")}`,
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
  paymentMethod = "card",
  setPaymentMethod,
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
    [basket?.subtotal],
  );
  const normalizedTotal = useMemo(
    () => Math.round(Number(total || 0) * 100) / 100,
    [total],
  );
  const hasPositiveTotal = normalizedTotal > 0;
  const showPickupCounterPaymentOption =
    deliveryMode === "pickup" && hasPositiveTotal;
  const isAddressValid =
    deliveryMode !== "delivery" ||
    !!String(address?.address || "").trim();

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

  const amountCents = useMemo(
    () => Math.round(normalizedTotal * 100),
    [normalizedTotal],
  );
  const requiresCardPayment = amountCents > 0 && paymentMethod === "card";

  const invalidatePromoCode = (message) => {
    setPromoCodeIsValid?.(false);
    setPromoCodeData?.(null);
    setPromoCodeError?.(message);
  };

  const validatePromoCodeAgainstBasket = (nextPromoData) => {
    const eligibleSubtotal = calculatePromoEligibleSubtotalForBasket({
      basketItems,
      basketOffers,
      subTotal: basketSubtotal,
      promoCode: nextPromoData,
    });

    if (
      (nextPromoData?.type === "amount" || nextPromoData?.type === "percent") &&
      eligibleSubtotal <= 0
    ) {
      return {
        isValid: false,
        message:
          "Ce code promo ne s'applique à aucun article ou offre de votre panier.",
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
        eligibleSubtotal,
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

    const response = await verifyPromoCode(
      String(promoCode?.code || "").trim(),
      user._id,
    );

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
        basketOffers,
        subTotal: basketSubtotal,
        promoCode,
      }),
      0,
    );
    const nextEligibleSubtotal = roundMoney(validation.eligibleSubtotal, 0);
    const currentDiscountAmount = roundMoney(
      calculatePromoDiscountAmountForPromo(promoCode, currentEligibleSubtotal),
      0,
    );
    const nextDiscountAmount = roundMoney(validation.promoDiscountAmount, 0);

    const hasPromoChanged =
      currentPromoId !== nextPromoId ||
      currentEligibleSubtotal !== nextEligibleSubtotal ||
      currentDiscountAmount !== nextDiscountAmount ||
      String(promoCode?.type || "") !== String(response.data?.type || "") ||
      roundMoney(promoCode?.amount, 0) !==
        roundMoney(response.data?.amount, 0) ||
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

  const buildDetailedAddressPayload = () => ({
    street_address:
      address?.street_address ||
      address?.detailedAddress?.street_address ||
      address?.detailed_address?.street_address ||
      "",
    city:
      address?.city ||
      address?.detailedAddress?.city ||
      address?.detailed_address?.city ||
      "",
    state:
      address?.state ||
      address?.detailedAddress?.state ||
      address?.detailed_address?.state ||
      "",
    postal_code:
      address?.postal_code ||
      address?.postalCode ||
      address?.zipCode ||
      address?.detailedAddress?.postal_code ||
      address?.detailed_address?.postal_code ||
      "",
    country:
      address?.country ||
      address?.detailedAddress?.country ||
      address?.detailed_address?.country ||
      "",
  });

  const buildOrderPayload = (paymentIntentId, options = {}) => {
    const isZeroTotalFlow = Boolean(options?.zeroTotalSubscriptionFlow);
    const resolvedPromoCodeData = options?.promoCodeDataOverride ?? promoCode;
    const resolvedSubTotalAfterDiscount = roundMoney(
      options?.subTotalAfterDiscountOverride,
      subTotalWithDiscount,
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
                      : selection?._id || null,
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
    const addressId = String(
      address?._id || address?.id || address?.addressId || "",
    ).trim();

    return {
      type: deliveryMode,
      address: address?.address || "",
      addressId: deliveryMode === "delivery" && addressId ? addressId : undefined,
      coords: hasValidCoords(address?.coords) ? address.coords : undefined,
      detailedAddress: buildDetailedAddressPayload(),
      restaurant: selectedRestaurant._id,
      order: {
        subTotal: roundMoney(basket.subtotal, 0),
        user_id: user._id,
        orderItems,
        offers: orderOffers,
        rewards: orderRewards,
        paymentMethod: isZeroTotalFlow
          ? "subscription_free_item"
          : paymentMethod === "cash_at_counter"
            ? "cash_at_counter"
            : "card",
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
            "Erreur lors de la création du moyen de paiement.",
        );
        return;
      }

      // 2) Ask server to create & confirm manual-capture PI
      return getPaymentIntentClientSecret(
        user._id,
        amountCents,
        user.email.trim(),
        pmRes.paymentMethod.id,
        false,
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
        true,
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
          result.error.message ||
            "Erreur lors de l'authentification 3D Secure.",
        );
        return;
      }

      const response = await confirmPaiment(result.paymentIntent.id);

      if (!response.status) {
        setError(
          response.message || "Erreur lors de la confirmation du paiement.",
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
          "Votre compte a été désactivé. Veuillez contacter le support.",
        );
        return;
      }
      if (!selectedRestaurant) {
        setError("Veuillez sélectionner un restaurant.");
        return;
      }
      if (!user?.email) {
        setError("Email requis.");
        return;
      }
      if (deliveryMode === "delivery") {
        if (!String(address?.address || "").trim()) {
          setError("Veuillez sélectionner une adresse de livraison valide.");
          return;
        }

        if (
          hasValidCoords(address?.coords) &&
          hasValidCoords(selectedRestaurant?.location)
        ) {
          const radius = selectedRestaurant?.settings?.delivery_range || 6;
          const distance = calculateDistance(
            address.coords,
            selectedRestaurant.location,
          );

          if (distance > radius) {
            setError(`L'adresse est hors de la zone de livraison .`);
            return;
          }
        }
      }

      if (isScheduledOrder) {
        if (!scheduledDateTime) {
          setError(
            "Veuillez sélectionner une date et une heure pour la commande programmée.",
          );
          return;
        }
        const validationError = getScheduleValidationError(
          scheduledDateTime,
          selectedRestaurant,
        );
        if (validationError) {
          setError(validationError);
          return;
        }
      }

      const availabilityResponse = await checkRestaurantOrderAvailability(
        selectedRestaurant._id,
        basketItems.map((item) => ({ item: item.id })),
        basketOffers.map((offer) => ({ offer: offer.id })),
      );

      if (!availabilityResponse?.status) {
        setError(
          availabilityResponse?.message ||
            "Impossible de vérifier la disponibilité des articles.",
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
            "Le code promo doit être revérifié avant le paiement.",
        );
        return;
      }

      if (!requiresCardPayment) {
        if (!hasPositiveTotal) {
          if (!isZeroTotalSubscriptionOrder) {
            setError(
              "Une commande à total 0 est possible uniquement avec un article gratuit éligible (abonnement ou anniversaire).",
            );
            return;
          }
          await handlePaymentReady(null, { zeroTotalSubscriptionFlow: true });
          return;
        }

        if (paymentMethod === "cash_at_counter") {
          checkoutAttemptRef.current = {
            zeroTotalSubscriptionFlow: false,
            orderPayload: cloneOrderPayload(
              buildOrderPayload(null, {
                zeroTotalSubscriptionFlow: false,
                promoCodeDataOverride:
                  promoRevalidation?.promoCodeData ?? promoCode,
              }),
            ),
          };
          await handlePaymentReady(null);
          return;
        }

        setError("Veuillez sélectionner un mode de paiement valide.");
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
        checkoutAttemptRef.current?.zeroTotalSubscriptionFlow,
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
          response?.message || "Erreur lors de la création de la commande.",
        );
        return;
      } else {
        checkoutAttemptRef.current = null;
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            "checkout_success_redirect_at",
            String(Date.now()),
          );
          window.sessionStorage.setItem("checkout_success_redirecting", "1");
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
          "Erreur lors de la création de la commande.",
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
      {!requiresCardPayment && !hasPositiveTotal && (
        <div className="text-sm text-gray-600 font-inter">
          Aucun paiement requis pour cette commande.
        </div>
      )}
      {hasPositiveTotal && (
        <div className="space-y-3 mt-4 rounded-2xl border border-[#E5E7EB] bg-[#FFF9EC] p-4 shadow-sm">
          <div>
            <div className="font-inter text-xs font-semibold uppercase tracking-[0.18em] text-[#B45309]">
              Mode de paiement
            </div>
            <div className="mt-1 font-inter text-lg font-semibold text-[#111827]">
              Choisissez comment régler cette commande
            </div>
            <p className="mt-1 font-inter text-sm text-[#6B7280]">
              {showPickupCounterPaymentOption
                ? "Pour une commande à ramasser, vous pouvez payer en ligne ou directement au comptoir."
                : "Le paiement en ligne est requis pour cette commande."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setPaymentMethod?.("card")}
            className={`w-full rounded-2xl border p-4 text-left transition ${
              paymentMethod === "card"
                ? "border-pr bg-white ring-2 ring-pr shadow-md"
                : "border-[#D1D5DB] bg-white hover:border-[#F59E0B]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="font-inter text-base font-semibold text-[#111827]">
                  Paiement en ligne
                </div>
              </div>
              <div
                className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  paymentMethod === "card"
                    ? "border-pr bg-pr"
                    : "border-[#D1D5DB] bg-white"
                }`}
              >
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    paymentMethod === "card" ? "bg-white" : "bg-transparent"
                  }`}
                />
              </div>
            </div>
          </button>

          {showPickupCounterPaymentOption && (
            <button
              type="button"
              onClick={() => setPaymentMethod?.("cash_at_counter")}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                paymentMethod === "cash_at_counter"
                  ? "border-pr bg-white ring-2 ring-pr shadow-md"
                  : "border-[#D1D5DB] bg-white hover:border-[#F59E0B]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-inter text-base font-semibold text-[#111827]">
                    Paiement au comptoir
                  </div>
                </div>
                <div
                  className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    paymentMethod === "cash_at_counter"
                      ? "border-pr bg-pr"
                      : "border-[#D1D5DB] bg-white"
                  }`}
                >
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      paymentMethod === "cash_at_counter"
                        ? "bg-white"
                        : "bg-transparent"
                    }`}
                  />
                </div>
              </div>
            </button>
          )}
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
          (requiresCardPayment &&
            (!stripe || !elements || !total || total <= 0))
        }
        className={`w-full rounded-md bg-pr font-bebas-neue text-xl py-3 font-bold disabled:bg-gray-400 disabled:cursor-not-allowed`}
      >
        {loading
          ? "Traitement..."
          : requiresCardPayment
            ? "Payer"
            : "Passer la commande"}
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
