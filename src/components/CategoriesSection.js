import React from "react";

import CategoriesSectionContient from "./CategoriesSectionContient";

const CategoriesSection = () => {
  return (
    <div className="md:py-10 md:px-14 p-4">
      <h2 className="font-bebas-neue md:text-5xl text-2xl  text-center tracking-wider ">
        Nos Catégories
      </h2>

      <CategoriesSectionContient />
    </div>
  );
};

export default CategoriesSection;
