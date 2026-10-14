"use client";

import React, { useEffect, useState } from "react";
import OTPInput from "react-otp-input";
import { MdCheck, MdClose, MdOutlineMarkEmailRead } from "react-icons/md";
import { useUser } from "@/context/UserContext";
import { useSmartOffer } from "@/context/SmartOfferContext";
import { getToken } from "@/app/actions";
import {
  sendEmailVerificationCode,
  verifyEmailCode,
} from "@/services/UserServices";

// Le rappel est facultatif : une fois fermé, il ne revient qu'à la prochaine
// visite du site (nouvel onglet ou nouvelle session du navigateur).
const DISMISSED_KEY = "emailVerificationPromptDismissed";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ERROR_MESSAGES = {
  INVALID_EMAIL: "Adresse courriel invalide.",
  EMAIL_TAKEN: "Cette adresse courriel est déjà utilisée.",
  RESEND_TOO_SOON: "Veuillez patienter avant de demander un nouveau code.",
  TOO_MANY_REQUESTS: "Trop de codes envoyés. Réessayez plus tard.",
  MAIL_FAILED:
    "Impossible d'envoyer le courriel pour le moment. Réessayez plus tard.",
  OTP_INVALID: "Code incorrect.",
  OTP_EXPIRED: "Ce code a expiré. Demandez un nouveau code.",
  TOO_MANY_ATTEMPTS: "Trop de tentatives. Demandez un nouveau code.",
  UNAUTHORIZED: "Session expirée. Veuillez vous reconnecter.",
};

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const getErrorMessage = (response) => {
  if (response?.error === "OTP_INVALID" && response?.attemptsLeft > 0) {
    return `Code incorrect. Tentatives restantes : ${response.attemptsLeft}.`;
  }
  return (
    ERROR_MESSAGES[response?.error] ||
    "Une erreur s'est produite. Veuillez réessayer."
  );
};

const isDismissedThisSession = () => {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
};

const rememberDismissal = () => {
  try {
    sessionStorage.setItem(DISMISSED_KEY, "1");
  } catch {}
};

export default function EmailVerificationModal() {
  const { user, updateUser } = useUser();
  const { showSmartOfferModal } = useSmartOffer();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [code, setCode] = useState("");
  const [verifiedUser, setVerifiedUser] = useState(null);
  // Bonus crédité par le serveur (une seule fois par compte) : 0 s'il a déjà été reçu.
  const [pointsAwarded, setPointsAwarded] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(0);

  const isEligible =
    Boolean(user?._id) &&
    user?.is_profile_setup !== false &&
    user?.emailVerified === false &&
    !user?.isBanned;

  // Laisse d'abord passer la popup d'offre personnalisée du chargement.
  useEffect(() => {
    if (open || !isEligible || showSmartOfferModal || isDismissedThisSession()) {
      return;
    }
    const timer = setTimeout(() => {
      setEmail(user?.email || "");
      setStep("email");
      setError("");
      setOpen(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [open, isEligible, showSmartOfferModal, user?.email]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const getAuthToken = async () => {
    const token = await getToken();
    return token?.value || null;
  };

  const sendCode = async (targetEmail) => {
    const normalizedEmail = normalizeEmail(targetEmail);
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError(ERROR_MESSAGES.INVALID_EMAIL);
      return;
    }

    setIsLoading(true);
    setError("");
    const response = await sendEmailVerificationCode(
      await getAuthToken(),
      normalizedEmail,
    );
    setIsLoading(false);

    if (response.status) {
      setSentEmail(response.data?.email || normalizedEmail);
      setCode("");
      setResendIn(response.data?.resendAvailableInSeconds || 60);
      setStep("code");
      return;
    }

    if (response.error === "ALREADY_VERIFIED") {
      updateUser({ emailVerified: true });
      setOpen(false);
      return;
    }
    if (response.retryAfterSeconds) {
      setResendIn(response.retryAfterSeconds);
    }
    setError(getErrorMessage(response));
  };

  const verifyCode = async (value = code) => {
    if (isLoading || String(value).length !== 6) return;

    setIsLoading(true);
    setError("");
    const response = await verifyEmailCode(await getAuthToken(), value);
    setIsLoading(false);

    if (response.status) {
      setPointsAwarded(Number(response.data?.pointsAwarded) || 0);
      setVerifiedUser(
        response.data?.user || {
          email: response.data?.email || sentEmail,
          emailVerified: true,
        },
      );
      setStep("done");
      return;
    }

    setCode("");
    setError(getErrorMessage(response));
  };

  const handleClose = () => {
    if (step === "done" && verifiedUser) {
      updateUser(verifiedUser);
    } else {
      rememberDismissal();
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (!open || !user?._id || showSmartOfferModal) return null;

  const isEmailChanged =
    normalizeEmail(email).length > 0 &&
    normalizeEmail(email) !== normalizeEmail(user?.email);

  const primaryButtonClass =
    "mt-6 w-full rounded-full bg-pr py-3 font-bebas-neue text-xl tracking-wide text-black transition hover:bg-[#e69500] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-verification-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white font-inter text-black shadow-2xl">
        <div className="h-1.5 w-full bg-pr" />
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 cursor-pointer p-1 text-gray-500 transition-colors hover:text-black"
          aria-label="Fermer"
        >
          <MdClose size={24} />
        </button>

        <div className="px-6 pb-6 pt-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pr">
            {step === "done" ? (
              <MdCheck size={30} />
            ) : (
              <MdOutlineMarkEmailRead size={28} />
            )}
          </div>

          {step === "email" && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (resendIn <= 0) sendCode(email);
              }}
            >
              <h2
                id="email-verification-title"
                className="mt-4 text-center text-xl font-bold"
              >
                Confirmez votre courriel et gagnez 50 points de fidélité
              </h2>
              <p className="mt-2 text-center text-sm leading-relaxed text-tgry">
                Confirmez que cette adresse vous appartient. Si elle n&apos;est
                plus à jour, modifiez-la avant d&apos;envoyer le code.
              </p>

              <label
                htmlFor="email-verification-input"
                className="mt-5 block text-sm font-semibold"
              >
                Courriel
              </label>
              <input
                id="email-verification-input"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                placeholder="nom@exemple.com"
                autoComplete="email"
                className={`mt-2 w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none focus:border-pr ${
                  error ? "border-red-500" : "border-gray-200"
                }`}
              />
              {isEmailChanged && (
                <p className="mt-1.5 text-xs text-gray-500">
                  Cette adresse remplacera l&apos;ancienne une fois vérifiée.
                </p>
              )}
              {error && (
                <p className="mt-2 text-center text-sm text-red-500">{error}</p>
              )}

              <button
                type="submit"
                className={primaryButtonClass}
                disabled={isLoading || resendIn > 0}
              >
                {isLoading
                  ? "Envoi..."
                  : resendIn > 0
                    ? `Envoyer le code (${resendIn} s)`
                    : "Envoyer le code"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="mt-2 w-full cursor-pointer py-2 text-sm text-gray-500 hover:text-black"
              >
                Plus tard
              </button>
            </form>
          )}

          {step === "code" && (
            <div>
              <h2
                id="email-verification-title"
                className="mt-4 text-center text-xl font-bold"
              >
                Entrez le code
              </h2>
              <p className="mt-2 text-center text-sm leading-relaxed text-tgry">
                Nous avons envoyé un code à 6 chiffres à{" "}
                <span className="font-semibold text-black break-all">
                  {sentEmail}
                </span>
              </p>

              <div className="mt-5">
                <OTPInput
                  value={code}
                  onChange={(value) => {
                    setCode(value);
                    if (error) setError("");
                    if (value.length === 6) verifyCode(value);
                  }}
                  numInputs={6}
                  inputType="tel"
                  shouldAutoFocus
                  skipDefaultStyles
                  containerStyle="flex justify-center gap-1.5 sm:gap-2"
                  renderInput={(props) => (
                    <input
                      {...props}
                      aria-label="Chiffre du code de vérification"
                      className="h-12 w-10 rounded-xl border border-gray-300 text-center text-2xl outline-none focus:border-pr sm:h-14 sm:w-12"
                    />
                  )}
                />
              </div>
              {error && (
                <p className="mt-3 text-center text-sm text-red-500">{error}</p>
              )}

              <button
                type="button"
                onClick={() => verifyCode()}
                className={primaryButtonClass}
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? "Vérification..." : "Vérifier"}
              </button>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => sendCode(sentEmail)}
                  disabled={resendIn > 0 || isLoading}
                  className="cursor-pointer text-[#8e6200] disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  {resendIn > 0
                    ? `Renvoyer dans ${resendIn} s`
                    : "Renvoyer le code"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setEmail(sentEmail);
                    setStep("email");
                  }}
                  disabled={isLoading}
                  className="cursor-pointer text-[#8e6200]"
                >
                  Modifier l&apos;adresse
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div>
              <h2
                id="email-verification-title"
                className="mt-4 text-center text-xl font-bold"
              >
                Courriel vérifié
              </h2>
              <p className="mt-2 text-center text-sm leading-relaxed text-tgry">
                Merci ! L&apos;adresse{" "}
                <span className="font-semibold text-black break-all">
                  {verifiedUser?.email || sentEmail}
                </span>{" "}
                est maintenant confirmée.
              </p>
              {pointsAwarded > 0 && (
                <p className="mt-2 text-center text-sm font-bold text-[#A27000]">
                  +{pointsAwarded} points de fidélité ont été ajoutés à votre compte.
                </p>
              )}
              <button
                type="button"
                onClick={handleClose}
                className={primaryButtonClass}
              >
                Continuer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
