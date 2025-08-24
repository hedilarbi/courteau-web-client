import CheckoutContent from "@/components/CheckoutContent";
import React from "react";

const page = async () => {
  const response = await fetch(`${process.env.API_URL}/restaurants/settings`);
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
