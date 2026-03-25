import React, { useState } from "react";
import CheckoutCard from "./CheckoutCard";
import { FaCircleInfo } from "react-icons/fa6";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

const ProcessPaiement = ({
  user,
  total,
  selectedRestaurant,
  address,
  deliveryMode,
  tipAmount,
  promoCode,
  subTotal,
  subTotalWithDiscount,
  canOrder,
  isScheduledOrder,
  scheduledDateTime,
  subscriptionBenefits,
  birthdayBenefits,
  orderDiscountPercent,
  effectiveDeliveryFee,
  isZeroTotalSubscriptionOrder,
  setPromoCodeData,
  setPromoCodeIsValid,
  setPromoCodeError,
}) => {
  const [processPaiement, setProcessPaiement] = useState(false);

  if (!processPaiement) {
    return (
      <div className="rounded-md bg-white p-6 shadow-md mt-4 w-full">
        <button
          className="bg-pr text-black font-bebas-neue text-xl px-4 py-3 rounded-md mt-6 w-full cursor-pointer"
          onClick={() => setProcessPaiement(true)}
        >
          Procéder au paiement
        </button>
      </div>
    );
  }
  const amountCents = Math.trunc(Number(total || 0) * 100);
  const hasValidAmount = amountCents > 0;

  return (
    <div className="rounded-md bg-white p-6 shadow-md mt-4 w-full">
      <h2 className="font-inter font-semibold text-black md:text-xl text-base">
        Paiement
      </h2>
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 mt-2 rounded-md flex items-center gap-2">
        <FaCircleInfo color="#F7A600" size={42} />
        <p className="text-[#7a5d00] font-inter text-sm">
          Nous n&apos;acceptons pas les cartes cadeaux pour le paiement.
        </p>
      </div>
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
            tipAmount={tipAmount}
            promoCode={promoCode}
            subscriptionBenefits={subscriptionBenefits}
            birthdayBenefits={birthdayBenefits}
            orderDiscountPercent={orderDiscountPercent}
            effectiveDeliveryFee={effectiveDeliveryFee}
            isZeroTotalSubscriptionOrder={isZeroTotalSubscriptionOrder}
            setPromoCodeData={setPromoCodeData}
            setPromoCodeIsValid={setPromoCodeIsValid}
            setPromoCodeError={setPromoCodeError}
            subTotal={subTotal}
            subTotalWithDiscount={subTotalWithDiscount}
            canOrder={canOrder}
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
          tipAmount={tipAmount}
          promoCode={promoCode}
          subscriptionBenefits={subscriptionBenefits}
          birthdayBenefits={birthdayBenefits}
          orderDiscountPercent={orderDiscountPercent}
          effectiveDeliveryFee={effectiveDeliveryFee}
          isZeroTotalSubscriptionOrder={isZeroTotalSubscriptionOrder}
          setPromoCodeData={setPromoCodeData}
          setPromoCodeIsValid={setPromoCodeIsValid}
          setPromoCodeError={setPromoCodeError}
          subTotal={subTotal}
          subTotalWithDiscount={subTotalWithDiscount}
          canOrder={canOrder}
          isScheduledOrder={isScheduledOrder}
          scheduledDateTime={scheduledDateTime}
        />
      )}
    </div>
  );
};

export default ProcessPaiement;
