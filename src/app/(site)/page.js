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
import { SITE_URL } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HOME_DESCRIPTION =
  "Découvrez le Casse-Croûte Courteau à Trois-Rivières : poutines généreuses, pizzas, déjeuners, offres et commande en ligne.";

export const metadata = {
  title: {
    absolute: "Casse-Croûte Courteau | Poutine et pizza à Trois-Rivières",
  },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Casse-Croûte Courteau",
    title: "Casse-Croûte Courteau",
    description: HOME_DESCRIPTION,
    locale: "fr_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Casse-Croûte Courteau",
    description: HOME_DESCRIPTION,
  },
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
  logo: `${SITE_URL}/logo.svg`,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
};

export default page;
