import CategoriesSection from "@/components/CategoriesSection";
import HomeBirthdayCard from "@/components/HomeBirthdayCard";
import GetAppSection from "@/components/GetAppSection";
import HomeHero from "@/components/HomeHero";
import HomeSubscriptionCard from "@/components/HomeSubscriptionCard";
import HomeSubscriptionFreeItemCard from "@/components/HomeSubscriptionFreeItemCard";
import OffresSection from "@/components/OffresSection";
import OrderOnlineSection from "@/components/OrderOnlineSection";
import VedetteSection from "@/components/VedetteSection";
import HomeSmartOfferCard from "@/components/HomeSmartOfferCard";
import SmartOfferModal from "@/components/SmartOfferModal";
import React from "react";
import Script from "next/script";
import { SITE_URL } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  alternates: { canonical: "/" },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "Casse-Croûte Courteau",
  url: SITE_URL,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Casse-Croûte Courteau",
  url: SITE_URL,
  logo: `${SITE_URL}/logo-ld.png`,
  telephone: "+1-819-371-3935",
  email: "support@lecourteau.com",
  sameAs: [
    "https://www.facebook.com/cassecroutecourto",
    "https://www.instagram.com/casse_croute_courteau",
  ],
};

const page = () => {
  return (
    <>
      <SmartOfferModal />
      <HomeHero />
      <HomeSmartOfferCard />
      <HomeSubscriptionCard />
      <HomeSubscriptionFreeItemCard />
      <HomeBirthdayCard />
      <VedetteSection />
      <CategoriesSection />
      <OffresSection />
      <OrderOnlineSection />
      <GetAppSection />
      <Script
        id="ld-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Script
        id="ld-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
    </>
  );
};

export default page;
