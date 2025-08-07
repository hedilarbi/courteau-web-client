import React from "react";

import { MdOutlineRestaurantMenu, MdDeliveryDining } from "react-icons/md";
import { GiTrophyCup } from "react-icons/gi";

const OrderOnlineSection = () => {
  return (
    <div className="md:py-16 md:px-14 px-4 py-8 bg-black">
      <h2 className="font-bebas-neue md:text-5xl text-2xl text-white text-center ">
        commandez en ligne facilement
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 md:gap-16 gap-12 md:mt-12 mt-8">
        <div className="flex flex-col">
          <div className="bg-[#312107] rounded-full h-16 w-16 text-pr flex justify-center items-center mx-auto">
            <MdOutlineRestaurantMenu size={36} />
          </div>
          <h3 className="font-inter font-bold md:text-xl text-base  mt-5 text-center text-white">
            Menu Complet
          </h3>
          <p className="font-inter font-semibold md:text-base text-sm text-center mt-2 text-[#D1D5DB]">
            Découvrez notre menu complet avec descriptions détaillées et photos
            appétissantes.
          </p>
        </div>
        <div className="flex flex-col">
          <div className="bg-[#312107] rounded-full h-16 w-16 text-pr flex justify-center items-center mx-auto">
            <MdDeliveryDining size={36} />
          </div>
          <h3 className="font-inter font-bold md:text-xl text-base mt-5 text-center text-white">
            Livraison Rapide
          </h3>
          <p className="font-inter font-semibold md:text-base text-sm text-center mt-2 text-[#D1D5DB]">
            Recevez votre commande chaude et délicieuse avec notre service de
            livraison rapide.
          </p>
        </div>
        <div className="flex flex-col">
          <div className="bg-[#312107] rounded-full h-16 w-16 text-pr flex justify-center items-center mx-auto">
            <GiTrophyCup size={36} />
          </div>
          <h3 className="font-inter font-bold md:text-xl text-base mt-5 text-center text-white">
            Programme Fidélité
          </h3>
          <p className="font-inter font-semibold md:text-base text-sm text-center mt-2 text-[#D1D5DB]">
            Gagnez des points à chaque commande et échangez-les contre des
            récompenses.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderOnlineSection;
