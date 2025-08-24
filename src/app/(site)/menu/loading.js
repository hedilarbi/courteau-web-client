import ItemsSkeleton from "@/components/ItemsSkeleton";
import MenuItemsSkeleton from "@/components/MenuItemsSkeleton";
import React from "react";

const loading = () => {
  return (
    <div className="w-full md:mt-28 mt-20">
      <div className="py-6 shadow-md border-b border-gray-200 md:px-24 px-6 ">
        <ItemsSkeleton
          count={9}
          gap={8}
          className="rounded-full md:h-24 md:w-24 h-16 w-16 flex-none shadow-md "
        />
      </div>
      <div className="md:px-24 px-6 py-12">
        <MenuItemsSkeleton count={9} className="h-72 rounded-md" />
      </div>
    </div>
  );
};

export default loading;
