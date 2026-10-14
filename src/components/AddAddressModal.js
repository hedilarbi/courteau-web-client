import { useUser } from "@/context/UserContext";
import { addToAddresses } from "@/services/UserServices";
import { getClosestRestaurant } from "@/utils/locationHandlers";
import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";

const ADDRESS_FIELDS = [
  {
    name: "street_address",
    label: "Adresse",
    placeholder: "123 rue Exemple",
    autoComplete: "address-line1",
  },
  {
    name: "city",
    label: "Ville",
    placeholder: "Trois-Rivières",
    autoComplete: "address-level2",
  },
  {
    name: "state",
    label: "Province",
    placeholder: "Québec",
    autoComplete: "address-level1",
  },
  {
    name: "postal_code",
    label: "Code postal",
    placeholder: "G9A 1A1",
    autoComplete: "postal-code",
  },
];

const EMPTY_FORM = { street_address: "", city: "", state: "", postal_code: "" };

const AddAddressModal = ({
  setShowAddAddressModal,
  setAddress,
  userId,
  setSelectedRestaurant,
  restaurantsSettings,
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [missingFields, setMissingFields] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { updateUser } = useUser();

  const getAddressComponent = (components = [], type, format = "long_name") =>
    components.find((component) => component.types?.includes(type))?.[format] ||
    "";

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

        if (!isFinite(lat) || !isFinite(lng)) {
          throw new Error(
            "Adresse introuvable ou incomplète. Veuillez préciser votre adresse.",
          );
        }

        return {
          coords: { latitude: lat, longitude: lng },
          country: getAddressComponent(
            result.address_components,
            "country",
            "short_name",
          ),
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

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setMissingFields((prev) => prev.filter((field) => field !== name));
    setError("");
  };

  const handleAddAddress = async () => {
    const fields = {
      street_address: form.street_address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postal_code: form.postal_code.trim().toUpperCase(),
    };
    const missing = Object.keys(fields).filter((name) => !fields[name]);
    if (missing.length > 0) {
      setMissingFields(missing);
      setError("Veuillez remplir tous les champs de l'adresse.");
      return;
    }

    // Adresse finale : « rue, ville, province, code postal ».
    const finalAddress = [
      fields.street_address,
      fields.city,
      fields.state,
      fields.postal_code,
    ].join(", ");

    setIsLoading(true);
    setError("");

    try {
      const { coords, country } = await geocodeAddress(finalAddress);
      const newAddress = {
        address: finalAddress,
        coords,
        ...fields,
        country,
      };
      const response = await addToAddresses(userId, finalAddress, coords, {
        ...fields,
        country,
      });

      if (response.status) {
        const restaurantIndex = getClosestRestaurant(
          coords,
          restaurantsSettings,
        );

        const closestRestaurant = restaurantsSettings[restaurantIndex];

        if (closestRestaurant) {
          setSelectedRestaurant(closestRestaurant);
        }
        const savedAddress = [...(response.data?.addresses || [])]
          .reverse()
          .find(
            (entry) => String(entry?.address || "").trim() === finalAddress,
          );
        setAddress(savedAddress || newAddress);
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

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleAddAddress();
          }}
          noValidate
        >
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ADDRESS_FIELDS.map((field) => (
              <label
                key={field.name}
                className={`block font-inter text-sm font-medium text-black ${
                  field.name === "street_address" ? "sm:col-span-2" : ""
                }`}
              >
                {field.label}
                <input
                  type="text"
                  name={field.name}
                  className={`mt-1 w-full border rounded-md p-2 font-normal focus:outline-none focus:ring-2 focus:ring-pr ${
                    missingFields.includes(field.name)
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  value={form[field.name]}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  disabled={isLoading}
                />
              </label>
            ))}
          </div>

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
              type="submit"
              className="px-4 py-2 bg-pr text-black rounded-md hover:bg-[#e69500] transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? "Chargement..." : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAddressModal;
