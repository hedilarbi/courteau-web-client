import React from "react";
import Image from "next/image";

import Link from "next/link";
import SelectMenuItemButton from "./SelectMenuItemButton";

export default function MenuItemsSection({ items, selectedCategory }) {
  if (selectedCategory === "offres") {
    return (
      <div className="md:px-24 px-6 pt-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
          {items.map((item) => (
            <div key={item._id} className="bg-white shadow-md rounded-2xl">
              <Image
                src={item.image}
                alt={item.name}
                width={800}
                height={600}
                sizes="(max-width:768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="w-full h-64 object-cover rounded-t-2xl"
              />
              <div className="p-4">
                <Link href={`/menu/offres/${item.slug}`} className="block">
                  <h3 className="text-lg font-semibold font-inter">
                    {item.name}
                  </h3>
                </Link>
                <p className="font-inter text-[#717171] md:text-lg text-base font-medium mt-2">
                  ${item.price.toFixed(2)}
                </p>
                <SelectMenuItemButton
                  itemId={item._id}
                  selectedCategory={selectedCategory}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="md:px-24 px-6 pt-8 pb-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
        {items.map((item) => (
          <div key={item._id} className="bg-white shadow-md rounded-2xl">
            <Image
              src={item.image}
              alt={item.name}
              width={800}
              height={600}
              sizes="(max-width:768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="w-full h-64 object-cover rounded-t-2xl"
            />
            <div className="p-4">
              <Link href={`/menu/articles/${item.slug}`} className="block">
                <h3 className="text-lg font-semibold font-inter">
                  {item.name}
                </h3>
              </Link>
              <p className="font-inter text-[#717171] md:text-lg text-base font-medium mt-2">
                À partir de : ${item.prices?.[0]?.price.toFixed(2)}
              </p>
              <SelectMenuItemButton
                itemId={item._id}
                selectedCategory={selectedCategory}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
