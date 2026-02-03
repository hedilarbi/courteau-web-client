import { useUser } from "@/context/UserContext";
import { addToAddresses } from "@/services/UserServices";
import { getClosestRestaurant } from "@/utils/locationHandlers";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";
const AddAddressModal = ({
  setShowAddAddressModal,
  setAddress,
  userId,
  setSelectedRestaurant,
  restaurantsSettings,
}) => {
  const [newAddress, setNewAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { updateUser } = useUser();

  // Function to geocode address using Google Maps API
  const geocodeAddress = async (address) => {
    try {
      setIsLoading(true);
      setError("");

      // Replace with your actual Google Maps API key
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        throw new Error("La clé API Google Maps n'est pas configurée.");
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address,
        )}&key=${apiKey}`,
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP (statut ${response.status}).`);
      }

      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        const { lat, lng } = result.geometry.location;
        const formattedAddress = result.formatted_address;

        if (!isFinite(lat) || !isFinite(lng)) {
          throw new Error(
            "Adresse introuvable ou incomplète. Veuillez préciser votre adresse.",
          );
        }

        return {
          address: newAddress,
          coords: { latitude: lat, longitude: lng },
        };
      } else if (data.status === "ZERO_RESULTS") {
        throw new Error("Aucun résultat pour cette adresse.");
      } else {
        throw new Error(`Échec du géocodage : ${data.status}`);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.trim()) {
      setError("Veuillez entrer une adresse valide.");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const geocodedAddress = await geocodeAddress(newAddress);
      const response = await addToAddresses(
        userId,
        geocodedAddress.address,
        geocodedAddress.coords,
      );

      if (response.status) {
        const restaurantIndex = getClosestRestaurant(
          geocodedAddress.coords,
          restaurantsSettings,
        );

        const closestRestaurant = restaurantsSettings[restaurantIndex];

        setSelectedRestaurant(closestRestaurant);
        setAddress({
          address: geocodedAddress.address,
          coords: geocodedAddress.coords,
        });
        updateUser(response.data);
        setIsLoading(false);
        setShowAddAddressModal(false);
      }
    } catch (error) {
      setIsLoading(false);
      setError(error.message || "Impossible de valider l'adresse.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50  z-50">
      <div className="bg-white p-6 rounded-md shadow-md w-11/12 max-w-md">
        <div className="flex justify-end">
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setShowAddAddressModal(false)}
            disabled={isLoading}
          >
            <IoMdClose size={32} />
          </button>
        </div>
        <h2 className="font-inter font-semibold text-black md:text-xl text-base ">
          Ajouter une adresse
        </h2>

        <input
          type="text"
          className="mt-2 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-pr"
          placeholder="Entrez votre nouvelle adresse complète"
          value={newAddress}
          onChange={(e) => {
            setNewAddress(e.target.value);
            setError(""); // Clear error when user types
          }}
          disabled={isLoading}
        />

        <p className="mt-2 text-sm text-gray-500">
          Ex: 123 Rue Example, Ville, Code Postal
        </p>
        {error && (
          <div className="mt-4 p-2 bg-red-100 text-red-500 rounded-md text-sm">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Validation de l&apos;adresse...
            </p>
          </div>
        )}

        <div className="flex justify-end mt-6 gap-2">
          <button
            className="px-4 py-2 bg-pr text-black rounded-md hover:bg-[#e69500] transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddAddress}
            disabled={isLoading}
          >
            {isLoading ? "Chargement..." : "Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAddressModal;
