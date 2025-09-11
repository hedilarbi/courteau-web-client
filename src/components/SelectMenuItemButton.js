"use client";
import React from "react";
import MenuItemModal from "./MenuItemModal";
import OfferModal from "./OfferModal";
import { useBasket } from "@/context/BasketContext";
import { useUser } from "@/context/UserContext";

const SelectMenuItemButton = ({ itemId, selectedCategory, reward }) => {
  const [showMenuItemModal, setShowMenuItemModal] = React.useState(false);
  const [showOfferModal, setShowOfferModal] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [selectedOffer, setSelectedOffer] = React.useState(null);
  const { addRewardToBasket } = useBasket();
  const { removePoints, user, loading } = useUser();
  if (loading) {
    return null;
  }
  let actifButton = true;

  if (
    user?.fidelity_points < reward?.points &&
    selectedCategory === "recompenses" &&
    !user
  ) {
    actifButton = false;
  }
  const handleAddReward = () => {
    if (user && actifButton) {
      addRewardToBasket(reward);
      removePoints(reward.points);
    }
  };

  return (
    <>
      <MenuItemModal
        itemId={selectedItem}
        setShowMenuItemModal={setShowMenuItemModal}
        showMenuItemModal={showMenuItemModal}
      />

      <OfferModal
        itemId={selectedOffer}
        setShowOfferModal={setShowOfferModal}
        showOfferModal={showOfferModal}
      />

      <button
        onClick={() => {
          if (selectedCategory === "offres") {
            setSelectedOffer(itemId);
            setShowOfferModal(true);
          } else if (selectedCategory === "recompenses") {
            handleAddReward();
          } else {
            setSelectedItem(itemId);
            setShowMenuItemModal(true);
          }
        }}
        className={`bg-pr cursor-pointer   text-black font-bebas-neue text-center text-lg rounded-md px-4 py-2 mt-4 w-full ${
          !actifButton && "bg-gray-400  cursor-not-allowed"
        }`}
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
