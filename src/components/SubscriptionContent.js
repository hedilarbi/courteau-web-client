"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { getToken } from "@/app/actions";
import { useUser } from "@/context/UserContext";
import {
  confirmPaiment,
  getPaymentMethods,
  getUserByToken,
} from "@/services/UserServices";
import {
  cancelUserSubscription,
  confirmUserSubscriptionPayment,
  createUserSubscription,
  getSubscriptionConfig,
  refreshUserSubscription,
  setUserSubscriptionAutoRenew,
} from "@/services/SubscriptionServices";

const SUBSCRIPTION_DISCOUNT_PERCENT = 15;
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

const formatDate = (rawDate) => {
  if (!rawDate) return "-";
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const normalizeStatus = (status) =>
  String(status || "")
    .toLowerCase()
    .trim();

const isSummarySubscriptionActive = (summary) => {
  const status = normalizeStatus(summary?.status);
  const statusActive = status === "active" || status === "trialing";
  const periodEnd = summary?.currentPeriodEnd
    ? new Date(summary.currentPeriodEnd)
    : null;
  const hasValidPeriodEnd =
    periodEnd instanceof Date && !Number.isNaN(periodEnd.getTime());
  const notExpired = !hasValidPeriodEnd || periodEnd.getTime() > Date.now();

  return Boolean(summary?.isActive) || (statusActive && notExpired);
};

const normalizePaymentIntentStatus = (status) =>
  String(status || "")
    .toLowerCase()
    .trim();

const toLowerString = (value) =>
  String(value || "")
    .toLowerCase()
    .trim();

const resolvePaymentMessageFromText = (
  message,
  fallback = "Le paiement a échoué. Veuillez réessayer."
) => {
  const rawMessage = String(message || "").trim();
  if (!rawMessage) return fallback;

  const loweredMessage = rawMessage.toLowerCase();

  if (
    loweredMessage.includes(
      "paymentintent supplied does not require manual server-side confirmation"
    )
  ) {
    return "Le paiement n'a pas pu être confirmé. Veuillez réessayer.";
  }
  if (
    loweredMessage.includes("authentification") ||
    loweredMessage.includes("authentication") ||
    loweredMessage.includes("3d secure") ||
    loweredMessage.includes("3ds")
  ) {
    return "Échec de l'authentification 3D Secure.";
  }
  if (loweredMessage.includes("insufficient funds")) {
    return "Fonds insuffisants sur la carte.";
  }
  if (
    loweredMessage.includes("card was declined") ||
    loweredMessage.includes("payment was declined") ||
    loweredMessage.includes("declined")
  ) {
    return "Le paiement a été refusé par la banque.";
  }
  if (
    loweredMessage.includes("card has expired") ||
    loweredMessage.includes("expired card")
  ) {
    return "Cette carte est expirée.";
  }
  if (
    loweredMessage.includes("security code is incorrect") ||
    loweredMessage.includes("incorrect cvc") ||
    loweredMessage.includes("invalid cvc")
  ) {
    return "Le code de sécurité (CVC) est invalide.";
  }
  if (
    loweredMessage.includes("card number is incorrect") ||
    loweredMessage.includes("incorrect number")
  ) {
    return "Le numéro de carte est invalide.";
  }
  if (
    loweredMessage.includes("network error") ||
    loweredMessage.includes("timed out") ||
    loweredMessage.includes("timeout")
  ) {
    return "Erreur réseau. Vérifiez votre connexion puis réessayez.";
  }
  if (loweredMessage.includes("api key")) {
    return "Configuration de paiement invalide. Veuillez réessayer plus tard.";
  }

  return rawMessage;
};

const resolveStripePaymentErrorMessage = (
  error,
  fallback = "Le paiement a échoué. Veuillez réessayer."
) => {
  if (!error) return fallback;

  const code = toLowerString(error?.code);
  const declineCode = toLowerString(error?.decline_code || error?.declineCode);

  if (code === "canceled" || code === "cancelled") {
    return "Authentification annulée.";
  }
  if (code === "failed" || code === "payment_intent_authentication_failure") {
    return "Nous n'avons pas pu vérifier votre carte.";
  }
  if (
    code === "incomplete_number" ||
    code === "incomplete_expiry" ||
    code === "incomplete_cvc"
  ) {
    return "Veuillez compléter correctement les informations de votre carte.";
  }
  if (code === "invalid_expiry_month" || code === "invalid_expiry_year") {
    return "La date d'expiration de la carte est invalide.";
  }
  if (
    code === "incorrect_number" ||
    declineCode === "incorrect_number" ||
    code === "invalid_number"
  ) {
    return "Le numéro de carte est invalide.";
  }
  if (code === "incorrect_cvc" || declineCode === "incorrect_cvc") {
    return "Le code de sécurité (CVC) est invalide.";
  }
  if (code === "expired_card" || declineCode === "expired_card") {
    return "Cette carte est expirée.";
  }
  if (code === "insufficient_funds" || declineCode === "insufficient_funds") {
    return "Fonds insuffisants sur la carte.";
  }
  if (
    code === "card_declined" ||
    code === "carddeclined" ||
    declineCode === "card_declined"
  ) {
    return "Le paiement a été refusé par la banque.";
  }
  if (code === "processing_error") {
    return "Erreur de traitement du paiement. Veuillez réessayer.";
  }

  return resolvePaymentMessageFromText(error?.message, fallback);
};

const SubscriptionContentInner = ({ mode = "offer" }) => {
  const isOfferMode = mode === "offer";
  const stripe = useStripe();
  const elements = useElements();
  const { user, loading, updateUser } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [config, setConfig] = useState(null);
  const [summary, setSummary] = useState(null);
  const [cards, setCards] = useState([]);
  const [selectedPmId, setSelectedPmId] = useState(null);
  const [showCardField, setShowCardField] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);
  const [showActivationForm, setShowActivationForm] = useState(false);

  const isSubscriptionActive = isSummarySubscriptionActive(summary);
  const autoRenewEnabled =
    typeof summary?.autoRenew === "boolean" ? summary.autoRenew : autoRenew;
  const shouldShowInlineSubscribeError =
    !isSubscriptionActive && showActivationForm && Boolean(errorMessage);

  const freeItemRemaining = Math.max(0, Number(summary?.freeItemRemaining ?? 0));
  const freeItemAvailabilityLabel = freeItemRemaining > 0 ? "Disponible" : "Utilisé";
  const savingsTotal = Number(summary?.savingsTotal || 0);

  const priceLabel = useMemo(() => {
    const price = Number(config?.monthlyPrice ?? 11.99);
    return `${price.toFixed(2)}$ / mois`;
  }, [config]);

  const refreshUserFromToken = async () => {
    const token = await getToken();
    if (!token?.value) return null;
    const response = await getUserByToken(token.value);
    if (response?.status && response?.data) {
      updateUser(response.data);
      return response.data;
    }
    return null;
  };

  const loadScreenData = async () => {
    if (!user?._id) {
      setSummary(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const [configResponse, subscriptionResponse] = await Promise.all([
        getSubscriptionConfig(),
        refreshUserSubscription(user._id),
      ]);

      if (configResponse.status) {
        setConfig(configResponse.data);
      }

      if (subscriptionResponse.status) {
        setSummary(subscriptionResponse.data);
        setAutoRenew(Boolean(subscriptionResponse.data?.autoRenew));
      } else {
        setSummary(null);
      }

      let stripeCustomerId = user?.stripe_id || "";
      if (!stripeCustomerId) {
        const latestUser = await refreshUserFromToken();
        stripeCustomerId = latestUser?.stripe_id || "";
      }

      if (stripeCustomerId) {
        const cardsResponse = await getPaymentMethods(stripeCustomerId);
        if (cardsResponse.status) {
          const nextCards = cardsResponse.data || [];
          setCards(nextCards);
          if (nextCards.length > 0) {
            setSelectedPmId((prev) => prev || nextCards[0]?.id || null);
            setShowCardField(false);
          } else {
            setShowCardField(true);
          }
        } else {
          setShowCardField(true);
        }
      } else {
        setCards([]);
        setShowCardField(true);
      }
    } catch (error) {
      setErrorMessage(error?.message || "Erreur lors du chargement.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      loadScreenData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?._id]);

  useEffect(() => {
    if (isSubscriptionActive) {
      setShowActivationForm(false);
    }
  }, [isSubscriptionActive]);

  const runThreeDSAuthentication = async (clientSecret) => {
    if (!stripe || !clientSecret) {
      return {
        ok: false,
        message: "Authentification 3DS impossible.",
        paymentIntentId: null,
      };
    }

    // Subscriptions created with `payment_behavior=default_incomplete` are
    // generally confirmed client-side via confirmCardPayment (automatic flow).
    const confirmResult = await stripe.confirmCardPayment(clientSecret);
    if (!confirmResult.error) {
      const paymentIntentId = confirmResult.paymentIntent?.id || null;
      if (paymentIntentId) {
        await confirmPaiment(paymentIntentId);
      }

      return {
        ok: true,
        paymentIntentId,
        paymentIntentStatus: normalizePaymentIntentStatus(
          confirmResult.paymentIntent?.status
        ),
      };
    }

    const errorMessage = String(confirmResult.error?.message || "");
    const shouldFallbackToHandleCardAction =
      errorMessage.toLowerCase().includes("manual confirmation") ||
      confirmResult.error?.code === "payment_intent_unexpected_state";

    if (!shouldFallbackToHandleCardAction) {
      return {
        ok: false,
        message: resolveStripePaymentErrorMessage(
          confirmResult.error,
          "Authentification 3DS échouée."
        ),
        paymentIntentId:
          confirmResult.paymentIntent?.id ||
          confirmResult.error?.payment_intent?.id ||
          null,
      };
    }

    // Safety fallback for manual confirmation intents.
    const actionResult = await stripe.handleCardAction(clientSecret);
    if (actionResult.error) {
      return {
        ok: false,
        message: resolveStripePaymentErrorMessage(
          actionResult.error,
          "Authentification 3DS échouée."
        ),
        paymentIntentId:
          actionResult.paymentIntent?.id ||
          actionResult.error?.payment_intent?.id ||
          null,
      };
    }

    const paymentIntentId = actionResult.paymentIntent?.id || null;
    if (paymentIntentId) {
      await confirmPaiment(paymentIntentId);
    }

    return {
      ok: true,
      paymentIntentId,
      paymentIntentStatus: normalizePaymentIntentStatus(
        actionResult.paymentIntent?.status
      ),
    };
  };

  const handleSubscribe = async () => {
    if (!user?._id) return;

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      let paymentMethodId = selectedPmId;

      if (!paymentMethodId) {
        if (!stripe || !elements) {
          setErrorMessage("Stripe n'est pas prêt.");
          return;
        }

        if (!cardComplete) {
          setErrorMessage("Veuillez compléter les informations de la carte.");
          return;
        }

        const card = elements.getElement(CardElement);
        if (!card) {
          setErrorMessage("Impossible de lire le formulaire de carte.");
          return;
        }

        const pmResult = await stripe.createPaymentMethod({
          type: "card",
          card,
          billing_details: {
            email: String(user?.email || "").trim() || undefined,
          },
        });

        if (pmResult.error || !pmResult.paymentMethod?.id) {
          setErrorMessage(
            resolveStripePaymentErrorMessage(
              pmResult.error,
              "Impossible de créer la méthode de paiement."
            )
          );
          return;
        }

        paymentMethodId = pmResult.paymentMethod.id;
      }

      const createResponse = await createUserSubscription(
        user._id,
        paymentMethodId,
        autoRenew
      );
      if (!createResponse.status) {
        setErrorMessage(
          resolvePaymentMessageFromText(
            createResponse.message,
            "Paiement non confirmé."
          )
        );
        return;
      }

      const stripePayload = createResponse.data?.stripe || {};
      const subscriptionSummary = createResponse.data?.subscription || null;
      const stripeSubscriptionId =
        stripePayload.subscriptionId ||
        subscriptionSummary?.stripeSubscriptionId ||
        user?.subscriptionStripeSubscriptionId ||
        null;

      if (!stripeSubscriptionId) {
        setErrorMessage("Impossible de confirmer l'abonnement Stripe.");
        return;
      }

      let paymentIntentId = stripePayload.paymentIntentId || null;
      let paymentIntentStatus = normalizePaymentIntentStatus(
        stripePayload.paymentIntentStatus
      );

      if (!paymentIntentStatus && stripePayload.requiresAction) {
        paymentIntentStatus = "requires_action";
      }

      if (paymentIntentStatus === "requires_action" && stripePayload.clientSecret) {
        const threeDSResult = await runThreeDSAuthentication(
          stripePayload.clientSecret
        );
        if (!threeDSResult.ok) {
          const failedPaymentIntentId =
            threeDSResult.paymentIntentId || paymentIntentId || null;
          await confirmUserSubscriptionPayment(
            user._id,
            stripeSubscriptionId,
            failedPaymentIntentId,
            true
          );
          await loadScreenData();
          setErrorMessage(threeDSResult.message);
          return;
        }
        paymentIntentId = threeDSResult.paymentIntentId || paymentIntentId;
      }

      let confirmResponse = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        confirmResponse = await confirmUserSubscriptionPayment(
          user._id,
          stripeSubscriptionId,
          paymentIntentId
        );

        if (confirmResponse.status) {
          break;
        }

        const confirmData = confirmResponse?.data || {};
        const nextClientSecret = confirmData?.clientSecret || null;
        const nextStatus = normalizePaymentIntentStatus(
          confirmData?.paymentIntentStatus
        );
        const needs3DS =
          Boolean(nextClientSecret) &&
          (nextStatus === "requires_action" || !nextStatus);

        if (!needs3DS) {
          break;
        }

        const threeDSResult = await runThreeDSAuthentication(nextClientSecret);
        if (!threeDSResult.ok) {
          const failedPaymentIntentId =
            threeDSResult.paymentIntentId ||
            confirmData?.paymentIntentId ||
            paymentIntentId ||
            null;
          await confirmUserSubscriptionPayment(
            user._id,
            stripeSubscriptionId,
            failedPaymentIntentId,
            true
          );
          await loadScreenData();
          setErrorMessage(threeDSResult.message);
          return;
        }
        paymentIntentId =
          threeDSResult.paymentIntentId ||
          confirmData?.paymentIntentId ||
          paymentIntentId;
      }

      if (!confirmResponse?.status) {
        setErrorMessage(
          resolvePaymentMessageFromText(
            confirmResponse?.message,
            "Paiement non confirmé."
          )
        );
        return;
      }

      const confirmedSummary =
        confirmResponse.data?.subscription || confirmResponse.data || null;
      const isActiveAfterConfirm = isSummarySubscriptionActive(confirmedSummary);
      if (!isActiveAfterConfirm) {
        setErrorMessage(
          "Le paiement de l'abonnement n'est pas finalisé. Vérifiez votre carte et réessayez."
        );
        await loadScreenData();
        return;
      }

      setSuccessMessage("Félicitations, vous êtes maintenant abonné à CLUB COURTEAU.");
      await refreshUserFromToken();
      await loadScreenData();
    } catch (error) {
      setErrorMessage(
        resolvePaymentMessageFromText(
          error?.message,
          "Erreur lors de l'activation."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoRenewChange = async (nextValue) => {
    setAutoRenew(nextValue);
    if (!isSubscriptionActive) return;

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const response = await setUserSubscriptionAutoRenew(user._id, nextValue);
      if (!response.status) {
        setErrorMessage(response.message);
        setAutoRenew(!nextValue);
        return;
      }

      setSummary(response.data);
      setAutoRenew(Boolean(response.data?.autoRenew));
      setSuccessMessage("Renouvellement automatique mis à jour.");
      await refreshUserFromToken();
    } catch (error) {
      setAutoRenew(!nextValue);
      setErrorMessage(error?.message || "Erreur lors de la mise à jour.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!isSubscriptionActive || !user?._id) return;

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const response = await cancelUserSubscription(user._id, false);
      if (!response.status) {
        setErrorMessage(response.message);
        return;
      }

      setSummary(response.data);
      setAutoRenew(Boolean(response.data?.autoRenew));
      setSuccessMessage(
        "L'abonnement sera annulé à la fin de la période en cours."
      );
      await refreshUserFromToken();
    } catch (error) {
      setErrorMessage(error?.message || "Erreur lors de l'annulation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="md:mt-28 mt-20 bg-[#F3F4F6] md:px-14 px-4 pt-8 pb-20 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <p className="font-inter text-gray-700">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="md:mt-28 mt-20 bg-[#F3F4F6] md:px-14 px-4 pt-8 pb-20 min-h-screen">
        <div className="max-w-3xl mx-auto bg-white rounded-xl p-6 shadow-md">
          <p className="font-inter font-semibold text-black">
            {isOfferMode
              ? "Connectez-vous pour activer CLUB COURTEAU."
              : "Connectez-vous pour gérer votre abonnement."}
          </p>
          <Link
            href="/connexion"
            className="inline-block mt-4 bg-pr text-black font-bebas-neue text-xl px-5 py-2 rounded-md"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="md:mt-28 mt-20 bg-[#F3F4F6] md:px-14 px-4 pt-8 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-xl border border-[#0F172A] bg-[#111827] p-6 shadow-md">
          <h1 className="font-bebas-neue text-4xl text-white">CLUB COURTEAU</h1>
          <p className="font-inter font-semibold text-pr text-2xl mt-2">
            {priceLabel}
          </p>
          <ul className="mt-4 text-white/90 font-inter text-sm space-y-2">
            <li>• -{SUBSCRIPTION_DISCOUNT_PERCENT}% sur toutes les commandes</li>
            <li>• 0 frais de livraison</li>
            <li>• 1 article gratuit par mois</li>
          </ul>
          {isOfferMode && (
            <p className="text-white/70 font-inter text-xs mt-3">
              Offre mensuelle. Résiliable selon votre option de renouvellement.
            </p>
          )}
        </div>

        {!isOfferMode && (
          <div className="bg-white rounded-xl p-5 shadow-md mt-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-inter font-semibold text-black text-lg">
                Mon abonnement
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  isSubscriptionActive
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {isSubscriptionActive ? "Actif" : "Inactif"}
              </span>
            </div>
            <div className="mt-3 text-sm font-inter text-gray-700 space-y-1">
              <p>
                Prix mensuel: <span className="font-semibold">{priceLabel}</span>
              </p>
              <p>
                Date d&apos;échéance:{" "}
                <span className="font-semibold">
                  {formatDate(summary?.currentPeriodEnd)}
                </span>
              </p>
              <p>
                Renouvellement auto:{" "}
                <span className="font-semibold">
                  {autoRenewEnabled ? "Oui" : "Non"}
                </span>
              </p>
              <p>
                Économies cumulées:{" "}
                <span className="font-semibold">{savingsTotal.toFixed(2)}$</span>
              </p>
              <p>
                Article gratuit:{" "}
                <span className="font-semibold">{freeItemAvailabilityLabel}</span>
              </p>
            </div>
          </div>
        )}

        {!isSubscriptionActive && (
          <div className="bg-white rounded-xl p-5 shadow-md mt-4">
            <button
              type="button"
              className="bg-pr text-black font-bebas-neue text-xl px-4 py-3 rounded-md w-full cursor-pointer"
              onClick={() => setShowActivationForm((prev) => !prev)}
            >
              {showActivationForm ? "Masquer le paiement" : "Activer mon abonnement"}
            </button>

            {showActivationForm && (
              <>
                <div className="mt-4 flex items-center justify-between">
                  <p className="font-inter font-semibold text-sm">
                    Renouvellement automatique
                  </p>
                  <button
                    type="button"
                    className={`relative h-7 w-14 rounded-full transition ${
                      autoRenew ? "bg-pr" : "bg-gray-300"
                    }`}
                    onClick={() => setAutoRenew((prev) => !prev)}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                        autoRenew ? "left-8" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                {cards?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="font-inter font-semibold text-sm">Cartes enregistrées</p>
                    {cards.map((card) => (
                      <button
                        type="button"
                        key={card.id}
                        onClick={() => {
                          setSelectedPmId(card.id);
                          setShowCardField(false);
                        }}
                        className={`w-full border rounded-md p-3 text-left flex items-center justify-between ${
                          selectedPmId === card.id
                            ? "border-pr ring-1 ring-pr"
                            : "border-gray-300"
                        }`}
                      >
                        <span className="font-inter text-sm">
                          **** **** **** {card?.card?.last4}
                        </span>
                        <span className="text-xs text-gray-500 font-inter">
                          {card?.card?.exp_month}/{card?.card?.exp_year}
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      className="w-full border border-dashed border-gray-300 rounded-md p-3 text-sm font-inter"
                      onClick={() => {
                        setShowCardField(true);
                        setSelectedPmId(null);
                      }}
                    >
                      + Utiliser une nouvelle carte
                    </button>
                  </div>
                )}

                {(showCardField || cards.length === 0) && (
                  <div className="mt-4">
                    <p className="font-inter font-semibold text-sm mb-2">
                      Nouvelle carte
                    </p>
                    <div className="border rounded-md p-3">
                      <CardElement
                        options={{ hidePostalCode: true }}
                        onChange={(event) => setCardComplete(Boolean(event.complete))}
                      />
                    </div>
                  </div>
                )}

                {shouldShowInlineSubscribeError ? (
                  <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 mt-4">
                    <p className="text-red-700 text-sm font-inter">
                      {errorMessage}
                    </p>
                  </div>
                ) : null}

                <button
                  type="button"
                  className="bg-pr text-black font-bebas-neue text-xl px-4 py-3 rounded-md w-full cursor-pointer mt-4 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                  onClick={handleSubscribe}
                >
                  {isSubmitting ? "Traitement..." : "S'abonner maintenant"}
                </button>
              </>
            )}
          </div>
        )}

        {isSubscriptionActive && !isOfferMode && (
          <div className="bg-white rounded-xl p-5 shadow-md mt-4">
            <div className="flex items-center justify-between">
              <p className="font-inter font-semibold text-sm">
                Renouvellement automatique
              </p>
              <button
                type="button"
                className={`relative h-7 w-14 rounded-full transition ${
                  autoRenewEnabled ? "bg-pr" : "bg-gray-300"
                }`}
                onClick={() => handleAutoRenewChange(!autoRenewEnabled)}
                disabled={isSubmitting}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    autoRenewEnabled ? "left-8" : "left-1"
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              className="bg-black text-white font-bebas-neue text-xl px-4 py-3 rounded-md w-full cursor-pointer mt-4 disabled:bg-gray-300 disabled:cursor-not-allowed"
              disabled={isSubmitting}
              onClick={handleCancelSubscription}
            >
              Désactiver mon abonnement
            </button>
          </div>
        )}

        {isSubscriptionActive && isOfferMode && (
          <div className="bg-white rounded-xl p-5 shadow-md mt-4">
            <p className="font-inter font-semibold text-black text-sm">
              Votre abonnement est déjà actif.
            </p>
            <p className="font-inter text-gray-600 text-sm mt-2">
              Pour gérer le renouvellement et vos détails, ouvrez Mes abonnements
              depuis votre profil.
            </p>
            <Link
              href="/profil/mes-abonnements"
              className="inline-block mt-4 bg-pr text-black font-bebas-neue text-xl px-5 py-2 rounded-md"
            >
              Ouvrir mes abonnements
            </Link>
          </div>
        )}

        {!shouldShowInlineSubscribeError && errorMessage ? (
          <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 mt-4">
            <p className="text-red-700 text-sm font-inter">{errorMessage}</p>
          </div>
        ) : null}

        {successMessage ? (
          <div className="bg-green-50 border border-green-200 rounded-md px-4 py-3 mt-4">
            <p className="text-green-700 text-sm font-inter">{successMessage}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const SubscriptionContent = ({ mode = "offer" }) => {
  return (
    <Elements stripe={stripePromise}>
      <SubscriptionContentInner mode={mode} />
    </Elements>
  );
};

export default SubscriptionContent;
