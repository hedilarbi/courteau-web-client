import CategoriesSection from "@/components/CategoriesSection";
import HomeBirthdayCard from "@/components/HomeBirthdayCard";
import GetAppSection from "@/components/GetAppSection";
import HomeHero from "@/components/HomeHero";
import HomeSubscriptionCard from "@/components/HomeSubscriptionCard";
import HomeSubscriptionFreeItemCard from "@/components/HomeSubscriptionFreeItemCard";
import OffresSection from "@/components/OffresSection";
import OrderOnlineSection from "@/components/OrderOnlineSection";
import VedetteSection from "@/components/VedetteSection";
import React from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const page = () => {
  return (
    <>
      <HomeHero />
      <HomeSubscriptionCard />
      <HomeSubscriptionFreeItemCard />
      <HomeBirthdayCard />
      <VedetteSection />
      <CategoriesSection />
      <OffresSection />
      <OrderOnlineSection />
      <GetAppSection />
    </>
  );
};

export default page;
