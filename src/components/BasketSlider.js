import { useBasket, useSelectBasket } from "@/context/BasketContext";
import { sendGTMEvent } from "@next/third-parties/google";
import Image from "next/image";
import React, { useRef } from "react";
import { MdClose } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { IoPencilSharp } from "react-icons/io5";

import OfferModal from "./OfferModal";
import MenuItemModal from "./MenuItemModal";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useSmartOffer } from "@/context/SmartOfferContext";
import NoUserModal from "./NoUserModal";

const BasketSlider = ({ setShowBasketSlider, showBasketSlider }) => {
  const basket = useSelectBasket();
  const { user, loading, addPoints } = useUser();
  const { smartOffer } = useSmartOffer();
  const smartOfferThreshold = Math.max(
    0,
    Number(smartOffer?.bonusThreshold) || 0,
  );
  const trackedBasketSubtotal = Math.max(0, Number(basket.subtotal) || 0);
  const smartOfferProgress =
    smartOfferThreshold > 0
      ? Math.min(100, (trackedBasketSubtotal / smartOfferThreshold) * 100)
      : 100;
  const smartOfferUnlocked =
    Boolean(smartOffer) &&
    (smartOfferThreshold <= 0 || trackedBasketSubtotal >= smartOfferThreshold);
  const smartOfferRemaining = Math.max(
    0,
    smartOfferThreshold - trackedBasketSubtotal,
  );

  const { removeFromBasket, removeOfferFromBasket, removeRewardFromBasket } =
    useBasket();
  const [showOfferModal, setShowOfferModal] = React.useState(false);
  const [showItemModal, setShowItemModal] = React.useState(false);
  const [itemId, setItemId] = React.useState(null);
  const [offerId, setOfferId] = React.useState(null);
  const [itemUID, setItemUID] = React.useState(null);
  const [offerUID, setOfferUID] = React.useState(null);
  const [showNoUserModal, setShowNoUserModal] = React.useState(false);
  const beginCheckoutSentRef = useRef(false);
  const router = useRouter();

  React.useEffect(() => {
    if (showBasketSlider) {
      beginCheckoutSentRef.current = false;
    }
  }, [showBasketSlider]);

  const handleNav = () => {
    if (!user) {
      setShowNoUserModal(true);
      return;
    }
    if (beginCheckoutSentRef.current) return;
    beginCheckoutSentRef.current = true;
    setShowBasketSlider(false);

    const ecommerceItems = [
      ...basket.items.map((item) => ({
        item_id: String(item.id),
        item_name: item.name,
        price: Number(item.price) || 0,
        quantity: 1,
        ...(item.categoryName
          ? { item_category: item.categoryName }
          : {}),
      })),
      ...basket.offers.map((offer) => ({
        item_id: String(offer.id),
        item_name: offer.name,
        price: Number(offer.price) || 0,
        quantity: 1,
      })),
      ...basket.rewards.map((reward) => ({
        item_id: String(reward._id || reward.id),
        item_name: reward.name,
        price: Number(reward.extraPrice) || 0,
        quantity: 1,
      })),
    ];

    sendGTMEvent({ ecommerce: null });
    sendGTMEvent({
      event: "begin_checkout",
      ecommerce: {
        currency: "CAD",
        value: Number(basket.subtotal) || 0,
        items: ecommerceItems,
      },
    });
    router.push("/checkout");
  };

  const handleRemoveReward = (reward) => {
    removeRewardFromBasket(reward.uid || reward._id);
    addPoints(Number(reward.points) || 0);
  };

  return (
    <>
    <button
      type="button"
      aria-label="Fermer le panier"
      onClick={() => setShowBasketSlider(false)}
      className={`fixed inset-0 z-40 bg-[#1a1714]/45 backdrop-blur-[2px] transition-opacity duration-300 ${showBasketSlider ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
    />
    <div
      className={`${
        showBasketSlider ? "translate-x-0" : "translate-x-full"
      } fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-[520px] flex-col border-l border-[#e5ddcf] bg-[#fffdf9] shadow-[-24px_0_60px_rgba(26,23,20,.2)] transition-transform duration-300 ease-out`}
    >
      {showNoUserModal && (
        <NoUserModal
          showNoUserModal={showNoUserModal}
          setShowNoUserModal={setShowNoUserModal}
        />
      )}

      {showOfferModal && (
        <OfferModal
          setShowOfferModal={setShowOfferModal}
          itemId={offerId}
          itemUID={offerUID}
          showOfferModal={showOfferModal}
        />
      )}

      {showItemModal && (
        <MenuItemModal
          setShowMenuItemModal={setShowItemModal}
          itemId={itemId}
          itemUID={itemUID}
          showMenuItemModal={showItemModal}
        />
      )}

      <header className="flex items-center justify-between border-b border-[#ece5d9] bg-white px-5 py-4 md:px-7">
        <div>
          <p className="text-[10px] font-bold tracking-[.16em] text-[#9c9184]">VOTRE COMMANDE</p>
          <h2 className="font-bebas-neue text-3xl leading-none">LE PANIER <span className="text-pr">({basket.size})</span></h2>
        </div>
        <button
          aria-label="Fermer le panier"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#e5ddcf] text-black transition hover:border-pr hover:bg-[#fdf0d6]"
          onClick={() => setShowBasketSlider(false)}
        >
          <MdClose size={28} />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
      {smartOffer && (
        <div className="mb-4 rounded-2xl border border-pr bg-[#fdf0d6] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider font-bold text-[#A16207]">
                Offre personnalisée
              </p>
              <p className="text-sm font-semibold text-black mt-1">
                {smartOffer.notificationTitle}
              </p>
            </div>
            {smartOfferThreshold > 0 && (
              <p className="text-xs font-bold text-black whitespace-nowrap">
                {trackedBasketSubtotal.toFixed(2)}$ / {smartOfferThreshold.toFixed(2)}$
              </p>
            )}
          </div>

          {smartOfferThreshold > 0 && (
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-[#F7A600] rounded-full transition-all duration-300"
                style={{ width: `${smartOfferProgress}%` }}
              />
            </div>
          )}

          <p
            className={`text-xs font-semibold mt-2 ${
              smartOfferUnlocked ? "text-green-700" : "text-gray-600"
            }`}
          >
            {smartOfferUnlocked
              ? "Offre débloquée pour cette commande"
              : `Encore ${smartOfferRemaining.toFixed(2)}$ pour débloquer l’offre`}
          </p>

          {smartOfferUnlocked && ["free_item", "buy_one_get_one"].includes(smartOffer.offerType) && (
            <button
              type="button"
              className="bg-[#F7A600] text-black text-xs font-bold px-3 py-2 rounded-md cursor-pointer mt-3"
              onClick={() => {
                setShowBasketSlider(false);
                router.push("/menu/cadeaux");
              }}
            >
              Choisissez votre {String(
                smartOffer.targetCategory?.name ||
                  smartOffer.freeItems?.[0]?.item?.category?.name ||
                  "cadeau",
              ).toLowerCase()}
            </button>
          )}
        </div>
      )}
      {basket.size !== 0 ? (
        <div className="rounded-2xl border border-[#ece5d9] bg-white p-4 md:p-5">
          <div className="">
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
                    } flex flex-row gap-3 border-[#ece5d9] py-4 items-start`}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={70}
                      height={70}
                      className="h-20 w-20 shrink-0 rounded-xl object-cover md:h-24 md:w-24"
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
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#fdf0d6] px-3 py-2 text-xs font-semibold text-[#8a5f00]"
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
                          className="flex cursor-pointer items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-[#a3342b] hover:bg-red-50"
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
                    } flex flex-row gap-3 py-4 border-[#ece5d9] items-start`}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={70}
                      height={70}
                      className="h-20 w-20 shrink-0 rounded-xl object-cover md:h-24 md:w-24"
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
                                  (i) => i.item._id === key,
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
                              },
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
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#fdf0d6] px-3 py-2 text-xs font-semibold text-[#8a5f00]"
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
                          className="flex cursor-pointer items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-[#a3342b] hover:bg-red-50"
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
                      className="object-cover rounded-xl  md:w-40  w-14  h-30"
                    />
                    <div className="ml-2 min-w-0 flex-1">
                      <p className="text-sm font-inter text-gray-700">
                        {item.item.name}
                      </p>
                      {item.size && (
                        <p className="text-xs font-inter text-gray-500 mt-1">
                          Taille : {item.size?.size || item.size}
                        </p>
                      )}
                      {item.customization?.length > 0 && (
                        <p className="text-xs font-inter text-gray-500 mt-1">
                          Personnalisations :{" "}
                          {item.customization
                            .map((customization) => customization?.name)
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                      {Number(item.extraPrice) > 0 && (
                        <p className="text-xs font-inter font-semibold text-pr mt-1">
                          Extras : ${Number(item.extraPrice).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <button
                      className="bg-red-500 flex items-center justify-center gap-2 text-white text-sm cursor-pointer px-3 py-2 rounded-md mt-2"
                      onClick={() => handleRemoveReward(item)}
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
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#ddd4c4] bg-white p-8 text-center">
          <p className="font-bebas-neue text-3xl">VOTRE PANIER EST VIDE</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#8a8074]">Ajoutez vos plats préférés depuis le menu pour commencer votre commande.</p>
        </div>
      )}
      </div>
      {basket.size !== 0 && (
        <div className="border-t border-[#ece5d9] bg-white px-5 py-4 shadow-[0_-12px_30px_rgba(26,23,20,.06)] md:px-7">
          <div className="flex justify-between w-full">
            <p className="text-black font-semibold md:text-base text-sm">
              Sous-total
            </p>
            <p className="font-bebas-neue text-3xl text-black">
              ${basket.subtotal.toFixed(2)}
            </p>
          </div>
          <div className="mt-2">
            <button
              className={`${
                basket.size === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-pr cursor-pointer"
              } w-full rounded-xl px-4 py-4 font-bebas-neue text-xl tracking-wider text-black transition hover:-translate-y-0.5`}
              disabled={basket.size === 0}
              onClick={handleNav}
            >
              PASSER LA COMMANDE
            </button>
            <p className="mt-3 text-center text-sm text-[#6e6659]">
              <span
                className="cursor-pointer font-semibold underline decoration-pr decoration-2 underline-offset-4"
                onClick={() => setShowBasketSlider(false)}
              >
                Continuer mes achats
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default BasketSlider;
