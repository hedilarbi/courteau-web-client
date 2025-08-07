import React from "react";
import VedetteSectionContent from "./VedetteSectionContent";

const VedetteSection = () => {
  return (
    <div className="md:py-16 md:px-14 p-4">
      <h2 className="font-bebas-neue md:text-5xl text-2xl  text-center tracking-wider ">
        En vedette
      </h2>
      <VedetteSectionContent />
    </div>
  );
};

export default VedetteSection;
