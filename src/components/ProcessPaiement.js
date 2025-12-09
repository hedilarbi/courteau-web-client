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
  tvq,
  tps,
  canOrder,
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
            subTotal={subTotal}
            subTotalWithDiscount={subTotalWithDiscount}
            tvq={tvq}
            tps={tps}
            canOrder={canOrder}
          />
        </Elements>
      ) : (
        <div className="mt-4 text-sm text-gray-600 font-inter">
          Calcul du total en cours...
        </div>
      )}
    </div>
  );
};

export default ProcessPaiement;
