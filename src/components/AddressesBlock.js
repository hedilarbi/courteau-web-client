import React from "react";
import {
  FaLocationDot,
  FaPlus,
  FaRegPenToSquare,
  FaStore,
} from "react-icons/fa6";
import AddAddressModal from "./AddAddressModal";
import UpdateAddressModal from "./UpdateAddressModal";
import UpdateRestaurantModal from "./UpdateRestaurantModal";

const AddressesBlock = ({
  address,
  setAddress,
  selectedRestaurant,
  setSelectedRestaurant,
  restaurantsSettings,
  userId,
  userAddresses,
  deliveryMode,
}) => {
  const [showAddAddressModal, setShowAddAddressModal] = React.useState(false);
  const [showUpdateAddressModal, setShowUpdateAddressModal] =
    React.useState(false);

  const [showUpdateRestaurantModal, setShowUpdateRestaurantModal] =
    React.useState(false);

  return (
    <div className="rounded-md bg-white p-6 shadow-md mt-4">
      <h2 className="font-inter font-semibold text-black md:text-xl text-base">
        Adresses
      </h2>
      {deliveryMode === "delivery" && (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-pr">
            <FaLocationDot />
            <p className="font-inter font-semibold text-sm md:text-base text-black">
              Votre adresse de livraison
            </p>
          </div>
          {userAddresses.length > 0 && (
            <div className=" w-full rounded-md mt-4 border-2 border-[#e5e7eb] p-3">
              <div className="flex flex-col gap-2 md:flex-row md:justify-between">
                <div className=" font-semibold rounded-md text-base md:text-lg bg-white">
                  {address.address || "Aucune adresse disponible"}
                </div>
                <button
                  className="bg-pr text-black flex text-sm items-center justify-center  md:text-base px-4 py-2 rounded-md font-inter font-medium hover:bg-[#e69500] transition"
                  onClick={() => setShowUpdateAddressModal(true)}
                >
                  <FaRegPenToSquare />
                  <span className="ml-1">Modifier</span>
                </button>
              </div>
              {showUpdateAddressModal && (
                <UpdateAddressModal
                  setShowUpdateAddressModal={setShowUpdateAddressModal}
                  setAddress={setAddress}
                  address={address}
                  addresses={userAddresses}
                  setSelectedRestaurant={setSelectedRestaurant}
                  restaurantsSettings={restaurantsSettings}
                />
              )}
            </div>
          )}
          <button
            className="mt-3  text-pr rounded-md font-inter font-semibold transition md:text-lg text-base  flex items-center justify-center gap-2 cursor-pointer"
            onClick={() => {
              setShowAddAddressModal(true);
            }}
          >
            <FaPlus />
            <span>Ajouter une adresse</span>
          </button>
          {showAddAddressModal && (
            <AddAddressModal
              setShowAddAddressModal={setShowAddAddressModal}
              setAddress={setAddress}
              userId={userId}
              setSelectedRestaurant={setSelectedRestaurant}
              restaurantsSettings={restaurantsSettings}
            />
          )}
        </div>
      )}
      <div className="mt-4">
        <div className="flex items-center gap-2 text-pr">
          <FaStore />
          <p className="font-inter font-semibold text-sm md:text-base text-black">
            Restaurant - {selectedRestaurant.name || "N/A"}
          </p>
        </div>

        <div className=" w-full rounded-md mt-4 bg-[#F9FAFB] p-3">
          <div className="flex flex-col md:flex-row md:justify-between gap-2">
            <div className=" font-semibold rounded-md text-base md:text-lg ">
              {selectedRestaurant.address || "Aucune adresse disponible"}
            </div>

            <button
              className="bg-pr text-black flex items-center text-sm justify-center  md:text-base px-4 py-2 rounded-md font-inter font-medium hover:bg-[#e69500] transition"
              onClick={() => setShowUpdateRestaurantModal(true)}
            >
              <FaRegPenToSquare />
              <span className="ml-1">Modifier</span>
            </button>
            {showUpdateRestaurantModal && (
              <UpdateRestaurantModal
                setShowUpdateRestaurantModal={setShowUpdateRestaurantModal}
                restaurantsSettings={restaurantsSettings}
                setSelectedRestaurant={setSelectedRestaurant}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressesBlock;
