"use client";
import { useBasket } from "@/context/BasketContext";
import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaCartPlus, FaCheck, FaRulerCombined } from "react-icons/fa";
import { IoChatbubble } from "react-icons/io5";

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

const getSelectedIdsForGroup = (selectedIds, group) => {
  if (!Array.isArray(selectedIds) || !group) return [];
  const groupToppingIds = new Set((group.toppings || []).map((t) => t?._id));
  return selectedIds.filter((id) => groupToppingIds.has(id));
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

const ArticleComponent = ({ item }) => {
  const { addToBasket } = useBasket();

  const [selectedSize, setSelectedSize] = useState(item.prices[0]);
  const customizationGroups = useMemo(
    () => normalizeCustomizationGroups(item?.customization_group),
    [item?.customization_group]
  );
  const usingCustomizationGroup = customizationGroups.length > 0;
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  const legacyCustomizations = useMemo(() => {
    if (usingCustomizationGroup) return {};
    const customizations = item?.customization || [];
    const customizationList = {};
    customizations.forEach((customization) => {
      if (!customizationList[customization.category?.name]) {
        customizationList[customization.category?.name] = [];
      }

      customizationList[customization.category.name].push({
        ...customization,
        state: false,
      });
    });
    return customizationList;
  }, [item?.customization, usingCustomizationGroup]);

  const [categorizedCustomization, setCategorizedCustomization] =
    useState(legacyCustomizations);
  const [comment, setComment] = useState("");

  const selectedGroupItems = useMemo(() => {
    if (!usingCustomizationGroup) return [];
    const selectedItems = [];

    customizationGroups.forEach((group) => {
      const freeLimit = getFreeLimit(group?.selectionRule);
      const selectedIdsInGroup = getSelectedIdsForGroup(selectedGroupIds, group);
      selectedIdsInGroup.forEach((selectedId, index) => {
        const topping = (group?.toppings || []).find(
          (candidate) => candidate?._id === selectedId
        );
        if (!topping) return;
        selectedItems.push({
          ...topping,
          price:
            freeLimit !== Infinity && index >= freeLimit
              ? Number(topping.price) || 0
              : 0,
        });
      });
    });

    return selectedItems;
  }, [usingCustomizationGroup, customizationGroups, selectedGroupIds]);

  const selectedItems = useMemo(() => {
    if (usingCustomizationGroup) return selectedGroupItems;

    return Object.keys(categorizedCustomization).reduce((result, category) => {
      const elements = categorizedCustomization[category];
      const selectedItemsList = elements.filter(
        (element) => element.state === true
      );
      return [...result, ...selectedItemsList];
    }, []);
  }, [usingCustomizationGroup, selectedGroupItems, categorizedCustomization]);

  const calculateTotalPrice = () => {
    let newPrice = selectedSize?.price || 0;

    if (selectedItems && selectedItems.length > 0) {
      selectedItems.map((item) => (newPrice += item.price));
    }

    return newPrice;
  };
  const handleCustomizationChange = (categoryName, itemId) => {
    let copy = { ...categorizedCustomization };
    copy[categoryName] = copy[categoryName].map((element) => {
      if (element._id === itemId) {
        return { ...element, state: !element.state };
      }
      return element;
    });
    setCategorizedCustomization(copy);
  };

  const handleGroupCustomizationChange = (itemId) => {
    setSelectedGroupIds((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      }
      return [...prev, itemId];
    });
  };

  const handleAddToBasket = () => {
    if (usingCustomizationGroup) {
      for (const group of customizationGroups) {
        const rule = group?.selectionRule;
        const minRequired = rule?.isRequired ? parseRuleValue(rule?.min) : 0;
        if (!minRequired) continue;
        const selectedCount = getSelectedIdsForGroup(
          selectedGroupIds,
          group
        ).length;
        if (selectedCount < minRequired) {
          toast.error(
            `Veuillez selectionner au moins ${minRequired} option(s) pour ${group?.name || "ce groupe"}.`
          );
          return;
        }
      }
    }

    addToBasket({
      id: item._id,
      name: item.name,
      image: item.image,
      price: calculateTotalPrice(),
      size: selectedSize,
      customization: selectedItems,
      comment: comment,
    });
    toast.success("Article ajouté au panier");
  };

  return (
    <div className="md:w-1/2 w-full rounded-md shadow-lg bg-white p-6   ">
      <h2 className="font-bebas-neue md:text-2xl text-xl">{item.name}</h2>
      <div className="flex justify-between items-center mt-2">
        <h4 className="md:text-2xl text-xl font-bebas-neue text-pr ">
          ${calculateTotalPrice().toFixed(2)}
        </h4>
        <div className="bg-pr text-black rounded-full px-6 py-2">
          <p className="font-bebas-neue md:text-lg text-sm">
            {item.category.name}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex  gap-2">
          <div className="text-pr text-xl md:text-2xl">
            <FaRulerCombined />
          </div>
          <p className="font-inter font-semibold md:text-xl text-base mt-0.5">
            Choisissez votre taille
          </p>
        </div>
        <div className="flex gap-2 md:gap-4 mt-4 justify-between flex-wrap">
          {item.prices.map((price) => (
            <button
              key={price._id}
              className={`border rounded-md md:px-4 px-2 items-center md:py-4 py-2 flex  md:gap-6 gap-3 cursor-pointer ${
                selectedSize?._id === price._id
                  ? "border-2 border-pr"
                  : "border-2 border-[#E5E7EB]"
              }`}
              onClick={() => setSelectedSize(price)}
            >
              <span className="md:text-lg text-xs font-inter font-semibold  capitalize">
                {price.size}
              </span>
              <span className="text-pr font-bebas-neue md:text-xl text-base">
                ${price.price.toFixed(2)}
              </span>
            </button>
          ))}
        </div>
        {usingCustomizationGroup ? (
          <div className="mt-4 ">
            <p className="text-base font-inter font-semibold capitalize">
              Personnaliser
            </p>
            {customizationGroups.map((group) => {
              const selectedIdsInGroup = getSelectedIdsForGroup(
                selectedGroupIds,
                group
              );
              const freeLimit = getFreeLimit(group?.selectionRule);
              const selectionSummary = getSelectionSummaryText(
                group?.selectionRule
              );

              return (
                <div key={group?._id || group?.name} className="mt-3">
                  <p className="text-sm font-inter font-semibold capitalize">
                    {group?.name} {selectionSummary}
                  </p>
                  {(group?.toppings || []).map((topping) => {
                    const selectedIndex = selectedIdsInGroup.indexOf(
                      topping._id
                    );
                    const isSelected = selectedIndex !== -1;
                    const isExtraSelection =
                      freeLimit !== Infinity && selectedIndex >= freeLimit;
                    const shouldShowExtraPrice =
                      Number(topping?.price) > 0 &&
                      freeLimit !== Infinity &&
                      (isExtraSelection ||
                        (!isSelected &&
                          selectedIdsInGroup.length >= freeLimit));

                    return (
                      <button
                        key={`${group?._id || group?.name}-${topping._id}`}
                        className="w-full flex border-2 rounded-md border-[#E5E7EB] p-2 justify-between mb-2 mt-2"
                        onClick={() => handleGroupCustomizationChange(topping._id)}
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
                            + ${Number(topping.price).toFixed(2)}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          Object?.entries(categorizedCustomization).map(([key, toppings]) => {
            return (
              <div key={key} className="mt-4 ">
                <p className="text-base font-inter font-semibold capitalize">
                  {key}
                </p>
                {toppings?.map((topping) => {
                  return (
                    <button
                      key={topping._id}
                      className="w-full flex border-2 rounded-md border-[#E5E7EB] p-2 justify-between mb-2 mt-2"
                      onClick={() =>
                        handleCustomizationChange(
                          topping.category.name,
                          topping._id
                        )
                      }
                    >
                      <div className="flex items-center gap-2">
                        <div className="border border-black h-5 w-5 rounded-sm flex justify-center items-center">
                          {topping.state && (
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
                        + ${topping.price.toFixed(2)}
                      </p>
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
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
            className="bg-pr text-black flex justify-center items-center  mt-4   py-3 w-full rounded-md"
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

export default ArticleComponent;
