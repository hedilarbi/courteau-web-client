import { useBasket, useSelectBasket } from "@/context/BasketContext";
import Image from "next/image";
import React from "react";
import { MdClose } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { IoPencilSharp } from "react-icons/io5";

import OfferModal from "./OfferModal";
import MenuItemModal from "./MenuItemModal";
import { useRouter } from "next/navigation";

const BasketSlider = ({ setShowBasketSlider, showBasketSlider }) => {
  const basket = useSelectBasket();

  const { removeFromBasket, removeOfferFromBasket, removeRewardFromBasket } =
    useBasket();
  const [showOfferModal, setShowOfferModal] = React.useState(false);
  const [showItemModal, setShowItemModal] = React.useState(false);
  const [itemId, setItemId] = React.useState(null);
  const [offerId, setOfferId] = React.useState(null);
  const [itemUID, setItemUID] = React.useState(null);
  const [offerUID, setOfferUID] = React.useState(null);
  const router = useRouter();

  return (
    <div
      className={`${
        showBasketSlider ? "" : "translate-x-[100%]"
      }  md:w-[40%] w-[100%]  bg-[#F3F4F6] flex flex-col  fixed top-0 right-0 border-l border-gray-200 shadow-md h-screen p-4 z-30 transition-width duration-300 ease-in-out`}
    >
      <OfferModal
        setShowOfferModal={setShowOfferModal}
        itemId={offerId}
        itemUID={offerUID}
        showOfferModal={showOfferModal}
      />

      <MenuItemModal
        setShowMenuItemModal={setShowItemModal}
        itemId={itemId}
        itemUID={itemUID}
        showMenuItemModal={showItemModal}
      />

      <div className="flex justify-end mb-4">
        <button
          className="text-black cursor-pointer text-3xl "
          onClick={() => setShowBasketSlider(false)}
        >
          <MdClose size={28} />
        </button>
      </div>
      {basket.size !== 0 ? (
        <div className="bg-white rounded-md shadow-lg p-4  overflow-y-auto flex-1">
          <div className="">
            <p className="text-black font-bebas-neue md:text-2xl text-xl">
              Votre panier
            </p>
            {basket.items.length > 0 && (
              <div>
                <p className="text-black font-inter text-base mt-4 font-semibold">
                  Articles
                </p>
                {basket.items.map((item, index) => (
                  <div
                    key={item.uid}
                    className={`${
                      index === basket.items.length - 1
                        ? "border-b-0"
                        : "border-b-2"
                    } flex md:flex-row flex-col gap-4  py-4 border-gray-200 items-start`}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={70}
                      height={70}
                      className="object-cover rounded-xl  md:w-40 w-full h-30"
                    />

                    <div className="flex-1 w-full flex-col">
                      <div className="flex justify-between  w-full">
                        <p className="text-black font-semibold font-inter text-base  ">
                          {item.name}
                        </p>
                        <p className="text-pr font-semibold font-inter text-base">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-[#4B5563] text-inter font-medium text-xs mt-1">
                        Format: {item.size.size}
                      </p>
                      {item.customization.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-inter font-semibold text-black">
                            Personnalisations:
                          </p>
                          <div className="mt-1 ml-4 text-xs font-inter">
                            {item.customization.map((custom, index) => (
                              <div key={index} className="flex items-center">
                                <div className="h-2 w-2 rounded-full bg-pr mr-2"></div>

                                <p className="text-[#4B5563] capitalize">
                                  {custom.name}
                                  {custom.price > 0 &&
                                    `(+$${custom.price.toFixed(2)} )`}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {item.comment && (
                        <div className="mt-2">
                          <p className="text-xs font-inter text-gray-600">
                            Commentaire: {item.comment ? item.comment : "Aucun"}
                          </p>
                        </div>
                      )}
                      <div className="flex justify-between w-full mt-2">
                        <button
                          className="bg-pr text-black text-sm font-semibold flex cursor-pointer items-center justify-center gap-2 px-3 py-2 rounded-md mt-2"
                          onClick={() => {
                            setItemId(item.id);
                            setItemUID(item.uid);

                            setShowItemModal(true);
                          }}
                        >
                          <IoPencilSharp />
                          <p className="font-inter font-medium">Modifier</p>
                        </button>
                        <button
                          className="bg-red-500 flex items-center justify-center cursor-pointer gap-2 text-white text-sm  px-3 py-2 rounded-md mt-2"
                          onClick={() => removeFromBasket(item.uid)}
                        >
                          <FaTrash />
                          <p className="font-inter font-semibold">Supprimer</p>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {basket.offers.length > 0 && (
              <div>
                <p className="text-black font-inter text-base mt-4 font-semibold">
                  Offres
                </p>
                {basket.offers.map((item, index) => (
                  <div
                    key={item.uid}
                    className={`${
                      index === basket.offers.length - 1
                        ? "border-b-0"
                        : "border-b-2"
                    } flex md:flex-row flex-col gap-4 py-4 border-gray-200 items-start`}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={70}
                      height={70}
                      className="object-cover rounded-xl md:w-40  w-full h-30"
                    />

                    <div className="flex-1 w-full flex-col">
                      <div className="flex justify-between  w-full">
                        <p className="text-black font-semibold font-inter text-base  ">
                          {item.name}
                        </p>
                        <p className="text-pr font-semibold font-inter text-base">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>

                      {item.customization && (
                        <div className="mt-2">
                          <p className="text-xs font-inter font-semibold text-black">
                            Personnalisations:
                          </p>
                          <div className="mt-1 ml-4 text-xs font-inter">
                            {Object.entries(item.customization).map(
                              ([key, customArr], idx) => {
                                const matchedItem = item.items?.find(
                                  (i) => i.item._id === key
                                );

                                const itemName = matchedItem
                                  ? matchedItem.item.name
                                  : key;
                                return (
                                  <div key={key + idx}>
                                    {customArr.map((custom, i) => (
                                      <div key={i} className="mb-1">
                                        <p className="text-black font-semibold">
                                          {itemName} ({i + 1})
                                        </p>
                                        {custom.map((c) => (
                                          <div
                                            key={c._id}
                                            className="flex items-center ml-2"
                                          >
                                            <div className="h-2 w-2 rounded-full bg-pr mr-2"></div>
                                            <p className="text-[#4B5563] capitalize">
                                              {c.name}
                                              {c.price > 0 &&
                                                `(+${c.price.toFixed(2)})`}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                      {item.comment && (
                        <div className="mt-2">
                          <p className="text-xs font-inter text-gray-600">
                            Commentaire: {item.comment ? item.comment : "Aucun"}
                          </p>
                        </div>
                      )}
                      <div className="flex justify-between w-full mt-2">
                        <button
                          className="bg-pr text-black text-sm font-semibold flex items-center cursor-pointer justify-center gap-2 px-3 py-2 rounded-md mt-2"
                          onClick={() => {
                            setOfferId(item.id);
                            setOfferUID(item.uid);
                            setShowOfferModal(true);
                          }}
                        >
                          <IoPencilSharp />
                          <p className="font-inter font-medium">Modifier</p>
                        </button>
                        <button
                          className="bg-red-500 flex items-center justify-center gap-2 text-white text-sm cursor-pointer px-3 py-2 rounded-md mt-2"
                          onClick={() => removeOfferFromBasket(item.uid)}
                        >
                          <FaTrash />
                          <p className="font-inter font-semibold">Supprimer</p>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {basket.rewards.length > 0 && (
              <div>
                <p className="text-black font-inter text-base mt-4 font-semibold">
                  Récompenses
                </p>
                {basket.rewards.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between py-2 border-b border-gray-200 ${
                      index === basket.rewards.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <Image
                      src={item.item.image}
                      alt={item.item.name}
                      width={70}
                      height={70}
                      className="object-cover rounded-xl  md:w-40  w-14 h-14"
                    />
                    <p className="text-sm font-inter text-gray-700 ml-2">
                      {item.item.name}
                    </p>
                    <button
                      className="bg-red-500 flex items-center justify-center gap-2 text-white text-sm cursor-pointer px-3 py-2 rounded-md mt-2"
                      onClick={() => removeRewardFromBasket(item._id)}
                    >
                      <FaTrash />
                      <p className="font-inter font-semibold">Supprimer</p>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-black">Votre panier est vide</p>
        </div>
      )}
      {basket.size !== 0 && (
        <div className="bg-white rounded-md shadow-lg p-4  mt-4">
          <div className="flex justify-between w-full">
            <p className="text-black font-semibold md:text-base text-sm">
              Total:
            </p>
            <p className="text-pr font-semibold md:text-base font-inter text-sm">
              ${basket.subtotal.toFixed(2)}
            </p>
          </div>
          <div className="mt-2">
            <button
              className={`${
                basket.size === 0 || basket.subtotal === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-pr cursor-pointer"
              }  text-black font-semibold font-inter px-4 py-2 rounded-md mt-4 w-full`}
              disabled={basket.size === 0 || basket.subtotal === 0}
              onClick={() => {
                setShowBasketSlider(false);
                router.push("/checkout");
              }}
            >
              Passer à la caisse
            </button>
            <p className="text-center md:text-base text-sm mt-4 text-black font-inter">
              Ou{" "}
              <span
                className="text-pr cursor-pointer"
                onClick={() => setShowBasketSlider(false)}
              >
                continuer vos achats
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasketSlider;
