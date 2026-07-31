"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useSmartOffer } from "@/context/SmartOfferContext";
import { useSelectBasketItems } from "@/context/BasketContext";
import MenuItemModal from "./MenuItemModal";

export default function SmartOfferGiftSelection() {
  const router = useRouter();
  const { smartOffer } = useSmartOffer();
  const basketItems = useSelectBasketItems();
  const [selectedOption, setSelectedOption] = useState(null);
  const selectedSmartOfferGift = basketItems.find(
    (item) => item?.isSmartOfferFreeItem,
  );

  const options = useMemo(
    () =>
      (Array.isArray(smartOffer?.freeItems) ? smartOffer.freeItems : [])
        .map((option) => ({
          id: String(option?.item?._id || option?.item || ""),
          name: String(option?.item?.name || "Article offert").trim(),
          image: option?.item?.image,
          description: option?.item?.description,
          size: String(option?.size || "").trim(),
        }))
        .filter((option) => option.id),
    [smartOffer?.freeItems],
  );

  const categoryName = String(
    smartOffer?.targetCategory?.name ||
      smartOffer?.freeItems?.[0]?.item?.category?.name ||
      "cadeau",
  ).toLowerCase();

  if (!smartOffer || smartOffer.offerType !== "free_item") {
    return (
      <div className="md:mt-28 mt-20 min-h-[60vh] flex flex-col items-center justify-center px-4">
        <p className="font-inter font-semibold">Aucun cadeau disponible.</p>
        <button className="mt-4 bg-pr px-5 py-2 rounded-md" onClick={() => router.push("/menu")}>Retour au menu</button>
      </div>
    );
  }

  return (
    <div className="md:mt-28 mt-20 max-w-6xl mx-auto px-4 pt-8 pb-12">
      {selectedOption && (
        <MenuItemModal
          key={`${selectedOption.id}-${selectedOption.size}`}
          itemId={selectedOption.id}
          itemUID={null}
          showMenuItemModal
          setShowMenuItemModal={(show) => !show && setSelectedOption(null)}
          isSmartOfferFreeItem
          lockedSize={selectedOption.size}
        />
      )}

      <button className="text-sm font-semibold underline" onClick={() => router.back()}>Retour</button>
      <h1 className="font-bebas-neue text-3xl md:text-5xl mt-5">Choisissez votre {categoryName}</h1>
      {selectedSmartOfferGift ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mt-6">
          <p className="font-inter font-bold text-green-800">
            Votre cadeau est déjà dans le panier
          </p>
          <p className="font-inter text-sm text-green-700 mt-1">
            {selectedSmartOfferGift.name}
            {selectedSmartOfferGift.size?.size
              ? ` (${selectedSmartOfferGift.size.size})`
              : ""}
          </p>
          <button
            type="button"
            className="bg-[#F7A600] text-black font-bold text-sm px-5 py-2 rounded-md mt-4 cursor-pointer"
            onClick={() => router.push("/checkout")}
          >
            Retourner au checkout
          </button>
        </div>
      ) : (
        <p className="font-inter text-gray-600 mt-2">Sélectionnez un article parmi les cadeaux offerts.</p>
      )}

      {!selectedSmartOfferGift && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-7">
        {options.map((option) => (
          <button
            key={`${option.id}-${option.size}`}
            type="button"
            onClick={() => setSelectedOption(option)}
            className="text-left bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:border-[#F7A600] cursor-pointer"
          >
            {option.image && (
              <Image src={option.image} alt={option.name} width={500} height={280} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <div className="flex justify-between gap-3">
                <h2 className="font-inter font-bold text-lg">{option.name}</h2>
                <span className="font-inter font-bold text-green-700">Gratuit</span>
              </div>
              {option.size && <p className="font-inter text-sm text-gray-600 mt-1">Taille : {option.size}</p>}
              {option.description && <p className="font-inter text-sm text-gray-500 mt-2 line-clamp-2">{option.description}</p>}
              <span className="inline-block bg-[#F7A600] text-black font-bold text-sm px-4 py-2 rounded-md mt-4">Choisir</span>
            </div>
          </button>
        ))}
      </div>
      )}
    </div>
  );
}
