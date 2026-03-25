"use client";
import { useBasket } from "@/context/BasketContext";
import Image from "next/image";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { FaCartPlus, FaCheck } from "react-icons/fa6";
import { IoChatbubble } from "react-icons/io5";

const parseRuleValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getMaxSelectionLimit = (rule) => {
  if (!rule) return Infinity;
  if (rule.max === null || rule.max === undefined) return Infinity;
  const max = parseRuleValue(rule.max);
  if (max !== null) return Math.max(0, max);
  return Infinity;
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
  const groupToppingIds = new Set(
    (group.toppings || []).map((t) => String(t?._id || ""))
  );
  return normalizedSelections
    .map((selection) => String(selection._id || ""))
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
    const selectedIdsInGroup = getSelectedIdsForGroup(normalizedSelections, group);
    selectedIdsInGroup.forEach((selectedId) => {
      const topping = (group?.toppings || []).find(
        (candidate) => String(candidate?._id || "") === String(selectedId || "")
      );
      const selected = selectionById.get(selectedId);
      pricedById.set(selectedId, {
        _id: selectedId,
        name: selected?.name || topping?.name || "",
        price: Number(topping?.price) || 0,
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

const OfferComponent = ({ offer }) => {
  const { addOfferToBasket } = useBasket();

  const initialCustomizations = {};
  offer.items.forEach((item) => {
    initialCustomizations[item.item._id] = Array.from(
      { length: item.quantity },
      () => []
    );
  });
  const [selectedCustomizations, setSelectedCustomizations] = useState(
    initialCustomizations
  );
  const [comment, setComment] = useState("");

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
    const targetOfferItem = offer?.items?.find(
      (entry) => entry?.item?._id === itemId
    );
    const customizationGroups = normalizeCustomizationGroups(
      targetOfferItem?.item?.customization_group
    );
    const targetGroup = customizationGroups.find((group) =>
      (group?.toppings || []).some(
        (topping) => topping?._id === customization?._id
      )
    );
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
      if (targetGroup) {
        const selectedIdsInGroup = getSelectedIdsForGroup(
          currentCustomizations,
          targetGroup
        );
        const maxSelections = getMaxSelectionLimit(targetGroup?.selectionRule);

        if (
          maxSelections !== Infinity &&
          selectedIdsInGroup.length >= maxSelections
        ) {
          toast.error(
            `Vous pouvez sélectionner au maximum ${maxSelections} option(s) pour ${targetGroup?.name || "ce groupe"}.`
          );
          return;
        }
      }
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
        ? "illimité"
        : maxNumeric;
    return `(min ${minDisplay} et max ${maxDisplay})`;
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
          const maxSelections = getMaxSelectionLimit(group?.selectionRule);
          if (maxSelections !== Infinity && selectedCount > maxSelections) {
            return {
              itemName: `${item.item.name} - ${group?.name || "Personnalisation"}`,
              maxSelections,
              index,
            };
          }
        }
      }

      return result;
    }, null);

    if (missingSelection?.maxSelections) {
      toast.error(
        `Vous pouvez sélectionner au maximum ${missingSelection.maxSelections} option(s) pour ${missingSelection.itemName} (${
          missingSelection.index + 1
        }).`
      );
      return;
    }

    if (missingSelection) {
      toast.error(
        `Veuillez selectionner au moins ${missingSelection.minRequired} option(s) pour ${missingSelection.itemName} (${
          missingSelection.index + 1
        }).`
      );
      return;
    }

    const pricedCustomizations = buildPricedCustomizations();

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
  };
  return (
    <div className="md:w-1/2 w-full rounded-md shadow-lg bg-white p-6   ">
      <h2 className="font-bebas-neue md:text-2xl text-xl">{offer.name}</h2>
      <div className="flex justify-between items-center mt-2">
        <h4 className="md:text-2xl text-xl font-bebas-neue text-pr ">
          ${calculateTotalPrice().toFixed(2)}
        </h4>
      </div>
      <div className="mt-4">
        {offer.items.map((item) => (
          <div key={item._id} className="flex items-center gap-2">
            <Image
              src={item.item.image}
              alt={item.item.name}
              width={50}
              height={50}
              className="rounded-full h-12 w-12 object-cover"
            />
            <p className="font-inter font-semibold text-base">
              {item.quantity} x {item.item.name}
            </p>
            <span className="text-gray-500 text-sm font-inter font-semibold">
              ({item.size})
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4">
        {offer.items.map((item) => {
          return (
            <div key={item._id} className="my-4">
              {Array.from({
                length: item.quantity,
              }).map((_, index) => {
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
                          const selectedIdsInGroup = getSelectedIdsForGroup(
                            selectedEntries,
                            group
                          );
                          const maxSelections = getMaxSelectionLimit(
                            group?.selectionRule
                          );
                          const selectionSummary = getSelectionSummaryText(
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
                                const isSelected = selectedIdsInGroup.includes(
                                  topping._id
                                );
                                const maxSelectionReached =
                                  maxSelections !== Infinity &&
                                  selectedIdsInGroup.length >= maxSelections;
                                const isSelectionDisabled =
                                  !isSelected && maxSelectionReached;

                                return (
                                  <button
                                    key={`${group?._id || group?.name}-${topping._id}`}
                                    type="button"
                                    className={`w-full flex border-2 rounded-md border-[#E5E7EB] p-2 justify-between mb-2 mt-2 ${
                                      isSelectionDisabled
                                        ? "opacity-60 cursor-not-allowed"
                                        : ""
                                    }`}
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
                                    <p className="font-bebas-neue text-pr md:text-xl text-base">
                                      + ${Number(topping.price).toFixed(2)}
                                    </p>
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
            className="bg-pr text-black flex justify-center items-center  mt-4  cursor-pointer  py-3 w-full rounded-md"
            onClick={handleAddToBasket}
          >
            <FaCartPlus className="mr-4 md:text-xl text-lg" />
            <span className="font-bebas-neue md:text-xl text-lg">
              Ajouter au panier
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferComponent;
