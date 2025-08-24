"use client";
import { useSelectBasketItemCount } from "@/context/BasketContext";
import React from "react";
import { FaCartShopping } from "react-icons/fa6";
import BasketSlider from "./BasketSlider";
import { usePathname } from "next/navigation";

const CartButton = () => {
  const [showBasketSlider, setShowBasketSlider] = React.useState(false);
  const count = useSelectBasketItemCount(); // Assuming this hook is defined in your context
  const pathname = usePathname();
  const isCheckoutPage = pathname.includes("/checkout");

  if (isCheckoutPage) {
    return null; // Don't render the button on the checkout page
  }
  return (
    <div className="md:hidden fixed bottom-4 right-4 z-20">
      <BasketSlider
        setShowBasketSlider={setShowBasketSlider}
        showBasketSlider={showBasketSlider}
      />
      <button
        onClick={() => setShowBasketSlider(!showBasketSlider)}
        className="bg-pr rounded-full text-black flex justify-center cursor-pointer items-center h-14 w-14 ml-6 p-2 relative "
      >
        <FaCartShopping size={24} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {count}
          </span>
        )}
      </button>
    </div>
  );
};

export default CartButton;
