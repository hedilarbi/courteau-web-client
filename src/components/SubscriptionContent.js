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
} from "@/services/SubscriptionServices";
import NoUserModal from "./NoUserModal";

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

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getSubscriptionPricing = (source) => {
  const subtotal = toSafeNumber(
    source?.pricing?.subtotal ?? source?.monthlyPrice,
    11.99
  );
  const tpsAmount = toSafeNumber(source?.pricing?.tpsAmount, subtotal * 0.05);
  const tvqAmount = toSafeNumber(source?.pricing?.tvqAmount, subtotal * 0.09975);
  const total = toSafeNumber(
    source?.pricing?.total,
    subtotal + tpsAmount + tvqAmount
  );

  return {
    subtotal,
    tpsAmount,
    tvqAmount,
    total,
  };
};

const getSubscriptionCycleLabel = (source) => {
  const interval = String(source?.recurring?.interval || "")
    .trim()
    .toLowerCase();
  return interval === "day" ? "jour" : "mois";
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
  const [showActivationForm, setShowActivationForm] = useState(false);
  const [showNoUserModal, setShowNoUserModal] = useState(false);

  const isSubscriptionActive = isSummarySubscriptionActive(summary);
  const autoRenewEnabled =
    typeof summary?.autoRenew === "boolean" ? summary.autoRenew : true;
  const isScheduledForCancellation = isSubscriptionActive && !autoRenewEnabled;
  const shouldShowInlineSubscribeError =
    showActivationForm && Boolean(errorMessage);

  const freeItemRemaining = Math.max(0, Number(summary?.freeItemRemaining ?? 0));
  const freeItemAvailabilityLabel = freeItemRemaining > 0 ? "Disponible" : "Utilisé";
  const savingsTotal = Number(summary?.savingsTotal || 0);
  const pricing = useMemo(
    () => getSubscriptionPricing(config || summary || null),
    [config, summary]
  );
  const cycleLabel = useMemo(
    () => getSubscriptionCycleLabel(config || summary || null),
    [config, summary]
  );

  const priceLabel = useMemo(() => {
    return `${pricing.subtotal.toFixed(2)}$ / ${cycleLabel}`;
  }, [cycleLabel, pricing.subtotal]);

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
    setIsLoading(true);
    setErrorMessage("");
    try {
      const configResponse = await getSubscriptionConfig();

      if (configResponse.status) {
        setConfig(configResponse.data);
      }

      if (user?._id) {
        const subscriptionResponse = await refreshUserSubscription(user._id);

        if (subscriptionResponse.status) {
          setSummary(subscriptionResponse.data);
        } else {
          setSummary(null);
        }
      } else {
        setSummary(null);
        setCards([]);
        setSelectedPmId(null);
        setShowCardField(true);
      }

      if (user?._id) {
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
          setSelectedPmId(null);
          setShowCardField(true);
        }
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
    if (isSubscriptionActive && !isScheduledForCancellation) {
      setShowActivationForm(false);
    }
  }, [isSubscriptionActive, isScheduledForCancellation]);

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
    if (!user?._id) {
      setShowNoUserModal(true);
      return;
    }
    const isReactivationFlow = isScheduledForCancellation;

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
        paymentMethodId
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

      setSuccessMessage(
        isReactivationFlow
          ? "Votre abonnement a été réactivé. Le renouvellement automatique est de nouveau actif."
          : "Félicitations, vous êtes maintenant abonné à CLUB COURTEAU."
      );
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
      <div className="min-h-screen bg-[#fffdf9] px-5 pb-20 pt-28 md:px-14 md:pt-44">
        <div className="mx-auto max-w-6xl">
          <div className="h-80 animate-pulse rounded-3xl bg-[#eee7db] p-6">
            <p className="font-inter text-[#8a8074]">Chargement du Club Courteau…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fffdf9] px-5 pb-24 pt-24 text-[#1a1714] md:px-14 md:pt-40">
      {showNoUserModal && (
        <NoUserModal
          showNoUserModal={showNoUserModal}
          setShowNoUserModal={setShowNoUserModal}
          title="Vous devez être connecté pour activer CLUB COURTEAU."
          description="Connectez-vous ou créez votre compte pour activer votre abonnement."
        />
      )}
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-3xl bg-pr p-6 md:p-10 lg:p-12">
          <span className="pointer-events-none absolute -bottom-20 left-4 font-bebas-neue text-[15rem] leading-none text-black/[.06] md:text-[22rem]">CLUB</span>
          <div className="relative grid items-start gap-9 lg:grid-cols-[1.25fr_.75fr]">
            <div>
              <p className="inline-flex rounded-full bg-[#1a1714] px-4 py-2 text-[10px] font-bold tracking-[.16em] text-pr">ABONNEMENT MENSUEL · SANS ENGAGEMENT</p>
              <h1 className="mt-6 font-bebas-neue text-7xl leading-[.82] md:text-[7rem]">CLUB<br />COURTEAU</h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-black/75">Plus de Courteau, moins cher. Vos avantages s’appliquent automatiquement à chacune de vos commandes.</p>
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Benefit value={`−${SUBSCRIPTION_DISCOUNT_PERCENT}%`} title="Sur le menu" />
                <Benefit value="0$" title="Livraison" />
                <Benefit value="1 / MOIS" title="Article gratuit" />
                <Benefit value="0" title="Engagement" />
              </div>
            </div>
            <div className="rounded-2xl bg-[#1a1714] p-6 text-white shadow-2xl md:p-8">
              <p className="text-[10px] font-bold tracking-[.16em] text-white/45">ADHÉSION MENSUELLE</p>
              <div className="mt-4 flex items-end gap-2"><strong className="font-bebas-neue text-6xl leading-none text-pr md:text-7xl">{pricing.subtotal.toFixed(2)}$</strong><span className="pb-2 text-sm text-white/55">/ {cycleLabel}</span></div>
              <div className="my-6 h-px bg-white/10" />
              <ul className="space-y-3 text-sm text-white/85"><li><span className="mr-2 text-pr">✓</span>{SUBSCRIPTION_DISCOUNT_PERCENT} % sur chaque commande</li><li><span className="mr-2 text-pr">✓</span>Livraison toujours gratuite</li><li><span className="mr-2 text-pr">✓</span>Un article offert par mois</li></ul>
              {(!isSubscriptionActive || isScheduledForCancellation) && <button type="button" onClick={() => { if (!user?._id) { setShowNoUserModal(true); return; } setShowActivationForm((previous) => !previous); }} className="mt-7 w-full rounded-xl border-2 border-white bg-white p-4 font-bebas-neue text-xl tracking-wider text-[#1a1714] shadow-lg transition hover:-translate-y-0.5 hover:border-pr hover:bg-pr">{showActivationForm ? "MASQUER LE PAIEMENT" : isScheduledForCancellation ? "RÉACTIVER MON ABONNEMENT" : "ACTIVER MON ABONNEMENT"}</button>}
            </div>
          </div>
        </section>

        <div className="mx-auto mt-8 max-w-3xl">

        {!isOfferMode && (
          <div className="mt-6 rounded-2xl border border-[#ece5d9] bg-white p-6 shadow-sm">
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
                Sous-total abonnement: <span className="font-semibold">{priceLabel}</span>
              </p>
              <p>
                TPS (5%):{" "}
                <span className="font-semibold">{pricing.tpsAmount.toFixed(2)}$</span>
              </p>
              <p>
                TVQ (9.975%):{" "}
                <span className="font-semibold">{pricing.tvqAmount.toFixed(2)}$</span>
              </p>
              <p>
                Total du mois:{" "}
                <span className="font-semibold">{pricing.total.toFixed(2)}$</span>
              </p>
              <p>
                Date d&apos;échéance:{" "}
                <span className="font-semibold">
                  {formatDate(summary?.currentPeriodEnd)}
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

        {(!isSubscriptionActive || isScheduledForCancellation) && (
          <div className="mt-6 rounded-2xl border border-[#ece5d9] bg-white p-6 shadow-sm md:p-8">
            {isScheduledForCancellation ? (
              <div className="rounded-xl border border-[#E3B341] bg-[#FFF8EA] px-4 py-4 mb-4">
                <p className="font-inter font-semibold text-sm text-[#7A4D00]">
                  Abonnement désactivé pour le prochain mois
                </p>
                <p className="font-inter text-sm text-[#7A4D00] mt-2">
                  Votre abonnement reste actif jusqu&apos;au {formatDate(summary?.currentPeriodEnd)}.
                </p>
                <p className="font-inter text-sm text-[#7A4D00] mt-2">
                  Choisissez une carte pour réactiver le renouvellement automatique.
                </p>
              </div>
            ) : null}
            {showActivationForm && user?._id && (
              <>
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
                        className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
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
                      className="w-full rounded-xl border border-dashed border-[#d8d0c3] p-4 text-sm font-inter hover:border-pr"
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
                    <div className="rounded-xl border border-[#d8d0c3] p-4 focus-within:border-pr focus-within:ring-1 focus-within:ring-pr">
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

                <div className="mt-5 rounded-2xl border border-[#ece5d9] bg-[#faf7f1] p-5">
                  <p className="font-inter font-semibold text-sm text-black">
                    Récapitulatif du paiement
                  </p>
                  <div className="mt-3 space-y-2 text-sm font-inter text-gray-700">
                    <div className="flex items-center justify-between gap-4">
                      <span>Sous-total</span>
                      <span className="font-semibold text-black">
                        {pricing.subtotal.toFixed(2)}$
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>TPS (5%)</span>
                      <span className="font-semibold text-black">
                        {pricing.tpsAmount.toFixed(2)}$
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>TVQ (9.975%)</span>
                      <span className="font-semibold text-black">
                        {pricing.tvqAmount.toFixed(2)}$
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex items-center justify-between gap-4">
                      <span className="font-semibold text-black">Total</span>
                      <span className="font-semibold text-black">
                        {pricing.total.toFixed(2)}$
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-5 w-full cursor-pointer rounded-xl bg-pr px-4 py-4 font-bebas-neue text-xl tracking-wider text-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-gray-300"
                  disabled={isSubmitting}
                  onClick={handleSubscribe}
                >
                  {isSubmitting
                    ? "Traitement..."
                    : isScheduledForCancellation
                      ? "Réactiver mon abonnement"
                      : "S'abonner maintenant"}
                </button>
              </>
            )}
          </div>
        )}

        {isSubscriptionActive && !isOfferMode && (
          <div className="mt-6 rounded-2xl border border-[#ece5d9] bg-white p-6 shadow-sm">
            {!isScheduledForCancellation && (
              <button
                type="button"
                className="bg-black text-white font-bebas-neue text-xl px-4 py-3 rounded-md w-full cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={isSubmitting}
                onClick={handleCancelSubscription}
              >
                Désactiver mon abonnement
              </button>
            )}
          </div>
        )}

        {isSubscriptionActive && isOfferMode && !isScheduledForCancellation && (
          <div className="mt-6 rounded-2xl border border-[#ece5d9] bg-white p-6 shadow-sm">
            <p className="font-inter font-semibold text-black text-sm">
              Votre abonnement est déjà actif.
            </p>
            <p className="font-inter text-gray-600 text-sm mt-2">
              Pour voir les détails de votre abonnement, ouvrez Mon abonnement
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
    </main>
  );
};

const Benefit = ({ value, title }) => (
  <div className="rounded-2xl bg-[#fffdf9]/95 p-4">
    <p className="font-bebas-neue text-3xl leading-none md:text-4xl">{value}</p>
    <p className="mt-2 text-xs font-bold md:text-sm">{title}</p>
  </div>
);

const SubscriptionContent = ({ mode = "offer" }) => {
  return (
    <Elements stripe={stripePromise}>
      <SubscriptionContentInner mode={mode} />
    </Elements>
  );
};

export default SubscriptionContent;
