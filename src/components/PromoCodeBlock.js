import { verifyPromoCode } from "@/services/FoodServices";
import React, { useState } from "react";

const PromoCodeBlock = ({
  userId,
  promoCodeData,
  setPromoCodeData,
  promoCodeIsValid,
  setPromoCodeIsValid,
  firstOrderDiscountApplied,
}) => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [promoCodeError, setPromoCodeError] = useState(null);
  const handleVerifyPromoCode = async () => {
    try {
      setIsLoading(true);
      setPromoCodeError(null);
      setPromoCodeIsValid(false);
      if (firstOrderDiscountApplied) {
        setPromoCodeError("Une autre réduction est déjà appliquée.");
        return;
      }
      const response = await verifyPromoCode(code, userId);

      if (response.status) {
        if (
          response.data.type === "amount" &&
          response.data.amount > subTotalWithDiscount
        ) {
          setPromoCodeError(
            "Le montant du code promo ne peut pas être supérieur au total de la commande."
          );
          setPromoCodeIsValid(false);
          return;
        }
        setPromoCodeIsValid(true);
        setPromoCodeData(response.data);
      } else {
        setPromoCodeIsValid(false);
        setPromoCodeError(response.message);
      }
    } catch (error) {
      console.error(error);
      setPromoCodeIsValid(false);
      setPromoCodeError("Erreur lors de la vérification du code promo.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="rounded-md bg-white p-6 shadow-md mt-4 w-full">
      <h2 className="font-inter font-semibold text-black md:text-xl text-base">
        Code Promo
      </h2>
      <div className="flex items-center gap-2 mt-4 w-full">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="COURTEAU2024"
          className=" border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pr flex-1"
        />
        <button
          onClick={handleVerifyPromoCode}
          className="bg-pr text-black px-4 py-2 rounded-md hover:bg-pr/90 transition font-semibold  "
        >
          {isLoading ? "Vérification..." : "Appliquer"}
        </button>
      </div>
      {promoCodeError && (
        <p className="text-red-500 text-sm mt-2">{promoCodeError}</p>
      )}
      {promoCodeIsValid && (
        <p className="text-green-500 text-sm mt-2">
          Code promo appliqué:{" "}
          {promoCodeData.type === "percent" &&
            "Remise de " + promoCodeData.percent + "%"}
          {promoCodeData.type === "amount" &&
            "Remise de " + promoCodeData.amount + "$"}{" "}
          {promoCodeData.type === "free_item" &&
            promoCodeData.freeItem.name + " offert"}
        </p>
      )}
    </div>
  );
};

export default PromoCodeBlock;
