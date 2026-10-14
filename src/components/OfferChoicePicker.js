"use client";

import Image from "next/image";
import { getItemsToChoose } from "@/utils/offerChoices";
import { FaCheck } from "react-icons/fa";

// Offres à choix (Offer.itemsToChoose fixé par l'admin) : le client choisit N articles DIFFÉRENTS
// parmi ceux de l'offre, prix de l'offre inchangé. Un article à quantité > 1 (Frites ×2) compte
// pour un seul choix. Les articles choisis = clés présentes dans `selectedCustomizations` (id de
// l'article) : la commande n'envoie que ces articles, ce que vérifie le serveur. Mêmes règles que
// l'app (courteaux-client/src/screens/OfferScreen.js).

export { getItemsToChoose };

const hasKey = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);

/** État dérivé de la sélection + bascule d'un article. */
export const getOfferChoiceState = (offer, selectedCustomizations) => {
  const itemsToChoose = getItemsToChoose(offer);
  const isChoiceOffer = itemsToChoose > 0;
  const isLineSelected = (line) => hasKey(selectedCustomizations, line?.item?._id);
  const selectedCount = isChoiceOffer
    ? new Set((offer?.items || []).filter(isLineSelected).map((line) => line.item._id)).size
    : 0;
  const remainingChoices = Math.max(0, itemsToChoose - selectedCount);
  return {
    itemsToChoose,
    isChoiceOffer,
    isLineSelected,
    selectedCount,
    remainingChoices,
    choiceComplete: !isChoiceOffer || remainingChoices === 0,
    displayedLines: isChoiceOffer ? (offer?.items || []).filter(isLineSelected) : offer?.items || [],
  };
};

/** Coche / décoche un article (sans dépasser le nombre à choisir). */
export const toggleOfferChoice = (offer, line, previous) => {
  const itemId = line?.item?._id;
  if (!itemId) return previous;
  const updated = { ...previous };
  if (hasKey(updated, itemId)) {
    delete updated[itemId];
    return updated;
  }
  const count = new Set(
    (offer?.items || []).map((entry) => entry?.item?._id).filter((entryId) => hasKey(updated, entryId)),
  ).size;
  if (count >= getItemsToChoose(offer)) return previous;
  updated[itemId] = Array.from({ length: line.quantity || 1 }, () => []);
  return updated;
};

/** Personnalisations initiales : tous les articles pour une offre classique, aucun pour une offre à choix. */
export const getInitialOfferCustomizations = (offer) => {
  const initial = {};
  if (getItemsToChoose(offer)) return initial;
  (offer?.items || []).forEach((item) => {
    initial[item.item._id] = Array.from({ length: item.quantity }, () => []);
  });
  return initial;
};

/** Consigne + cartes à cocher + titre de la personnalisation. */
const OfferChoicePicker = ({ offer, choice, onToggle }) => {
  const { itemsToChoose, isLineSelected, selectedCount, choiceComplete, displayedLines } = choice;
  return (
    <>
      <div className="mt-4 rounded-xl bg-pr p-4 flex items-center gap-3">
        <span className="text-2xl" aria-hidden>✋</span>
        <div>
          <p className="font-bebas-neue text-2xl leading-none text-black">
            Choisissez {itemsToChoose} articles parmi {offer.items.length}
          </p>
          <p className="font-inter text-xs text-black mt-1">Prix fixe, quel que soit votre choix</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-end justify-between">
          <p className="font-bebas-neue text-2xl">Vos choix</p>
          <p className={`font-bebas-neue text-2xl ${choiceComplete ? "text-green-600" : "text-[#A27000]"}`}>
            {selectedCount} / {itemsToChoose}
          </p>
        </div>
        {choiceComplete && (
          <p className="font-inter text-xs text-gray-500">Retirez un choix pour en sélectionner un autre</p>
        )}
        <div className="grid md:grid-cols-2 grid-cols-1 gap-2 mt-2">
          {offer.items.map((item) => {
            const selected = isLineSelected(item);
            const locked = !selected && choiceComplete;
            return (
              <button
                key={item._id}
                type="button"
                disabled={locked}
                onClick={() => onToggle(item)}
                className={`flex items-center gap-3 rounded-xl border-2 p-2 text-left ${
                  selected ? "border-pr bg-[#FFFAEF]" : "border-[#E5E7EB] bg-white"
                } ${locked ? "opacity-45 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <Image
                  src={item.item.image}
                  alt={item.item.name}
                  width={50}
                  height={50}
                  className="rounded-md h-12 w-12 object-cover"
                />
                <div className="flex-1">
                  <p className="font-inter font-semibold text-sm">
                    {item.quantity > 1 ? `${item.quantity} × ` : ""}
                    {item.item.name}
                  </p>
                  <span className="text-gray-500 text-xs font-inter font-semibold">({item.size})</span>
                </div>
                <span
                  className={`h-6 w-6 rounded-full flex items-center justify-center border-2 border-pr ${
                    selected ? "bg-pr" : ""
                  }`}
                >
                  {selected && <FaCheck className="text-black text-xs" />}
                </span>
              </button>
            );
          })}
        </div>
        <p className="font-bebas-neue text-2xl mt-5">Personnaliser vos choix</p>
        {displayedLines.length === 0 && (
          <p className="font-inter text-sm text-gray-500">
            Sélectionnez vos articles ci-dessus pour les personnaliser.
          </p>
        )}
      </div>
    </>
  );
};

export default OfferChoicePicker;
