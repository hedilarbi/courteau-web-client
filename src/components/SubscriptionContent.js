"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
    <main className="min-h-screen overflow-hidden bg-pr px-4 pb-10 pt-24 text-[#1a1714] sm:px-6 sm:pb-14 md:pt-36 lg:px-10 lg:pb-20">
      {showNoUserModal && (
        <NoUserModal
          showNoUserModal={showNoUserModal}
          setShowNoUserModal={setShowNoUserModal}
          title="Vous devez être connecté pour activer CLUB COURTEAU."
          description="Connectez-vous ou créez votre compte pour activer votre abonnement."
        />
      )}
      <div className="mx-auto max-w-[1480px]">
        <section className="relative overflow-hidden bg-[#151513] text-white shadow-[0_24px_70px_rgba(62,38,0,.25)]">
          <div className="grid lg:min-h-[690px] lg:grid-cols-[55%_45%]">
            <div className="relative z-10 flex flex-col px-6 pb-10 pt-9 sm:px-10 sm:py-12 lg:px-16 lg:py-14 xl:px-20">
              <div className="mb-7 flex items-center gap-3 font-bebas-neue text-sm tracking-[.18em] text-pr sm:text-base">
                <span aria-hidden="true">★</span><span>ABONNEMENT MENSUEL</span><span aria-hidden="true">★</span>
              </div>

              <div className="w-fit">
                <span className="bg-white px-3 py-1 font-bebas-neue text-2xl tracking-[.18em] text-[#151513] sm:text-3xl">CLUB</span>
                <h1 className="bg-pr px-3 pb-1 pt-2 font-bebas-neue text-[4.25rem] leading-[.82] tracking-wide text-[#151513] sm:text-[6.2rem] lg:text-[7.2rem]">COURTEAU</h1>
              </div>

              <p className="mt-8 font-bebas-neue text-[2.8rem] leading-[.9] tracking-wide sm:text-[4rem] lg:text-[4.5rem]">
                VOS CLASSIQUES.<br /><span className="text-pr">À MEILLEUR PRIX.</span>
              </p>
              <p className="mt-6 max-w-[650px] text-sm leading-7 text-white/70 sm:text-base">
                Les membres profitent de <strong className="text-white">{SUBSCRIPTION_DISCOUNT_PERCENT} % de rabais</strong> sur le menu, de la <strong className="text-white">livraison offerte</strong> et d&apos;un <strong className="text-white">article gratuit chaque mois</strong>. Les avantages s&apos;appliquent automatiquement.
              </p>

              <div className="mt-7 grid grid-cols-3 border-y border-white/15 py-5">
                <Benefit value={`−${SUBSCRIPTION_DISCOUNT_PERCENT} %`} title="Sur tout le menu" />
                <Benefit value="0 $" title="De frais de livraison" divided />
                <Benefit value="1 / MOIS" title="Article offert" divided />
              </div>

              <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex items-end gap-2">
                  <strong className="font-bebas-neue text-6xl leading-none sm:text-7xl">{pricing.subtotal.toFixed(2).replace(".", ",")} $</strong>
                  <span className="pb-1 text-[10px] font-bold uppercase leading-4 text-white/60">Par {cycleLabel}<br />Sans engagement</span>
                </div>
                {(!isSubscriptionActive || isScheduledForCancellation) && (
                  <button type="button" onClick={() => { if (!user?._id) { setShowNoUserModal(true); return; } setShowActivationForm((previous) => !previous); }} className="group flex min-h-14 flex-1 items-center justify-center gap-5 bg-pr px-6 font-bebas-neue text-xl tracking-wider text-[#151513] transition hover:bg-[#ffba2b] sm:max-w-[310px] sm:text-2xl">
                    {showActivationForm ? "MASQUER LE PAIEMENT" : isScheduledForCancellation ? "RÉACTIVER" : "DEVENIR MEMBRE"}<span className="transition group-hover:translate-x-1">→</span>
                  </button>
                )}
              </div>
              <p className="mt-3 text-[10px] text-white/35">Annulable en tout temps. Avantages appliqués aux commandes admissibles.</p>
            </div>

            <div className="relative min-h-[390px] overflow-hidden sm:min-h-[480px] lg:min-h-0">
              <Image src="/HomeHero.jpg" alt="Poutine Courteau généreusement garnie" fill priority sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover object-[62%_center]" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#151513]/10 via-transparent to-[#151513] lg:bg-gradient-to-r lg:from-[#151513] lg:via-[#151513]/5 lg:to-transparent" />
              <div className="absolute right-5 top-5 rotate-2 border-[5px] border-[#151513] bg-pr px-5 py-4 text-[#151513] shadow-[8px_8px_0_rgba(0,0,0,.35)] sm:right-8 sm:top-8 sm:px-7 sm:py-5">
                <p className="text-[10px] font-black tracking-[.12em] sm:text-xs">AVANTAGE MEMBRE</p>
                <p className="font-bebas-neue text-4xl leading-[.82] sm:text-5xl">UN ARTICLE<br />GRATUIT</p>
                <p className="mt-1 text-[10px] font-black tracking-wide">CHAQUE MOIS</p>
              </div>
              <div className="absolute bottom-7 left-6 right-6 border-l-4 border-pr pl-4 sm:bottom-10 sm:left-10 lg:left-12">
                <p className="font-bebas-neue text-3xl leading-none sm:text-4xl">RENTABILISÉ EN 2 COMMANDES</p>
                <p className="mt-2 max-w-md text-xs text-white/60">Plus vous commandez, plus votre abonnement vous récompense.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl">

        {!isOfferMode && (
          <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
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
          <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 shadow-sm md:p-8">
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

const Benefit = ({ value, title, divided = false }) => (
  <div className={`min-w-0 px-3 first:pl-0 sm:px-5 ${divided ? "border-l border-white/15" : ""}`}>
    <p className="font-bebas-neue text-3xl leading-none text-pr sm:text-4xl">{value}</p>
    <p className="mt-1 text-[10px] leading-tight text-white/70 sm:text-xs">{title}</p>
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
