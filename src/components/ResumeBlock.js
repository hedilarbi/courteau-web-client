import React from "react";

const ResumeBlock = ({
  subTotal,
  tvq,
  tps,
  deliveryFee,
  tips,
  subTotalWithDiscount,
  firstOrderDiscountApplied,
  promoCodeData,
  promoCodeIsValid,
  total,
  deliveryMode,
}) => {
  return (
    <div className="rounded-md bg-white p-6 shadow-md mt-4 w-full">
      <h2 className="font-inter font-semibold text-black md:text-xl text-base">
        Récapitulatif de la commande
      </h2>
      <div className="mt-4 space-y-2 font-semibold font-inter">
        <div className="flex justify-between">
          <span className="font-inter text-gray-700">Sous-total</span>
          <span className="font-inter font-semibold text-gray-900">
            ${subTotal.toFixed(2)}
          </span>
        </div>
        {!firstOrderDiscountApplied && (
          <div className="flex justify-between">
            <span className="font-inter text-gray-700">
              Remise 1 ère commande (20%)
            </span>
            <span className="font-inter font-semibold text-gray-900">
              -${(subTotal * 0.2).toFixed(2)}
            </span>
          </div>
        )}

        {!firstOrderDiscountApplied && (
          <div className="flex justify-between">
            <span className="font-inter text-gray-700">
              Sous total après remise
            </span>
            <span className="font-inter font-semibold text-gray-900">
              ${subTotalWithDiscount.toFixed(2)}
            </span>
          </div>
        )}
        {promoCodeData && promoCodeIsValid && (
          <div className="flex justify-between">
            <span className="font-inter text-gray-700">
              Code promo (
              {promoCodeData.type === "percent"
                ? "-" + promoCodeData.percent + "%"
                : promoCodeData.type === "amount"
                ? "-" + promoCodeData.amount + "$"
                : promoCodeData.type === "free_item"
                ? promoCodeData.freeItem.name
                : ""}
              ){" "}
            </span>
            <span className="font-inter font-semibold text-gray-900">
              {promoCodeData.type === "percent"
                ? "-$" + ((promoCodeData.percent / 100) * subTotal).toFixed(2)
                : promoCodeData.type === "amount"
                ? "-$" + promoCodeData.amount.toFixed(2)
                : promoCodeData.type === "free_item"
                ? "Offert"
                : ""}
            </span>
          </div>
        )}
        {deliveryMode === "delivery" && (
          <div className="flex justify-between">
            <span className="font-inter text-gray-700">Frais de livraison</span>
            <span className="font-inter font-semibold text-gray-900">
              ${deliveryFee.toFixed(2)}
            </span>
          </div>
        )}
        {tips > 0 && (
          <div className="flex justify-between">
            <span className="font-inter text-gray-700">Pourboire</span>
            <span className="font-inter font-semibold text-gray-900">
              ${tips.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="font-inter text-gray-700">TVQ (9.975%)</span>
          <span className="font-inter font-semibold text-gray-900">
            ${tvq.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between border-b pb-2 border-gray-300">
          <span className="font-inter text-gray-700">TPS (5%)</span>
          <span className="font-inter font-semibold text-gray-900">
            ${tps.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-inter text-gray-700">Total</span>
          <span className="font-inter font-semibold text-gray-900">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResumeBlock;
