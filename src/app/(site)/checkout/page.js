import CheckoutContent from "@/components/CheckoutContent";
import React from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "https://api.lecourteau.com/api";

const page = async () => {
  const response = await fetch(`${API_URL}/restaurants/settings`, {
    cache: "no-store",
  });
  const restaurantsSettings = await response.json();

  if (!restaurantsSettings) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-medium text-gray-700">
          Impossible de charger les paramètres du restaurant.
        </p>
      </div>
    );
  }

  return <CheckoutContent restaurantsSettings={restaurantsSettings} />;
};

export default page;
