"use client";
import { getCategories, getOffers, getVedettes } from "@/services/FoodServices";
import React, { useEffect, useState } from "react";
import Spinner from "./spinner/Spinner";
import Image from "next/image";

const OffresSectionContent = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const responnse = await getOffers();
      if (responnse.status) {
        setItems(responnse.data);
      }
    } catch (err) {
      setError(
        "Une erreur s'est produite lors de la récupération des données."
      );
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  if (isLoading) {
    return (
      <div className="h-36 flex items-center justify-center mt-8">
        <Spinner />
      </div>
    );
  }
  return (
    <div className="mt-8 overflow-x-auto ">
      <div className="flex gap-4">
        {items.map((item) => (
          <div
            key={item._id}
            className="relative md:h-48 md:w-72 h-20 w-28 flex-none rounded-md"
          >
            <div className="absolute inset-0 bg-black/35 rounded-md flex-none h-full z-10" />
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover rounded-md"
            />
            <p className="absolute bottom-2 left-4 z-20 md:text-2xl text-xs  text-white font-bebas-neue">
              {item.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OffresSectionContent;
