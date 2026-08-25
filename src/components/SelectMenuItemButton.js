"use client";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import MenuItemModal from "./MenuItemModal";
import OfferModal from "./OfferModal";
import { useUser } from "@/context/UserContext";
const SelectMenuItemButton = ({ itemId, selectedCategory, reward, compact = false }) => {
  const [showMenuItemModal, setShowMenuItemModal] = React.useState(false);
  const [showOfferModal, setShowOfferModal] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [selectedOffer, setSelectedOffer] = React.useState(null);
  const { user, loading } = useUser();
  const [actifButton, setActifButton] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      {mounted && showMenuItemModal &&
        createPortal(
          <MenuItemModal
            itemId={selectedItem}
            setShowMenuItemModal={setShowMenuItemModal}
            showMenuItemModal={showMenuItemModal}
            reward={reward}
            lockedSize={reward?.size || ""}
          />,
          document.body,
        )}

      {mounted && showOfferModal &&
        createPortal(
          <OfferModal
            itemId={selectedOffer}
            setShowOfferModal={setShowOfferModal}
            showOfferModal={showOfferModal}
          />,
          document.body,
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
        } text-black font-bebas-neue text-center rounded-lg px-4 py-2.5 mt-3 w-full ${compact ? "text-base" : "text-lg"}`}
        disabled={!actifButton}
      >
        {selectedCategory === "recompenses"
          ? "Ajouter au panier"
          : compact ? "Ajouter" : "Sélectionner"}
      </button>
    </>
  );
};

export default SelectMenuItemButton;
