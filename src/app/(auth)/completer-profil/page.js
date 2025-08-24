"use client";
import Spinner from "@/components/spinner/Spinner";
import { useUser } from "@/context/UserContext";
import { setUserInfo } from "@/services/UserServices";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const Page = () => {
  const { user, loading, createUser } = useUser();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dob: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Redirect must happen in an effect, not during render
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/connexion");
    }
  }, [loading, user, router]);

  // Keep geocoding side-effect free; let submit handler manage loading/errors
  const geocodeAddress = async (address) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) throw new Error("Google Maps API key is not configured");

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { coords: { latitude: lat, longitude: lng } };
    }
    if (data.status === "ZERO_RESULTS") {
      throw new Error("No results found for this address");
    }
    throw new Error(`Geocoding failed: ${data.status}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.dob ||
      !formData.address
    ) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Veuillez entrer une adresse courriel valide.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const { coords } = await geocodeAddress(formData.address);

      const response = await setUserInfo(
        user._id,
        formData.name,
        formData.email,
        formData.address,
        coords,
        formData.dob
      );

      if (response.status) {
        createUser(response.data); // event-handler: safe
        router.push("/"); // event-handler: safe
        return;
      }

      setError("Erreur lors de la mise à jour des informations utilisateur.");
    } catch (err) {
      setError(
        err?.message || "Erreur lors de la géocodification de l'adresse."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // While loading user OR while the redirect effect will run, show a spinner
  if (loading || (!user && !loading)) {
    return (
      <div className="h-screen flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Compléter le profil</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1" htmlFor="name">
            Prénom et nom
          </label>
          <input
            id="name"
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pr"
            placeholder="Votre prénom et nom"
            value={formData.name}
            onChange={(e) =>
              setFormData((s) => ({ ...s, name: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1" htmlFor="email">
            Courriel
          </label>
          <input
            id="email"
            type="email"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pr"
            placeholder="Votre courriel"
            value={formData.email}
            onChange={(e) =>
              setFormData((s) => ({ ...s, email: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1" htmlFor="dob">
            Date de naissance
          </label>
          <input
            id="dob"
            type="date"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pr"
            value={formData.dob}
            onChange={(e) =>
              setFormData((s) => ({ ...s, dob: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1" htmlFor="address">
            Adresse
          </label>
          <input
            id="address"
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pr"
            placeholder="123 Rue Principale, Ville, Province"
            value={formData.address}
            onChange={(e) =>
              setFormData((s) => ({ ...s, address: e.target.value }))
            }
          />
        </div>

        <button
          type="button"
          className="w-full bg-pr text-black py-2 rounded transition md:text-2xl text-lg font-bebas-neue"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Soumission..." : "Soumettre"}
        </button>
      </div>
    </div>
  );
};

export default Page;
