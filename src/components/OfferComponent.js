"use client";
import { useBasket } from "@/context/BasketContext";
import Image from "next/image";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { FaCartPlus, FaCheck } from "react-icons/fa6";
import { IoChatbubble } from "react-icons/io5";

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
    let totalPrice = offer.price || 0;

    offer.items.forEach((item) => {
      const itemCustomizations = selectedCustomizations[item.item._id];

      itemCustomizations.forEach((customizations) => {
        customizations.forEach((customizationId) => {
          const customization = item.item.customization.find(
            (c) => c._id === customizationId._id
          );

          totalPrice += customization.price;
        });
      });
    });

    return totalPrice; //
  };

  const handleCustomizationChange = (itemId, customization, index) => {
    const updatedCustomizations = { ...selectedCustomizations };
    const currentCustomizations = updatedCustomizations[itemId][index];

    const existingIndex = currentCustomizations.findIndex(
      (c) => c._id === customization._id
    );

    if (existingIndex !== -1) {
      // Remove customization if already selected
      updatedCustomizations[itemId][index] = currentCustomizations.filter(
        (c) => c._id !== customization._id
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

  const handleAddToBasket = () => {
    addOfferToBasket({
      id: offer._id,
      name: offer.name,
      image: offer.image,
      price: calculateTotalPrice(),
      customization: selectedCustomizations,
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
              }).map((_, index) => (
                <div key={index} className="my-2">
                  <p className="font-inter font-semibold text-lg">
                    {item.item.name} ({index + 1})
                  </p>
                  {item.item.customization.map((c) => {
                    const isSelected = selectedCustomizations[item.item._id][
                      index
                    ].some((selected) => selected._id === c._id);
                    return (
                      <button
                        key={c._id}
                        type="button"
                        className={`w-full flex border-2 rounded-md border-[#E5E7EB] p-2 justify-between mb-2 mt-2`}
                        onClick={() =>
                          handleCustomizationChange(item.item._id, c, index)
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
              ))}
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
