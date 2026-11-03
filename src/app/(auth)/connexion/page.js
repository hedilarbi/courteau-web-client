"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner/Spinner";
import Image from "next/image";
import { sendSmsVerification } from "@/services/Verify";
import TurnstileWidget from "@/components/TurnstileWidget";
import { TURNSTILE_ERRORS, useTurnstileToken } from "@/hooks/useTurnstileToken";

const SECURITY_CHECK_MESSAGES = {
  [TURNSTILE_ERRORS.TIMEOUT]: "La vérification de sécurité prend trop de temps. Réessayez.",
  [TURNSTILE_ERRORS.FAILED]: "Vérification de sécurité impossible. Réessayez dans un instant.",
};

export default function ConnexionPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCheckingSecurity, setIsCheckingSecurity] = useState(false);
  const { turnstileProps, waitForToken, consumeToken } = useTurnstileToken();
  const router = useRouter();
  const phoneNumberInput = useRef(null);

  // Un clic arrivé avant la fin de la vérification Cloudflare attend le jeton. Pas de voile
  // pendant l'attente : il cacherait la case à cocher si Cloudflare la demande.
  const obtainSecurityToken = async () => {
    setIsCheckingSecurity(true);
    try {
      return await waitForToken();
    } catch (err) {
      setError(SECURITY_CHECK_MESSAGES[err?.code] || SECURITY_CHECK_MESSAGES[TURNSTILE_ERRORS.FAILED]);
      return null;
    } finally {
      setIsCheckingSecurity(false);
    }
  };

  const sendOtp = async () => {
    try {
      if (isCheckingSecurity || isLoading) return;
      if (phoneNumber.trim().length <= 0) {
        setError("Entrez votre numéro de téléphone.");
        phoneNumberInput.current?.focus();
        return;
      }
      setError("");

      const digits = phoneNumber.replace(/\D/g, "");
      const local = digits.startsWith("1") && digits.length === 11 ? digits.slice(1) : digits;

      if (local.length !== 10) {
        setError("Numéro de téléphone invalide (10 chiffres requis).");
        return;
      }

      const formattedValue = "+1" + local;

      const turnstileToken = await obtainSecurityToken();
      if (!turnstileToken) return;

      setIsLoading(true);
      const result = await sendSmsVerification(formattedValue, turnstileToken);
      consumeToken();
      if (!result.success) {
        setError(result.message || "Erreur lors de l'envoi du code de vérification");
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      router.push(`/otp?phoneNumber=${encodeURIComponent(formattedValue)}`);
    } catch (err) {
      setIsLoading(false);
      setError("Une erreur s'est produite. Veuillez réessayer.");
    }
  };

  return (
    <div className="min-h-screen md:flex block items-center md:justify-start justify-center  bg-[#F7F7F7] font-lato ">
      {isLoading && (
        <div className="fixed top-0 left-0 h-screen w-screen bg-black/40 flex justify-center items-center z-50">
          <Spinner />
        </div>
      )}
      <div className="hidden  w-1/2 md:flex justify-center items-center bg-black shadow-2xl h-screen ">
        <Image
          src="/logo.png"
          alt="Logo"
          className="h-48 w-auto"
          width={1920}
          height={1080}
        />
      </div>
      <div className="flex justify-center md:hidden bg-black py-14">
        <Image
          src="/logo.png"
          alt="Logo"
          className=""
          width={300}
          height={150}
        />
      </div>
      <div className="flex items-center p-8 rounded   flex-1">
        <div className="w-full">
          <h1 className="md:text-4xl text-3xl font-bold mb-4 font-bebas-neue text-left">
            Se connecter
          </h1>
          <p className="mt-2 font-lato text-base md:text-xl scroll-mb-14">
            Entrez votre numéro de téléphone pour recevoir un code de
            vérification par SMS.
          </p>

          <div className="mb-4 mt-4">
            <label
              htmlFor="email"
              className="block text-base font-medium text-gray-700"
            >
              Numéro de téléphone
            </label>
            <div className="flex items-center border-[#B4B4B4] bg-white  rounded-md shadow-sm mt-1 px-3 ">
              <Image
                src="CanadaFlag.svg"
                alt="Flag"
                width={30}
                height={30}
                className="mr-2 ontain bg-no-repeat"
              />
              <input
                ref={phoneNumberInput}
                type="tel"
                id="phone"
                placeholder="8113123456"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className=" w-full  p-3"
                required
              />
            </div>
          </div>

          <TurnstileWidget {...turnstileProps} />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            onClick={sendOtp}
            disabled={isCheckingSecurity || isLoading}
            aria-busy={isCheckingSecurity || isLoading}
            className="w-full bg-pr  text-black py-2 px-4 rounded font-bebas-neue text-2xl cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            {isCheckingSecurity ? "Vérification de sécurité…" : "Se connecter"}
          </button>
          <p className="mt-4 text-sm text-gray-600 text-center">
            En vous connectant, vous acceptez nos{" "}
            <span
              className="text-pr cursor-pointer"
              onClick={() => router.push("/termes-conditions")}
            >
              Conditions d&apos;utilisation
            </span>{" "}
            .
          </p>

          <p className="mt-4 text-sm text-gray-700 text-center">
            Vous n&apos;avez pas de compte ?{" "}
            <span
              className="text-pr cursor-pointer underline"
              onClick={() => router.push("/inscription")}
            >
              Inscrivez-vous
            </span>
          </p>

          <p
            className="text-pr cursor-pointer text-center mt-3 underline"
            onClick={() => router.push("/")}
          >
            Page d&apos;accueil
          </p>
        </div>
      </div>
    </div>
  );
}
