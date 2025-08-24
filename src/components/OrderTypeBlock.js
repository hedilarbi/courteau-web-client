import React from "react";
import { FaStore } from "react-icons/fa6";
import { MdDeliveryDining } from "react-icons/md";

const OrderTypeBlock = ({ deliveryMode, setDeliveryMode }) => {
  return (
    <div className="rounded-md bg-white p-6 shadow-md  ">
      <h2 className="font-inter font-semibold text-black md:text-xl text-base">
        Type de commande
      </h2>
      <div className="flex  items-stretch gap-4 mt-4">
        <button
          onClick={() => setDeliveryMode("delivery")}
          className={` py-6 flex justify-center cursor-pointer items-center border-2 text-black rounded-md flex-1 ${
            deliveryMode === "delivery"
              ? "bg-[#F7A700]/20 border-pr "
              : "bg-[#FFFFFF] border-[#E5E7EB]"
          }`}
        >
          <div className="flex flex-col items-center text-2xl md:text-4xl">
            <MdDeliveryDining />
            <p className="font-inter font-semibold md:text-base text-sm text-center">
              Livraison
            </p>
            <p className="font-inter font-medium md:text-sm text-xs text-[#6B7280] text-center mt-1">
              30-45 minutes
            </p>
          </div>
        </button>
        <button
          onClick={() => setDeliveryMode("pickup")}
          className={`py-6 flex justify-center cursor-pointer items-center border-2 text-black rounded-md flex-1 ${
            deliveryMode === "pickup"
              ? "bg-[#F7A700]/20 border-pr "
              : "bg-[#FFFFFF] border-[#E5E7EB]"
          }`}
        >
          <div className="flex flex-col items-center text-2xl md:text-4xl">
            <FaStore />
            <p className="font-inter font-semibold md:text-base text-sm text-center">
              Ramassage
            </p>
            <p className="font-inter font-medium md:text-sm text-xs text-[#6B7280] text-center mt-1">
              Prêt dans 15-20 minutes
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default OrderTypeBlock;
