import Image from "next/image";
import React from "react";
import { FaStore, FaHeart, FaLeaf, FaUsers } from "react-icons/fa";

import { IoReceipt } from "react-icons/io5";

import Link from "next/link";
import Script from "next/script";

export const dynamic = "force-static"; // page 100% statique
export const revalidate = 2592000;

export async function generateMetadata() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com";
  const brand = "Casse-Croûte Courteau";
  const title = `À propos | ${brand}`;
  const description =
    "Découvrez l’histoire et les valeurs du Casse-Croûte Courteau : fraîcheur, passion et communauté au cœur de la Mauricie. Commandez en ligne.";

  return {
    title,
    description,
    alternates: { canonical: `${base}/a-propos` },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      url: `${base}/a-propos`,
      title,
      description,
      siteName: brand,
      locale: "fr_CA",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function Page() {
  const brand = "Casse-Croûte Courteau";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com";

  // JSON-LD Restaurant + AboutPage + Breadcrumbs (Canada, fr-CA, CAD)
  const ldRestaurant = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: brand,
    url: `${base}`,
    image: `${base}/og/cover.jpg`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Trois-Rivières",
      addressRegion: "QC",
      addressCountry: "CA",
    },
    areaServed: ["Trois-Rivières", "Mauricie"],
    servesCuisine: ["Casse-croûte", "Poutine", "Burgers", "Sandwichs"],
    priceRange: "$$",
    slogan: "Fraîcheur, passion et communauté.",
    sameAs: [
      // ajoute tes réseaux si tu veux
      // "https://www.facebook.com/lecourteau",
      // "https://www.instagram.com/lecourteau"
    ],
  };

  const ldAbout = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `À propos | ${brand}`,
    url: `${base}/a-propos`,
    mainEntity: ldRestaurant,
  };

  const ldBreadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${base}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "À propos",
        item: `${base}/a-propos`,
      },
    ],
  };

  return (
    <div className="md:mt-28 mt-18 pb-20" id="main">
      {/* Hero */}
      <section
        className="bg-black flex justify-center items-center md:h-[30vh] h-[40vh] "
        aria-labelledby="apropos-title"
      >
        <div className="px-4 text-center max-w-3xl">
          <h1
            id="apropos-title"
            className="text-white text-3xl md:text-5xl font-bold font-bebas-neue"
          >
            À propos de {brand}
          </h1>
          <p className="text-white text-base md:text-xl mt-4 font-inter font-semibold">
            Des plats frais et généreux, des saveurs onctueuses et une ambiance
            toujours conviviale.
          </p>
        </div>
      </section>

      {/* Chiffres clés */}
      <section
        className="md:px-14 px-4 md:py-10 py-6"
        aria-labelledby="chiffres-cles"
      >
        <h2 id="chiffres-cles" className="sr-only">
          Chiffres clés
        </h2>
        <div className="bg-pr rounded-3xl mx-auto md:w-3/4 w-full p-6 flex md:flex-row flex-col">
          <div className="flex-1 flex justify-center items-center md:border-r-2 border-b-2 md:border-b-0 border-r-0 border-black py-4">
            <IoReceipt className="md:text-4xl text-2xl" />
            <p className="font-inter font-semibold text-black ml-5 capitalize md:text-xl text-lg">
              64 recettes originales
            </p>
          </div>
          <div className="flex-1 flex justify-center items-center py-4">
            <FaStore className="md:text-4xl text-2xl" />
            <p className="font-inter font-semibold text-black ml-5 capitalize md:text-xl text-lg">
              5 succursales
            </p>
          </div>
        </div>
      </section>

      {/* Histoire */}
      <section
        className="md:px-14 px-4 md:py-10 py-6 flex items-stretch gap-14"
        aria-labelledby="histoire"
      >
        <div className="md:w-1/2 w-full hidden md:block">
          {/* This wrapper stretches to the same height as the text column */}
          <div className="relative h-full min-h-[280px]">
            <Image
              src="/about-image1.png"
              alt="Cuisine et équipe du Casse-Croûte Courteau à Trois-Rivières"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="rounded-lg shadow-md object-cover"
              priority
            />
          </div>
        </div>

        <div className="md:w-1/2 w-full">
          <h2
            id="histoire"
            className="font-bebas-neue font-bold text-4xl md:text-5xl"
          >
            Notre histoire
          </h2>
          <p className="font-inter text-base md:text-lg mt-4 font-medium text-[#374151]">
            Malgré sa petite taille, le casse-croûte Courteau s&apos;est donné
            l&apos;objectif de servir des repas frais et remplis de saveur à ses
            clients tous les jours dans son restaurant à Trois-Rivières. En
            effet, il n&apos;a jamais dérogé de sa mission depuis son ouverture
            en 2020. D&apos;abord un modeste comptoir servant des plats typiques
            de casse-croûte de bord de route, le Courteau s&apos;est peu à peu
            forgé une réputation à travers la région de Trois-Rivières en raison
            des variations de ses mets les plus populaires qui ont fini par
            attirer de plus en plus de gens. Aujourd&apos;hui, après plusieurs
            années passées à se démarquer grâce à son menu franchement
            savoureux, le Courteau peut enfin voir plus loin que sa première
            succursale de la rue des Prairies. Le restaurant compte maintenant
            cinq succursales à travers la Mauricie. Vous n&apos;avez donc plus
            vraiment d&apos;excuses pour ne pas essayer les fameux plats de ce
            restaurant d&apos;exception !
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/menu"
              prefetch
              className="bg-pr text-black px-4 py-2 rounded-md font-bebas-neue text-lg"
            >
              Voir le menu
            </Link>
            <Link
              href="/contact"
              prefetch
              className="border border-gray-300 px-4 py-2 rounded-md font-bebas-neue text-lg"
            >
              Nous joindre
            </Link>
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section
        className="mt-14 bg-[#F3F4F6] text-black py-8 px-6 w-full md:w-[95%] mx-auto"
        aria-labelledby="valeurs"
      >
        <h2
          id="valeurs"
          className="font-bebas-neue md:text-5xl text-3xl text-center"
        >
          Nos valeurs
        </h2>
        <p className="font-semibold font-inter text-lg mt-4 text-center">
          Les principes qui guident chaque aspect de notre restaurant et de
          notre service.
        </p>
        <div className="mt-10 flex md:flex-row flex-col md:px-20 justify-center items-center md:items-stretch gap-8">
          <div className="flex-1 flex flex-col items-center bg-white px-4 py-8 rounded-md shadow-2xl">
            <div className="bg-[#F7A700]/10 flex p-4 rounded-full justify-center items-center">
              <FaLeaf color="#F7A600" size={22} />
            </div>
            <h3 className="font-inter font-bold mt-4 text-xl text-center">
              Fraîcheur
            </h3>
            <p className="text-center font-inter mt-3 font-medium text-[#374151]">
              Ingrédients frais et locaux, sélectionnés avec soin, pour garantir
              la qualité et le goût.
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center bg-white px-4 py-8 rounded-md shadow-2xl">
            <div className="bg-[#F7A700]/10 p-4 rounded-full" aria-hidden>
              <FaHeart color="#F7A600" size={22} />
            </div>
            <h3 className="font-inter font-bold mt-4 text-xl text-center">
              Passion
            </h3>
            <p className="text-center font-inter mt-3 font-medium text-[#374151]">
              Des plats préparés avec amour et dévouement, au service d’une
              expérience chaleureuse.
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center bg-white px-4 py-8 rounded-md shadow-2xl">
            <div className="bg-[#F7A700]/10 p-4 rounded-full" aria-hidden>
              <FaUsers color="#F7A600" size={22} />
            </div>
            <h3 className="font-inter font-bold mt-4 text-xl text-center">
              Communauté
            </h3>
            <p className="text-center font-inter mt-3 font-medium text-[#374151]">
              Un lieu accueillant où se réunir et partager de bons moments, au
              cœur de la Mauricie.
            </p>
          </div>
        </div>
      </section>

      {/* JSON-LD */}
      <Script
        id="ld-restaurant"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldRestaurant) }}
      />
      <Script
        id="ld-about"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldAbout) }}
      />
      <Script
        id="ld-breadcrumbs"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBreadcrumbs) }}
      />
    </div>
  );
}
