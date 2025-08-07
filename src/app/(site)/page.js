import CategoriesSection from "@/components/CategoriesSection";
import GetAppSection from "@/components/GetAppSection";
import HomeHero from "@/components/HomeHero";
import OffresSection from "@/components/OffresSection";
import OrderOnlineSection from "@/components/OrderOnlineSection";
import VedetteSection from "@/components/VedetteSection";
import React from "react";

const page = () => {
  return (
    <>
      <HomeHero />
      <VedetteSection />
      <CategoriesSection />
      <OffresSection />
      <OrderOnlineSection />
      <GetAppSection />
    </>
  );
};

export default page;
