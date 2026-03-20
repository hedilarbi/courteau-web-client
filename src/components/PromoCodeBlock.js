import { verifyPromoCode } from "@/services/FoodServices";
import React, { useState } from "react";

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundMoney = (value, fallback = 0) => {
  const normalized = toSafeNumber(value, fallback);
  return Math.round(normalized * 100) / 100;
};

const getPromoCategoryId = (promoCode) =>
  String(promoCode?.category?._id || promoCode?.category || "").trim();

const getPromoCategoryName = (promoCode) =>
  String(promoCode?.category?.name || "").trim();

const getBasketItemCategoryId = (basketItem) =>
  String(basketItem?.category?._id || basketItem?.category || "").trim();

const PromoCodeBlock = ({
  userId,
  basketItems,
  promoCodeData,
  setPromoCodeData,
  promoCodeIsValid,
  setPromoCodeIsValid,
  firstOrderDiscountAllowed,
  promoCodeAllowed,
  subTotal,
}) => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [promoCodeError, setPromoCodeError] = useState(null);
  const handleVerifyPromoCode = async () => {
    try {
      setIsLoading(true);
      setPromoCodeError(null);
      setPromoCodeIsValid(false);

      if (!promoCodeAllowed) {
        setPromoCodeError(
          "Un abonnement actif est déjà appliqué. Les codes promo ne sont pas cumulables."
        );
        return;
      }

      if (firstOrderDiscountAllowed) {
        setPromoCodeError("Une autre réduction est déjà appliquée.");
        return;
      }

      const response = await verifyPromoCode(code, userId);

      if (response.status) {
        const promoCategoryId = getPromoCategoryId(response.data);
        const eligibleSubtotal = promoCategoryId
          ? roundMoney(
              (basketItems || []).reduce((sum, item) => {
                if (getBasketItemCategoryId(item) !== promoCategoryId) {
                  return sum;
                }

                return sum + toSafeNumber(item?.price, 0);
              }, 0),
              0
            )
          : roundMoney(subTotal, 0);

        if (
          (response.data.type === "amount" || response.data.type === "percent") &&
          eligibleSubtotal <= 0
        ) {
          setPromoCodeError(
            "Ce code promo ne s'applique à aucun article de votre panier."
          );
          setPromoCodeIsValid(false);
          return;
        }

        if (
          response.data.type === "amount" &&
          response.data.amount > eligibleSubtotal
        ) {
          setPromoCodeError(
            "Le montant du code promo ne peut pas être supérieur au total des articles éligibles."
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
      {!promoCodeAllowed && (
        <p className="text-sm font-inter text-[#6B7280] mt-2">
          Un abonnement actif est déjà appliqué. Les codes promo ne sont pas
          cumulables.
        </p>
      )}
      <div className="flex items-center gap-2 mt-4 w-full">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="COURTEAU2024"
          className=" border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pr flex-1"
          disabled={!promoCodeAllowed}
        />
        {promoCodeIsValid ? (
          <button
            onClick={() => {
              setPromoCodeIsValid(false);
              setPromoCodeData(null);
              setCode("");
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-500/90 transition font-semibold  "
          >
            Annuler
          </button>
        ) : (
          <button
            onClick={handleVerifyPromoCode}
            disabled={isLoading || !promoCodeAllowed}
            className="bg-pr text-black px-4 py-2 rounded-md hover:bg-pr/90 transition font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? "Vérification..." : "Appliquer"}
          </button>
        )}
      </div>
      {promoCodeError && (
        <p className="text-red-500 text-sm mt-2">{promoCodeError}</p>
      )}
      {promoCodeIsValid && (
        <p className="text-green-500 text-sm mt-2">
          Code promo appliqué:{" "}
          {promoCodeData.type === "percent" &&
            "Remise de " +
              promoCodeData.percent +
              "%" +
              (getPromoCategoryName(promoCodeData)
                ? ` sur ${getPromoCategoryName(promoCodeData)}`
                : "")}
          {promoCodeData.type === "amount" &&
            "Remise de " +
              promoCodeData.amount +
              "$" +
              (getPromoCategoryName(promoCodeData)
                ? ` sur ${getPromoCategoryName(promoCodeData)}`
                : "")}{" "}
          {promoCodeData.type === "free_item" &&
            (promoCodeData?.freeItem?.name || "Article") + " offert"}
        </p>
      )}
    </div>
  );
};

export default PromoCodeBlock;
