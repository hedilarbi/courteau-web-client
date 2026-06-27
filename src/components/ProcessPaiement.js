import React, { useState } from "react";
import CheckoutCard from "./CheckoutCard";
import { FaCircleInfo } from "react-icons/fa6";
import { FaStore } from "react-icons/fa6";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

const ProcessPaiement = ({
  user,
  total,
  selectedRestaurant,
  address,
  deliveryMode,
  paymentMethod,
  setPaymentMethod,
  tipAmount,
  promoCode,
  subTotal,
  subTotalWithDiscount,
  canOrder,
  isBasketAvailable = true,
  isScheduledOrder,
  scheduledDateTime,
  subscriptionBenefits,
  birthdayBenefits,
  orderDiscountPercent,
  effectiveDeliveryFee,
  referralDiscountApplied,
  isZeroTotalSubscriptionOrder,
  isZeroTotalReferralOrder,
  setPromoCodeData,
  setPromoCodeIsValid,
  setPromoCodeError,
  onChangeRestaurant,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [processPaiement, setProcessPaiement] = useState(false);

  const restaurantName = selectedRestaurant?.name || "ce restaurant";

  const handleConfirm = () => {
    setShowConfirmModal(false);
    setProcessPaiement(true);
  };

  const handleChangeRestaurant = () => {
    setShowConfirmModal(false);
    if (onChangeRestaurant) {
      onChangeRestaurant();
    }
  };

  if (!processPaiement) {
    return (
      <>
        <div className="rounded-md bg-white p-6 shadow-md mt-4 w-full">
          <button
            className="bg-pr text-black font-bebas-neue text-xl px-4 py-3 rounded-md mt-6 w-full cursor-pointer"
            onClick={() => setShowConfirmModal(true)}
          >
            Procéder au paiement
          </button>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="bg-[#FEF3C7] rounded-full p-4">
                  <FaStore size={28} color="#F7A600" />
                </div>
              </div>

              {/* Title */}
              <h2 className="font-inter font-bold text-black text-center text-xl mb-3">
                Confirmer votre commande
              </h2>

              {/* Message */}
              <p className="font-inter text-[#374151] text-center text-sm leading-relaxed mb-7">
                Confirmez-vous que vous souhaitez passer cette commande à la
                succursale{" "}
                <span className="font-semibold text-black">{restaurantName}</span>
                {" ?"}
              </p>

              {/* Confirm button */}
              <button
                className="w-full bg-pr text-black font-inter font-semibold text-base py-3 rounded-full cursor-pointer hover:bg-[#e69500] transition mb-3"
                onClick={handleConfirm}
              >
                Oui, confirmer
              </button>

              {/* Change restaurant button */}
              <button
                className="w-full border-2 border-pr text-pr font-inter font-semibold text-base py-3 rounded-full cursor-pointer hover:bg-[#FEF3C7] transition"
                onClick={handleChangeRestaurant}
              >
                Non, changer de succursale
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  const amountCents = Math.trunc(Number(total || 0) * 100);
  const hasValidAmount = amountCents > 0;

  return (
    <div className="rounded-md bg-white p-6 shadow-md mt-4 w-full">
      <h2 className="font-inter font-semibold text-black md:text-xl text-base">
        Paiement
      </h2>
      {paymentMethod === "card" ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 mt-2 rounded-md flex items-center gap-2">
          <FaCircleInfo color="#F7A600" size={42} />
          <p className="text-[#7a5d00] font-inter text-sm">
            Nous n&apos;acceptons pas les cartes cadeaux pour le paiement.
          </p>
        </div>
      ) : null}
      {hasValidAmount ? (
        <Elements
          stripe={stripePromise}
          options={{
            mode: "payment",
            currency: "cad",
            amount: amountCents, // amount in cents (Stripe requires > 0)
            locale: "fr",
          }}
        >
          <CheckoutCard
            user={user}
            total={total}
            selectedRestaurant={selectedRestaurant}
            address={address}
            deliveryMode={deliveryMode}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            tipAmount={tipAmount}
            promoCode={promoCode}
            subscriptionBenefits={subscriptionBenefits}
            birthdayBenefits={birthdayBenefits}
            orderDiscountPercent={orderDiscountPercent}
            effectiveDeliveryFee={effectiveDeliveryFee}
            referralDiscountApplied={referralDiscountApplied}
            isZeroTotalSubscriptionOrder={isZeroTotalSubscriptionOrder}
            isZeroTotalReferralOrder={isZeroTotalReferralOrder}
            setPromoCodeData={setPromoCodeData}
            setPromoCodeIsValid={setPromoCodeIsValid}
            setPromoCodeError={setPromoCodeError}
            subTotal={subTotal}
            subTotalWithDiscount={subTotalWithDiscount}
            canOrder={canOrder}
            isBasketAvailable={isBasketAvailable}
            isScheduledOrder={isScheduledOrder}
            scheduledDateTime={scheduledDateTime}
          />
        </Elements>
      ) : (
        <CheckoutCard
          user={user}
          total={total}
          selectedRestaurant={selectedRestaurant}
          address={address}
          deliveryMode={deliveryMode}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          tipAmount={tipAmount}
          promoCode={promoCode}
          subscriptionBenefits={subscriptionBenefits}
          birthdayBenefits={birthdayBenefits}
          orderDiscountPercent={orderDiscountPercent}
          effectiveDeliveryFee={effectiveDeliveryFee}
          referralDiscountApplied={referralDiscountApplied}
          isZeroTotalSubscriptionOrder={isZeroTotalSubscriptionOrder}
          isZeroTotalReferralOrder={isZeroTotalReferralOrder}
          setPromoCodeData={setPromoCodeData}
          setPromoCodeIsValid={setPromoCodeIsValid}
          setPromoCodeError={setPromoCodeError}
          subTotal={subTotal}
          subTotalWithDiscount={subTotalWithDiscount}
          canOrder={canOrder}
          isBasketAvailable={isBasketAvailable}
          isScheduledOrder={isScheduledOrder}
          scheduledDateTime={scheduledDateTime}
        />
      )}
    </div>
  );
};

export default ProcessPaiement;
