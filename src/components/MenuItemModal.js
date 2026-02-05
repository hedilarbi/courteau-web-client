import { useBasket, useSelectBasketItemWithUID } from "@/context/BasketContext";
import { getMenuItem } from "@/services/FoodServices";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AiOutlineClose } from "react-icons/ai";
import { FaRulerCombined, FaCartPlus } from "react-icons/fa";
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
const MenuItemModal = ({
  itemId,
  setShowMenuItemModal,
  itemUID,
  showMenuItemModal,
}) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [customizationGroup, setCustomizationGroup] = useState(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [categorizedCustomization, setCategorizedCustomization] = useState({});
  const [comment, setComment] = useState("");
  const itemFromBasket = useSelectBasketItemWithUID(itemUID)[0];
  const usingCustomizationGroup = Boolean(
    customizationGroup?.toppings?.length
  );

  const { addToBasket, updateItemInBasket } = useBasket();
  const fetchItem = async () => {
    try {
      setLoading(true);
      const response = await getMenuItem(itemId);
      if (response.status) {
        console.log("Menu item response:", response.data);
        setItem(response.data);
        const groupData = response?.data?.customization_group;
        const hasGroup = Boolean(groupData?.toppings?.length);
        const basketCustomizations = itemFromBasket?.customization || [];

        if (!itemFromBasket) {
          setSelectedSize(response.data.prices[0]);
        } else {
          setSelectedSize(itemFromBasket.size);
          setComment(itemFromBasket.comment || "");
        }

        if (hasGroup) {
          setCustomizationGroup(groupData);
          setCategorizedCustomization({});
          setSelectedGroupIds(basketCustomizations.map((custom) => custom._id));
        } else {
          setCustomizationGroup(null);
          setSelectedGroupIds([]);
          const customizations = response?.data?.customization || [];
          const CustomizationList = {};
          customizations.forEach((customization) => {
            if (!CustomizationList[customization.category?.name]) {
              CustomizationList[customization.category?.name] = [];
            }
            const isSelected = basketCustomizations.some(
              (custom) =>
                custom?._id === customization._id ||
                custom?.name === customization.name
            );

            CustomizationList[customization.category.name].push({
              ...customization,
              state: isSelected,
            });
          });
          setCategorizedCustomization(CustomizationList);
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

  const selectedGroupItems = useMemo(() => {
    if (!usingCustomizationGroup) return [];
    const freeLimit = getFreeLimit(customizationGroup?.selectionRule);
    const toppings = customizationGroup?.toppings || [];

    return selectedGroupIds
      .map((id, index) => {
        const topping = toppings.find((item) => item._id === id);
        if (!topping) return null;
        return {
          ...topping,
          price:
            freeLimit !== Infinity && index >= freeLimit
              ? Number(topping.price) || 0
              : 0,
        };
      })
      .filter(Boolean);
  }, [usingCustomizationGroup, customizationGroup, selectedGroupIds]);

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

  const selectionSummary = useMemo(() => {
    if (!usingCustomizationGroup) return "";
    const rule = customizationGroup?.selectionRule;
    const minDisplay = parseRuleValue(rule?.min) || 0;
    const maxValue = rule?.max;
    const maxNumeric = parseRuleValue(maxValue);
    const maxDisplay =
      maxValue === null || maxValue === undefined || maxNumeric === null
        ? "illimite"
        : maxNumeric;

    return `(min ${minDisplay} gratuit et maximum ${maxDisplay})`;
  }, [usingCustomizationGroup, customizationGroup]);

  const handleAddToBasket = () => {
    if (usingCustomizationGroup) {
      const rule = customizationGroup?.selectionRule;
      const minRequired = rule?.isRequired ? parseRuleValue(rule?.min) : 0;
      if (minRequired && selectedGroupIds.length < minRequired) {
        toast.error(`Veuillez selectionner au moins ${minRequired} option(s).`);
        return;
      }
    }

    if (!itemFromBasket) {
      addToBasket({
        id: item._id,
        name: item.name,
        image: item.image,
        price: calculateTotalPrice(),
        size: selectedSize,
        customization: selectedItems,
        comment: comment,
      });
      toast.success("Article ajouté au panier !");
      setShowMenuItemModal(false);
    } else {
      updateItemInBasket({
        uid: itemFromBasket.uid,
        price: calculateTotalPrice(),
        size: selectedSize,
        customization: selectedItems,
        comment: comment,
      });
      toast.success("Article mis à jour dans le panier !");
      setShowMenuItemModal(false);
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
        showMenuItemModal ? "" : "translate-y-[100%]"
      } `}
    >
      <div className="flex justify-end py-4">
        <button
          className="text-black p-2 cursor-pointer"
          onClick={() => setShowMenuItemModal(false)}
        >
          <AiOutlineClose size={32} />
        </button>
      </div>
      {loading ? (
        <ItemLoadingSkeleton />
      ) : (
        <div className=" ">
          <div className=" flex md:flex-row flex-col md:gap-10 gap-5 items-start pb-10 ">
            <div className="md:w-1/2 w-full rounded-md  shadow-lg  bg-white ">
              <div className="md:px-10 md:py-8 px-0 py-0 ">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={300}
                  height={300}
                  className="md:mx-auto h-full w-full md:rounded-md rounded-t-md"
                />
              </div>
              <div className="md:px-8 p-4 md:py-4 bg-[#F9FAFB] rounded-b-md">
                <h3 className="md:text-2xl text-lg font-bold mb-2">
                  Description
                </h3>
                <p className="text-[#374151] font-inter font-medium text-sm md:text-lg ">
                  {item.description}
                </p>
              </div>
            </div>
            <div className="md:w-1/2 w-full rounded-md shadow-lg bg-white p-6   ">
              <h2 className="font-bebas-neue md:text-2xl text-xl">
                {item.name}
              </h2>
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
                      Personnaliser {selectionSummary}
                    </p>
                    {customizationGroup?.toppings?.map((topping) => {
                      const selectedIndex = selectedGroupIds.indexOf(
                        topping._id
                      );
                      const isSelected = selectedIndex !== -1;
                      const freeLimit = getFreeLimit(
                        customizationGroup?.selectionRule
                      );
                      const isExtraSelection =
                        freeLimit !== Infinity && selectedIndex >= freeLimit;
                      const shouldShowExtraPrice =
                        topping.price > 0 &&
                        freeLimit !== Infinity &&
                        (isExtraSelection ||
                          (!isSelected &&
                            selectedGroupIds.length >= freeLimit));

                      return (
                        <button
                          key={topping._id}
                          className="w-full flex border-2 rounded-md border-[#E5E7EB] p-2 justify-between mb-2 mt-2"
                          onClick={() =>
                            handleGroupCustomizationChange(topping._id)
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
                              + ${Number(topping.price).toFixed(2)}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  Object?.entries(categorizedCustomization).map(
                    ([key, toppings]) => {
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
                    }
                  )
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
                    className="bg-pr text-black flex justify-center items-center cursor-pointer  mt-4   py-3 w-full rounded-md"
                    onClick={handleAddToBasket}
                  >
                    <FaCartPlus className="mr-4 md:text-xl text-lg" />
                    <span className="font-bebas-neue md:text-xl text-lg">
                      {!itemFromBasket
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

export default MenuItemModal;
