import React from "react";

import OffresSectionContent from "./OffresSectionContent";

const OffresSection = () => {
  return (
    <div className="md:py-10 md:px-14 px-4 pt-4 pb-8">
      <div>
        <h2 className="font-bebas-neue md:text-5xl text-2xl  text-center tracking-wider ">
          Nos Offres
        </h2>
      </div>
      <OffresSectionContent />
    </div>
  );
};

export default OffresSection;
