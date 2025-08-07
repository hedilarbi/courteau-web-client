import React from "react";

import { MdOutlineRestaurantMenu, MdDeliveryDining } from "react-icons/md";
import { GiTrophyCup } from "react-icons/gi";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import Link from "next/link";

const GetAppSection = () => {
  return (
    <div className="md:py-16 md:px-14 px-4 py-8 bg-pr md:mb-30 mb-10">
      <h2 className="font-bebas-neue md:text-5xl text-2xl text-white text-center ">
        prêt à commander?
      </h2>
      <p className="font-inter md:text-2xl font-semibold text-sm text-center  text-white mt-4 md:px-40 px-0">
        Téléchargez notre application ou commandez directement en ligne pour
        savourer nos délicieuses spécialités.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 md:gap-16 gap-6 md:mt-12 mt-8">
        <a
          href="#"
          className="bg-white flex justify-center items-center px-12 py-3 rounded-md"
        >
          <FaApple />{" "}
          <span className="font-inter font-semibold text-base ml-2">
            App store
          </span>
        </a>
        <a
          href="#"
          className="bg-white flex justify-center items-center px-12 py-3 rounded-md"
        >
          <FaGooglePlay />{" "}
          <span className="font-inter font-semibold text-base ml-2">
            Google play
          </span>
        </a>

        <Link
          href="/menu"
          className="font-inter font-semibold text-base  bg-black text-white flex justify-center items-center px-12 py-2 rounded-md"
        >
          Commander en ligne
        </Link>
      </div>
    </div>
  );
};

export default GetAppSection;
