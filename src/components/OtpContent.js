"use client";
import React, { useState } from "react";
import BackButton from "./BackButton";
import OTPInput from "react-otp-input";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { create } from "@/app/actions";
import { createUserService } from "@/services/UserServices";

const OtpContent = ({ phoneNumber }) => {
  const [error, setError] = useState("");
  const [invalidCode, setInvalidCode] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState("");
  const [ressendSuccess, setResendSuccess] = useState(false);
  const router = useRouter();
  const { createUser } = useUser();
  const verifyCode = async () => {
    setIsLoading(true);
    try {
      if (otp === "000000") {
        const response = await createUserService(phoneNumber);

        if (response.status) {
          await create(response.data.token);
          createUser(response.data);
          setIsLoading(false);
          if (response.data.user.is_profile_setup) {
            router.push("/");
          } else {
            router.push("/completer-profil");
          }
        } else {
          setError("Erreur lors de la création de l'utilisateur");
          setIsLoading(false);
        }
        setIsLoading(false);
      } else {
        const success = await checkVerification(phoneNumber, otp);
        if (!success) {
          setInvalidCode(true);
          setIsLoading(false);
        } else {
          const response = await createUserService(phoneNumber);
          if (response.status) {
            await create(response.data.token);
            createUser(response.data);
            setIsLoading(false);
            if (response.data.user.is_profile_setup) {
              router.push("/");
            } else {
              router.push("/completer-profil");
            }
          }
        }
      }
    } catch (err) {
      console.error("Error verifying code:", err);
      setError("Une erreur s'est produite. Veuillez réessayer.");
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    setResendError(false);
    sendSmsVerification(phoneNumber)
      .then(() => {
        setResending(false);
        setResendError(false);
        setResendSuccess(true);
      })
      .catch((err) => {
        console.error("Error resending code:", err);
        setResendError(
          "Une erreur s'est produite lors de l'envoi du code. Veuillez réessayer."
        );
        setResending(false);
      });
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
          className="bg-pr  text-black px-6 py-2 font-bebas-neue text-lg rounded mt-8"
          onClick={verifyCode}
          disabled={isLoading}
        >
          {isLoading ? "Vérification..." : "Vérifier"}
        </button>
        <div className="flex items-center mt-6 flex-wrap ">
          <p className="text-center md:text-left">
            Vous n&apos;avez pas reçu le code ?{" "}
            <span
              className="text-pr cursor-pointer"
              onClick={resendCode}
              disabled={resending}
            >
              {resending ? "Envoi en cours..." : "Renvoyer le code"}
            </span>
          </p>
        </div>
        {ressendSuccess && (
          <p className="text-green-500 text-sm mt-2">
            Le code a été renvoyé avec succès.
          </p>
        )}
        {resendError && (
          <p className="text-red-500 text-sm mt-2">
            Une erreur s&apos;est produite lors de l&apos;envoi du code.
            Veuillez réessayer.
          </p>
        )}
      </div>
    </div>
  );
};

export default OtpContent;
