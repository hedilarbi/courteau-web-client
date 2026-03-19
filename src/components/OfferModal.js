import {
  useBasket,
  useSelectBasketOfferWithUID,
} from "@/context/BasketContext";
import { getOffer } from "@/services/FoodServices";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AiOutlineClose } from "react-icons/ai";
import { FaCartPlus } from "react-icons/fa";
import { FaCheck } from "react-icons/fa";
import { IoChatbubble } from "react-icons/io5";
import ItemLoadingSkeleton from "./ItemLoadingSkeleton";
const parseRuleValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getFreeLimit = (rule) => {
  if (!rule) return 0;
  if (rule.max === null || rule.max === undefined) return Infinity;
  const max = parseRuleValue(rule.max);
  if (max !== null) return max;
  const min = parseRuleValue(rule.min);
  if (min !== null) return min;
  return 0;
};

const normalizeCustomizationGroups = (rawGroups) => {
  if (!rawGroups) return [];
  const groups = Array.isArray(rawGroups) ? rawGroups : [rawGroups];
  return groups.filter((group) => Array.isArray(group?.toppings));
};

const normalizeSelectionEntries = (selectionList) => {
  if (!Array.isArray(selectionList)) return [];
  return selectionList
    .map((selection) => {
      if (typeof selection === "string") {
        return { _id: selection, name: "", price: 0 };
      }
      if (!selection?._id) return null;
      return {
        _id: selection._id,
        name: selection.name || "",
        price: Number(selection.price) || 0,
      };
    })
    .filter(Boolean);
};

const getSelectedIdsForGroup = (selectionList, group) => {
  const normalizedSelections = normalizeSelectionEntries(selectionList);
  if (!group) return [];
  const groupToppingIds = new Set((group.toppings || []).map((t) => t?._id));
  return normalizedSelections
    .map((selection) => selection._id)
    .filter((id) => groupToppingIds.has(id));
};

const buildPricedSelectionsForGroups = (selectionList, groups) => {
  const normalizedSelections = normalizeSelectionEntries(selectionList);
  if (!groups.length) return normalizedSelections;
  const selectionById = new Map(
    normalizedSelections.map((selection) => [selection._id, selection])
  );
  const pricedById = new Map();

  groups.forEach((group) => {
    const freeLimit = getFreeLimit(group?.selectionRule);
    const selectedIdsInGroup = getSelectedIdsForGroup(normalizedSelections, group);
    selectedIdsInGroup.forEach((selectedId, index) => {
      const topping = (group?.toppings || []).find(
        (candidate) => candidate?._id === selectedId
      );
      const selected = selectionById.get(selectedId);
      const price =
        freeLimit !== Infinity && index >= freeLimit
          ? Number(topping?.price) || 0
          : 0;
      pricedById.set(selectedId, {
        _id: selectedId,
        name: selected?.name || topping?.name || "",
        price,
      });
    });
  });

  normalizedSelections.forEach((selection) => {
    if (pricedById.has(selection._id)) return;
    pricedById.set(selection._id, {
      _id: selection._id,
      name: selection.name || "",
      price: Number(selection.price) || 0,
    });
  });

  return normalizedSelections
    .map((selection) => pricedById.get(selection._id))
    .filter(Boolean);
};
const OfferModal = ({ itemId, setShowOfferModal, itemUID, showOfferModal }) => {
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCustomizations, setSelectedCustomizations] = useState({});
  const [comment, setComment] = useState("");
  const { addOfferToBasket, updateOfferInBasket } = useBasket();
  const offerFromBasket = useSelectBasketOfferWithUID(itemUID)[0];
  const fetchItem = async () => {
    try {
      setLoading(true);
      const response = await getOffer(itemId);
        if (response.status) {
          console.log("Offer response:", response.data);
          setOffer(response.data);
          if (!offerFromBasket) {
            const initialCustomizations = {};
            response.data.items.forEach((item) => {
              initialCustomizations[item.item._id] = Array.from(
                { length: item.quantity },
                () => []
              );
            });
            setSelectedCustomizations(initialCustomizations);
          } else {
            const basketCustomizations =
              offerFromBasket.customization ||
              offerFromBasket.customizations ||
              {};
            setSelectedCustomizations(basketCustomizations);
            setComment(offerFromBasket.comment || "");
          }
        } else {
          setError(response.message);
        }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    let totalPrice = Number(offer?.price) || 0;
    if (!offer?.items?.length) return totalPrice;

    offer.items.forEach((item) => {
      const itemCustomizations = selectedCustomizations[item.item._id] || [];
      const customizationGroups = normalizeCustomizationGroups(
        item.item.customization_group
      );
      const hasCustomizationGroup = customizationGroups.length > 0;

      if (hasCustomizationGroup) {
        itemCustomizations.forEach((customizations) => {
          const pricedSelections = buildPricedSelectionsForGroups(
            customizations,
            customizationGroups
          );
          pricedSelections.forEach((selection) => {
            totalPrice += Number(selection?.price) || 0;
          });
        });
      } else {
        itemCustomizations.forEach((customizations) => {
          normalizeSelectionEntries(customizations).forEach((customization) => {
            const itemCustomization = item.item.customization?.find(
              (c) => c._id === customization._id
            );

            totalPrice += Number(itemCustomization?.price ?? customization?.price) || 0;
          });
        });
      }
    });

    return totalPrice;
  };

  const handleCustomizationChange = (itemId, customization, index) => {
    const updatedCustomizations = { ...selectedCustomizations };
    if (!updatedCustomizations[itemId]) {
      updatedCustomizations[itemId] = [];
    }
    if (!updatedCustomizations[itemId][index]) {
      updatedCustomizations[itemId][index] = [];
    }
    const currentCustomizations = updatedCustomizations[itemId][index];

    const existingIndex = currentCustomizations.findIndex(
      (c) => (typeof c === "string" ? c : c?._id) === customization._id
    );

    if (existingIndex !== -1) {
      // Remove customization if already selected
      updatedCustomizations[itemId][index] = currentCustomizations.filter(
        (c) => (typeof c === "string" ? c : c?._id) !== customization._id
      );
    } else {
      // Add customization object
      updatedCustomizations[itemId][index].push({
        _id: customization._id,
        name: customization.name,
        price: customization.price,
      });
    }
    setSelectedCustomizations(updatedCustomizations);
  };

  const getSelectionSummaryText = (rule) => {
    if (!rule) return "";
    const minDisplay = parseRuleValue(rule.min) || 0;
    const maxValue = rule.max;
    const maxNumeric = parseRuleValue(maxValue);
    const maxDisplay =
      maxValue === null || maxValue === undefined || maxNumeric === null
        ? "illimite"
        : maxNumeric;
    return `(min ${minDisplay} gratuit et maximum ${maxDisplay})`;
  };

  const buildPricedCustomizations = () => {
    const pricedCustomizations = {};
    if (!offer?.items?.length) return pricedCustomizations;

    offer.items.forEach((item) => {
      const itemCustomizations = selectedCustomizations[item.item._id] || [];
      const customizationGroups = normalizeCustomizationGroups(
        item.item.customization_group
      );
      const hasCustomizationGroup = customizationGroups.length > 0;

      if (hasCustomizationGroup) {
        pricedCustomizations[item.item._id] = itemCustomizations.map(
          (customizations) =>
            buildPricedSelectionsForGroups(customizations, customizationGroups)
        );
      } else {
        pricedCustomizations[item.item._id] = itemCustomizations.map(
          (customizations) =>
            normalizeSelectionEntries(customizations).map((customization) => {
              const itemCustomization = item.item.customization?.find(
                (c) => c._id === customization._id
              );
              return {
                _id: customization._id,
                name: customization.name || itemCustomization?.name || "",
                price:
                  Number(itemCustomization?.price ?? customization?.price) || 0,
              };
            })
        );
      }
    });

    return pricedCustomizations;
  };

  const handleAddToBasket = () => {
    const missingSelection = offer?.items?.reduce((result, item) => {
      if (result) return result;
      const customizationGroups = normalizeCustomizationGroups(
        item.item.customization_group
      );
      if (!customizationGroups.length) return result;
      const itemCustomizations = selectedCustomizations[item.item._id] || [];

      for (let index = 0; index < itemCustomizations.length; index += 1) {
        const customizations = itemCustomizations[index] || [];

        for (const group of customizationGroups) {
          const rule = group?.selectionRule;
          if (!rule?.isRequired) continue;
          const minRequired = parseRuleValue(rule.min);
          if (!minRequired) continue;

          const selectedCount = getSelectedIdsForGroup(
            customizations,
            group
          ).length;
          if (selectedCount < minRequired) {
            return {
              itemName: `${item.item.name} - ${group?.name || "Personnalisation"}`,
              minRequired,
              index,
            };
          }
        }
      }

      return result;
    }, null);

    if (missingSelection) {
      toast.error(
        `Veuillez selectionner au moins ${missingSelection.minRequired} option(s) pour ${missingSelection.itemName} (${
          missingSelection.index + 1
        }).`
      );
      return;
    }

    const pricedCustomizations = buildPricedCustomizations();

    if (!offerFromBasket) {
      addOfferToBasket({
        id: offer._id,
        name: offer.name,
        image: offer.image,
        price: calculateTotalPrice(),
        customization: pricedCustomizations,
        items: offer.items,
        comment: comment,
      });
      toast.success("Offre ajoutée au panier !");
      setShowOfferModal(false);
    } else {
      updateOfferInBasket({
        uid: offerFromBasket.uid,
        price: calculateTotalPrice(),
        customizations: pricedCustomizations,

        comment: comment,
      });
      toast.success("Offre mise à jour dans le panier !");
      setShowOfferModal(false);
    }
  };
  useEffect(() => {
    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

  return (
    <div
      className={`h-screen bg-[#F3F4F6] fixed inset-0 z-40 w-full md:px-14 px-4  overflow-y-auto text-black duration-400 ease-in-out ${
        showOfferModal ? "" : "translate-y-[100%]"
      } `}
    >
      {loading ? (
        <ItemLoadingSkeleton />
      ) : (
        <div className=" ">
          <div className="flex justify-end py-4">
            <button
              className="text-black p-2 cursor-pointer"
              onClick={() => setShowOfferModal(false)}
            >
              <AiOutlineClose size={32} />
            </button>
          </div>
          <div className=" flex md:flex-row flex-col md:gap-10 gap-5 items-start pb-10 ">
            <div className="md:w-1/2 w-full rounded-md  shadow-lg  bg-white ">
              <div className="md:px-10 md:py-8  px-0 py-0 ">
                <Image
                  src={offer.image}
                  alt={offer.name}
                  width={300}
                  height={300}
                  className="md:mx-auto h-full w-full md:rounded-md rounded-t-md"
                />
              </div>
            </div>
            <div className="md:w-1/2 w-full rounded-md shadow-lg bg-white p-6   ">
              <h2 className="font-bebas-neue text-2xl">{offer.name}</h2>
              <div className="flex justify-between items-center mt-2">
                <h4 className="md:text-2xl text-xl font-bebas-neue text-pr ">
                  ${calculateTotalPrice().toFixed(2)}
                </h4>
              </div>
              <div className="mt-4">
                {offer.items.map((item) => (
                  <div key={item._id} className="flex  mb-2 gap-2">
                    <Image
                      src={item.item.image}
                      alt={item.item.name}
                      width={50}
                      height={50}
                      className="rounded-md h-12 w-12 object-cover"
                    />
                    <div className="flex md:flex-row flex-col items-start gap-1">
                      <p className="font-inter font-semibold md:text-base text-sm">
                        {item.quantity} x {item.item.name}
                      </p>
                      <span className="text-gray-500  md:text-base text-sm font-inter font-semibold">
                        ({item.size})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                {offer.items.map((item) => {
                  return (
                    <div key={item._id} className="my-4">
                      {Array.from({ length: item.quantity }).map((_, index) => {
                        const customizationGroups = normalizeCustomizationGroups(
                          item.item.customization_group
                        );
                        const hasCustomizationGroup =
                          customizationGroups.length > 0;
                        const currentSelections =
                          selectedCustomizations[item.item._id]?.[index] || [];
                        const selectedEntries =
                          normalizeSelectionEntries(currentSelections);
                        const selectedIds = selectedEntries.map(
                          (selection) => selection._id
                        );

                        return (
                          <div key={index} className="my-2">
                            <p className="font-inter font-semibold text-lg">
                              {item.item.name} ({index + 1})
                            </p>
                            {hasCustomizationGroup
                              ? customizationGroups.map((group) => {
                                  const selectedIdsInGroup =
                                    getSelectedIdsForGroup(
                                      selectedEntries,
                                      group
                                    );
                                  const freeLimit = getFreeLimit(
                                    group?.selectionRule
                                  );
                                  const selectionSummary =
                                    getSelectionSummaryText(
                                      group?.selectionRule
                                    );

                                  return (
                                    <div
                                      key={group?._id || group?.name}
                                      className="mt-2"
                                    >
                                      <p className="font-inter font-semibold text-base">
                                        {group?.name}{" "}
                                        {selectionSummary ? selectionSummary : ""}
                                      </p>
                                      {(group?.toppings || []).map((topping) => {
                                        const selectedIndex =
                                          selectedIdsInGroup.indexOf(topping._id);
                                        const isSelected = selectedIndex !== -1;
                                        const isExtraSelection =
                                          freeLimit !== Infinity &&
                                          selectedIndex >= freeLimit;
                                        const shouldShowExtraPrice =
                                          Number(topping?.price) > 0 &&
                                          freeLimit !== Infinity &&
                                          (isExtraSelection ||
                                            (!isSelected &&
                                              selectedIdsInGroup.length >=
                                                freeLimit));

                                        return (
                                          <button
                                            key={`${group?._id || group?.name}-${topping._id}`}
                                            type="button"
                                            className="w-full flex border-2 rounded-md border-[#E5E7EB] p-2 justify-between mb-2 mt-2"
                                            onClick={() =>
                                              handleCustomizationChange(
                                                item.item._id,
                                                topping,
                                                index
                                              )
                                            }
                                          >
                                            <div className="flex items-center gap-2">
                                              <div className="border border-black h-5 w-5 rounded-sm flex justify-center items-center">
                                                {isSelected && (
                                                  <span className="text-pr text-sm">
                                                    <FaCheck />
                                                  </span>
                                                )}
                                              </div>
                                              <p className="text-sm capitalize font-inter font-medium">
                                                {topping.name}
                                              </p>
                                            </div>
                                            {shouldShowExtraPrice && (
                                              <p className="font-bebas-neue text-pr md:text-xl text-base">
                                                + $
                                                {Number(topping.price).toFixed(
                                                  2
                                                )}
                                              </p>
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  );
                                })
                              : (item.item.customization || []).map((c) => {
                                  const isSelected = selectedIds.includes(c._id);
                                  return (
                                    <button
                                      key={c._id}
                                      type="button"
                                      className={`w-full flex border-2 rounded-md border-[#E5E7EB] p-2 justify-between mb-2 mt-2`}
                                      onClick={() =>
                                        handleCustomizationChange(
                                          item.item._id,
                                          c,
                                          index
                                        )
                                      }
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="border border-black h-5 w-5 rounded-sm flex justify-center items-center">
                                          {isSelected && (
                                            <span className="text-pr text-sm">
                                              <FaCheck />
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm capitalize font-inter font-medium">
                                          {c.name}
                                        </p>
                                      </div>
                                      <p className="font-bebas-neue text-pr md:text-xl text-base">
                                        + ${c.price.toFixed(2)}
                                      </p>
                                    </button>
                                  );
                                })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                <div className="mt-6">
                  <IoChatbubble className="text-pr text-xl" />
                  <textarea
                    className="border border-[#E5E7EB] rounded-md p-2 w-full mt-3"
                    rows="3"
                    placeholder="Ajouter un commentaire..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <div className="py-4 border-t border-gray-200 mt-6">
                  <div className="flex justify-between items-center">
                    <p className="font-inter font-semibold md:text-xl text-base">
                      Total
                    </p>
                    <p className="font-inter font-semibold md:text-xl text-base">
                      ${calculateTotalPrice().toFixed(2)}
                    </p>
                  </div>
                  <button
                    className="bg-pr text-black flex justify-center items-center cursor-pointer mt-4 py-3 w-full rounded-md"
                    onClick={handleAddToBasket}
                  >
                    <FaCartPlus className="mr-4 md:text-xl text-lg" />
                    <span className="font-bebas-neue md:text-xl text-lg">
                      {!offerFromBasket
                        ? "Ajouter au panier"
                        : "Mettre à jour le panier"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferModal;
