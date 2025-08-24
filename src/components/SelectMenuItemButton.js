"use client";
import React from "react";
import MenuItemModal from "./MenuItemModal";
import OfferModal from "./OfferModal";

const SelectMenuItemButton = ({ itemId, selectedCategory }) => {
  const [showMenuItemModal, setShowMenuItemModal] = React.useState(false);
  const [showOfferModal, setShowOfferModal] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [selectedOffer, setSelectedOffer] = React.useState(null);
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
          } else {
            setSelectedItem(itemId);
            setShowMenuItemModal(true);
          }
        }}
        className="bg-pr cursor-pointer font-bold  text-black font-bebas-neue text-center text-lg rounded-md px-4 py-2 mt-4 w-full"
      >
        Sélectionner
      </button>
    </>
  );
};

export default SelectMenuItemButton;
