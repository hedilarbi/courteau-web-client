"use client";
import React, { useEffect } from "react";
import MenuItemModal from "./MenuItemModal";
import OfferModal from "./OfferModal";
import { useUser } from "@/context/UserContext";
const SelectMenuItemButton = ({ itemId, selectedCategory, reward }) => {
  const [showMenuItemModal, setShowMenuItemModal] = React.useState(false);
  const [showOfferModal, setShowOfferModal] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [selectedOffer, setSelectedOffer] = React.useState(null);
  const { user, loading } = useUser();
  const [actifButton, setActifButton] = React.useState(true);

  useEffect(() => {
    if (!user && selectedCategory === "recompenses") {
      setActifButton(false);
      return;
    }
    if (
      user?.fidelity_points < reward?.points &&
      selectedCategory === "recompenses"
    ) {
      setActifButton(false);
    } else {
      setActifButton(true);
    }
  }, [user, loading, reward, selectedCategory]);

  if (loading) {
    return null;
  }

  return (
    <>
      {showMenuItemModal && (
        <MenuItemModal
          itemId={selectedItem}
          setShowMenuItemModal={setShowMenuItemModal}
          showMenuItemModal={showMenuItemModal}
          reward={reward}
          lockedSize={reward?.size || ""}
        />
      )}

      {showOfferModal && (
        <OfferModal
          itemId={selectedOffer}
          setShowOfferModal={setShowOfferModal}
          showOfferModal={showOfferModal}
        />
      )}

      <button
        onClick={() => {
          if (selectedCategory === "offres") {
            setSelectedOffer(itemId);
            setShowOfferModal(true);
          } else if (selectedCategory === "recompenses") {
            setSelectedItem(reward?.item?._id);
            setShowMenuItemModal(true);
          } else {
            setSelectedItem(itemId);
            setShowMenuItemModal(true);
          }
        }}
        className={` ${
          actifButton
            ? "bg-pr cursor-pointer"
            : "bg-gray-400 cursor-not-allowed"
        } text-black font-bebas-neue text-center text-lg rounded-md px-4 py-2 mt-4 w-full `}
        disabled={!actifButton}
      >
        {selectedCategory === "recompenses"
          ? "Ajouter au panier"
          : "Sélectionner"}
      </button>
    </>
  );
};

export default SelectMenuItemButton;
