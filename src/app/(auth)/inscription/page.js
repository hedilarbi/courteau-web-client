"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner/Spinner";
import Image from "next/image";
import { sendSmsVerification } from "@/services/Verify";

export default function ConnexionPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const phoneNumberInput = useRef(null);

  const sendOtp = async () => {
    try {
      if (phoneNumber.length <= 0) {
        phoneNumberInput.current.setNativeProps({
          style: {
            borderColor: "red",
            borderWidth: 2,
          },
        });
        return null;
      }
      setError("");
      setIsLoading(true);

      const formattedValue = "+1" + phoneNumber;

      //   if (phoneNumber === "8196929494") {
      //     router.push(`/otp?phoneNumber=${phoneNumber}`);
      //   } else {
      //     sendSmsVerification(formattedValue)
      //       .then((sent) => {
      //         if (!sent) {
      //           setError("Erreur lors de l'envoi du code de vérification");
      //           setIsLoading(false);
      //           return;
      //         }
      //         router.push(`/otp?phoneNumber=${phoneNumber}`);
      //       })
      //       .then(() => setIsLoading(false))
      //       .catch((err) => {
      //         setIsLoading(false);
      //       });
      //   }

      setIsLoading(false);
      navigation.navigate("otp", { phoneNumber: formattedValue });
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
          src="/logo.svg"
          alt="Logo"
          className="h-48 w-auto"
          width={1920}
          height={1080}
        />
      </div>
      <div className="flex justify-center md:hidden bg-black py-14">
        <Image
          src="/logo.svg"
          alt="Logo"
          className=""
          width={300}
          height={150}
        />
      </div>
      <div className="flex items-center p-8 rounded   flex-1">
        <div className="w-full">
          <h1 className="md:text-4xl text-3xl font-bold mb-4 font-bebas-neue text-left">
            S&apos;inscrire
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

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            onClick={sendOtp}
            className="w-full bg-pr  text-black py-2 px-4 rounded font-bebas-neue text-2xl cursor-pointer"
          >
            S&apos;inscrire
          </button>
          <p className="mt-4 text-sm text-gray-600 text-center">
            En vous inscrivant, vous acceptez nos{" "}
            <span
              className="text-pr cursor-pointer"
              onClick={() => router.push("/termes-conditions")}
            >
              Conditions d&apos;utilisation
            </span>{" "}
            .
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
