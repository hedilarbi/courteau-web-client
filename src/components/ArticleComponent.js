"use client";
import { useBasket } from "@/context/BasketContext";
import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaCartPlus, FaCheck, FaRulerCombined } from "react-icons/fa";
import { IoChatbubble } from "react-icons/io5";

const ArticleComponent = ({ item }) => {
  const { addToBasket } = useBasket();

  const [selectedSize, setSelectedSize] = useState(item.prices[0]);

  const customizations = item?.customization || [];
  const CustomizationList = {};
  customizations.forEach((item) => {
    if (!CustomizationList[item.category.name]) {
      CustomizationList[item.category?.name] = [];
    }

    CustomizationList[item.category.name].push({
      ...item,
      state: false,
    });
  });

  const [categorizedCustomization, setCategorizedCustomization] =
    useState(CustomizationList);
  const [comment, setComment] = useState("");

  const calculateTotalPrice = () => {
    let newPrice = selectedSize.price;

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
  const selectedItems = useMemo(() => {
    return Object.keys(categorizedCustomization).reduce((result, category) => {
      const elements = categorizedCustomization[category];
      const selectedItemsList = elements.filter(
        (element) => element.state === true
      );
      return [...result, ...selectedItemsList];
    }, []);
  }, [categorizedCustomization]);

  const handleAddToBasket = () => {
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
        {Object?.entries(categorizedCustomization).map(([key, toppings]) => {
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
