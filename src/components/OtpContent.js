"use client";
import React, { useRef, useState } from "react";
import BackButton from "./BackButton";
import OTPInput from "react-otp-input";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { create } from "@/app/actions";
import { createUserService } from "@/services/UserServices";
import { checkVerification, sendSmsVerification } from "@/services/Verify";
import TurnstileWidget from "./TurnstileWidget";
import { TURNSTILE_ERRORS, useTurnstileToken } from "@/hooks/useTurnstileToken";

const OTP_LENGTH = 6;
const LOGIN_FAILED_MESSAGE = "Connexion impossible pour le moment. Réessayez.";
const SECURITY_CHECK_MESSAGES = {
  [TURNSTILE_ERRORS.TIMEOUT]: "La vérification de sécurité prend trop de temps. Réessayez.",
  [TURNSTILE_ERRORS.FAILED]: "Vérification de sécurité impossible. Réessayez dans un instant.",
};
// Refus du serveur (401) : la preuve ne servira plus, il faut un nouveau code.
const PROOF_REJECTED_ERRORS = [
  "PHONE_NOT_VERIFIED",
  "PHONE_MISMATCH",
  "PHONE_VERIFICATION_USED",
];

const OtpContent = ({ phoneNumber }) => {
  const [error, setError] = useState("");
  const [invalidCode, setInvalidCode] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState("");
  const [ressendSuccess, setResendSuccess] = useState(false);
  const { turnstileProps, waitForToken, consumeToken } = useTurnstileToken();
  const router = useRouter();
  const { createUser } = useUser();
  // Preuve SMS obtenue mais pas encore échangée contre une session : Twilio refuse de
  // revérifier un code déjà validé, un nouvel essai réutilise donc cette preuve.
  const pendingProof = useRef(null);
  const canVerify = !isLoading && otp.length === OTP_LENGTH;

  const obtainProof = async () => {
    if (pendingProof.current) return pendingProof.current;
    const result = await checkVerification(phoneNumber, otp);
    if (result.error === "OTP_INVALID") {
      setInvalidCode(true);
      return null;
    }
    if (!result.success) {
      setError(result.message);
      return null;
    }
    pendingProof.current = result.phoneVerificationToken;
    return pendingProof.current;
  };

  const signIn = async (proof) => {
    const response = await createUserService(phoneNumber, proof);
    if (!response.status) {
      if (PROOF_REJECTED_ERRORS.includes(response.error)) {
        pendingProof.current = null;
      }
      setError(response.message || LOGIN_FAILED_MESSAGE);
      return;
    }
    pendingProof.current = null;
    await create(response.data.token);
    createUser(response.data.user);
    router.push(response.data.user.is_profile_setup ? "/" : "/completer-profil");
  };

  const verifyCode = async () => {
    if (!canVerify) return;
    setIsLoading(true);
    setInvalidCode(false);
    setError("");
    try {
      const proof = await obtainProof();
      if (proof) await signIn(proof);
    } catch (err) {
      console.error("Erreur lors de la vérification du code :", err);
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    if (resending) return;
    setResendSuccess(false);
    setResendError("");
    setResending(true);
    let turnstileToken;
    try {
      // Un clic avant la fin de la vérification Cloudflare attend le jeton au lieu d'échouer.
      turnstileToken = await waitForToken();
    } catch (err) {
      setResending(false);
      setResendError(SECURITY_CHECK_MESSAGES[err?.code] || SECURITY_CHECK_MESSAGES[TURNSTILE_ERRORS.FAILED]);
      return;
    }
    const result = await sendSmsVerification(phoneNumber, turnstileToken);
    consumeToken();
    setResending(false);
    if (result.success) {
      setResendSuccess(true);
    } else {
      setResendError(result.message);
    }
  };
  return (
    <div className="bg-[#EBEBEB] h-screen py-8 px-4 md:px-12 flex flex-col ">
      <BackButton />
      <div className=" flex-1  flex flex-col items-center justify-center">
        <p className="font-inter font-bold text-black text-center text-lg md:text-3xl mb-4">
          Vérifier Votre Numéro de Téléphone
        </p>
        <p className="font-inter text-black text-center text-sm md:text-base mb-8">
          Entrez le code de vérification envoyé à {phoneNumber}
        </p>
        <OTPInput
          value={otp}
          onChange={(value) => setOtp(value)}
          numInputs={6}
          renderSeparator={<span>-</span>}
          renderInput={(props) => (
            <input
              {...props}
              className="w-16 h-12 md:w-20 md:h-10  text-2xl md:text-3xl text-center border border-gray-300 rounded focus:outline-none focus:border-pr"
            />
          )}
          //inputStyle="w-16 h-12 md:w-20 md:h-20 text-2xl md:text-3xl text-center border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          isInputNum={true}
          shouldAutoFocus={true}
        />
        {invalidCode && (
          <p className="text-red-500 text-sm mt-2">
            Le code de vérification est invalide. Veuillez réessayer.
          </p>
        )}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <button
          className="bg-pr  text-black px-6 py-2 font-bebas-neue text-lg rounded mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={verifyCode}
          disabled={!canVerify}
          aria-busy={isLoading}
        >
          {isLoading ? "Vérification..." : "Vérifier"}
        </button>
        <div className="flex items-center mt-6 flex-wrap ">
          <p className="text-center md:text-left">
            Vous n&apos;avez pas reçu le code ?{" "}
            <button
              type="button"
              className="text-pr cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={resendCode}
              disabled={resending}
            >
              {resending ? "Envoi en cours..." : "Renvoyer le code"}
            </button>
          </p>
        </div>
        {ressendSuccess && (
          <p className="text-green-500 text-sm mt-2">
            Le code a été renvoyé avec succès.
          </p>
        )}
        {resendError && (
          <p className="text-red-500 text-sm mt-2">{resendError}</p>
        )}
        <TurnstileWidget {...turnstileProps} />
      </div>
    </div>
  );
};

export default OtpContent;
