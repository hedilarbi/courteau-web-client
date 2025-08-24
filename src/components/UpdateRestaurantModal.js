import React from "react";
import { IoMdClose } from "react-icons/io";
const UpdateRestaurantModal = ({
  setShowUpdateRestaurantModal,
  restaurantsSettings,
  setSelectedRestaurant,
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50  z-50">
      <div className="bg-white p-6 rounded-md shadow-md w-11/12 max-w-md">
        <div className="flex justify-end">
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setShowUpdateRestaurantModal(false)}
          >
            <IoMdClose size={32} />
          </button>
        </div>
        <h2 className="font-inter font-semibold text-black md:text-xl text-base ">
          Modifier le restaurant
        </h2>

        <div>
          <select
            className="mt-3 max-w-full px-3 py-2 border rounded-md text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-pr bg-white"
            value={restaurantsSettings.name}
            onChange={(e) => {
              const selected = restaurantsSettings.find(
                (addr) => addr.name === e.target.value
              );

              setSelectedRestaurant(selected);
            }}
          >
            {restaurantsSettings.map((restaurant, idx) => (
              <option key={idx} value={restaurant.name}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end mt-6 gap-2">
          <button
            className="px-4 py-2 bg-pr text-black rounded-md hover:bg-[#e69500] transition disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setShowUpdateRestaurantModal(false)}
          >
            Modifier
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateRestaurantModal;
