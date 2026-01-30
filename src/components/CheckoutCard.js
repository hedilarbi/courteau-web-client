"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import {
  catchError,
  confirmPaiment,
  createOrder,
  getPaymentIntentClientSecret,
  getPaymentMethods,
} from "@/services/UserServices";

import { calculateDistance } from "@/utils/locationHandlers";
import { useBasket, useSelectBasket } from "@/context/BasketContext";
import { useRouter } from "next/navigation";
import Spinner from "./spinner/Spinner";
import Image from "next/image";

export default function CheckoutCard({
  user,
  total,

  selectedRestaurant,
  address,
  deliveryMode,
  tipAmount,
  promoCode,
  subTotalWithDiscount,
  canOrder,
}) {
  const { clearBasket } = useBasket();
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const basket = useSelectBasket();
  const [cardsLoading, setCardsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [selectedPmId, setSelectedPmId] = useState(null);
  const [showCardField, setShowCardField] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [error, setError] = useState(null);
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

  const amountCents = useMemo(
    () => Math.trunc(Number(total || 0) * 100),
    [total]
  );

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
    if (loading) return;
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
      if (!amountCents || amountCents <= 0)
        setError("Montant de paiement invalide.");
      if (!user?.email) setError("Email requis.");
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

      if (!stripe || !elements) {
        setError("Stripe non initialisé.");
        return;
      }

      let pi;
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
      setLoading(false);
    }
  }

  const handlePaymentReady = async (pi) => {
    try {
      const orderItems = [];
      const orderOffers = [];
      const orderRewards = [];

      basket.items.map((item) => {
        const customizations = item.customization
          ? item.customization.map((customizationItem) => customizationItem._id)
          : [];

        orderItems.push({
          size: item.size.size,
          customizations,
          price: item.price,
          item: item.id,
          comment: item.comment,
        });
      });

      basket.offers.forEach((offer) => {
        const items = [];

        // Check if the offer has customizations
        if (offer.customization) {
          // Iterate over the keys in the customization object (item IDs)
          Object.keys(offer.customization).forEach((itemId) => {
            // Iterate over each customization array for this item
            offer.customization[itemId].forEach((customizationArray) => {
              // Add each customization as a separate item object
              items.push({
                item: itemId,
                customizations: customizationArray,
              });
            });
          });
        }

        // Push the offer with the processed items into the orderOffers array
        orderOffers.push({
          offer: offer.id, // Offer ID
          price: offer.price, // Price of the offer
          items, // Processed items with customizations
        });
      });

      basket.rewards.map((item) =>
        orderRewards.push({ id: item._id, points: item.points })
      );

      const order = {
        type: deliveryMode,
        address: address.address,
        coords: address.coords,
        restaurant: selectedRestaurant._id,
        order: {
          subTotal: parseFloat(basket.subtotal).toFixed(2),
          user_id: user._id,
          orderItems,
          offers: orderOffers,
          rewards: orderRewards,
          paymentMethod: "card",
          total: total,
          discount: !user.firstOrderDiscountApplied ? 20 : 0,
          subTotalAfterDiscount: subTotalWithDiscount,
          tip: isNaN(parseFloat(tipAmount)) ? 0 : tipAmount,
          paymentIntentId: pi || null,

          deliveryFee:
            deliveryMode === "delivery"
              ? parseFloat(selectedRestaurant.settings.delivery_fee).toFixed(2)
              : 0,
          promoCode: promoCode
            ? {
                code: promoCode.code,
                promoCodeId: promoCode._id,
              }
            : null,
          scheduled: {
            isScheduled: false,
          },
        },
      };

      const response = await createOrder(order);
      if (response.error || !response.data) {
        setError(
          response.error?.message ||
            "Erreur lors de la création de la commande."
        );
        return;
      } else {
        clearBasket();
        router.replace("/success?id=" + response.data.orderId);
      }
    } catch (error) {
      console.error("Erreur dans handlePaymentReady :", error);
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
      {/* Saved cards */}
      {cards?.length > 0 && (
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
      {showCardField && (
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
          (!!showCardField && !cardComplete && !selectedPmId) ||
          !canOrder ||
          !isAddressValid ||
          user.isBanned ||
          !stripe ||
          !elements ||
          !total ||
          total <= 0
        }
        className={`w-full rounded-md bg-pr font-bebas-neue text-xl py-3 font-bold disabled:bg-gray-400 disabled:cursor-not-allowed`}
      >
        {loading ? "Traitement..." : "Payer"}
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
