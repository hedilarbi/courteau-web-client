// app/menu/offres/[slug]/page.jsx
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import OfferComponent from "@/components/OfferComponent";
import BackButton from "@/components/BackButton";

export const dynamic = "force-dynamic";

async function fetchOffer(slug) {
  const res = await fetch(
    `${process.env.API_URL}/offers/slug/${encodeURIComponent(slug)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

// (optionnel) pré-générer des slugs d’offres
export async function generateStaticParams() {
  // Si tu as un endpoint, décommente et adapte :
  // const r = await fetch(`${process.env.API_URL}/offers/top-slugs`, { next: { revalidate: 3600, tags: ["offers"] } });
  // if (!r.ok) return [];
  // const slugs = await r.json(); // ex: ["combo-courteau", "poutine-du-jour"]
  // return slugs.map((slug) => ({ slug }));
  return [];
}

// Métadonnées SEO par offre (Canada / fr-CA / CAD)
export async function generateMetadata({ params }) {
  const { slug: offerSlug } = await params;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com";
  const brand = "Casse-Croûte Courteau";
  const offer = await fetchOffer(offerSlug);

  if (!offer) {
    return {
      title: `Offre introuvable | ${brand}`,
      robots: { index: false, follow: false },
    };
  }

  const name = offer.name ?? "Offre spéciale";
  const title = `${name} | ${brand}`;
  const desc =
    (offer.description && offer.description.slice(0, 160)) ||
    `Profitez de l’offre ${name} chez ${brand}. Commandez en ligne.`;
  const url = `${base}/menu/offres/${offer.slug ?? params.slug}`;
  const img = offer.image?.startsWith("http")
    ? offer.image
    : `${base}${offer.image ?? ""}`;

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      url,
      title,
      description: desc,
      siteName: brand,
      locale: "fr_CA",
      images: [{ url: img, width: 1200, height: 630, alt: name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [img],
    },
  };
}

export default async function Page({ params }) {
  const brand = "Casse-Croûte Courteau";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com";
  const { slug: offerSlug } = await params;
  const slug = decodeURIComponent(offerSlug);

  const data = await fetchOffer(slug);
  if (!data) notFound();

  const name = data.name ?? "Offre spéciale";
  const description = data.description ?? "";
  const image = data.image;
  const price = Number(data.price ?? data.prix ?? 0);
  const validFrom = data.validFrom || data.startDate || null;
  const validTo = data.validTo || data.endDate || null;

  const pageUrl = `${base}/menu/offres/${data.slug ?? slug}`;
  const imgAbs = image?.startsWith("http")
    ? image
    : image
    ? `${base}${image}`
    : undefined;

  // JSON-LD Product + Offer (CAD)
  const ldOffer = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: name,
    ...(imgAbs ? { image: imgAbs } : {}),
    ...(description ? { description: description } : {}),
    brand: { "@type": "Organization", name: brand },
    category: "Restaurant Offer",
    offers: {
      "@type": "Offer",
      priceCurrency: "CAD",
      price: price > 0 ? price.toFixed(2) : "0.00",
      url: pageUrl,
      availability: "https://schema.org/InStock",
      ...(validFrom ? { priceValidFrom: validFrom } : {}),
      ...(validTo ? { priceValidUntil: validTo } : {}),
    },
  };

  // Fil d’Ariane
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Menu", item: `${base}/menu` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Offres",
        item: `${base}/menu?category=offres`,
      },
      { "@type": "ListItem", position: 3, name: name, item: pageUrl },
    ],
  };

  return (
    <div className="mt-6 md:mt-6 w-full md:px-14 ">
      <BackButton />
      {/* Fil d’Ariane visible */}
      <nav aria-label="Fil d’Ariane" className="mb-4 text-sm mt-4">
        <ol className="flex flex-wrap items-center gap-1 text-gray-600">
          <li>
            <Link href="/menu" className="hover:underline">
              Menu
            </Link>
          </li>
          <li aria-hidden>›</li>
          <li>
            <Link href="/menu?category=offres" className="hover:underline">
              Offres
            </Link>
          </li>
          <li aria-hidden>›</li>
          <li aria-current="page" className="text-gray-900 font-medium">
            {name}
          </li>
        </ol>
      </nav>

      <div className="flex md:flex-row flex-col md:gap-10 gap-5 items-start ">
        {/* Colonne visuel */}
        <article className="md:w-1/2 w-full rounded-md shadow-lg bg-white">
          <h1 className="px-6 pt-6 md:px-8 md:pt-8 text-2xl md:text-3xl font-bold">
            {name}
          </h1>

          {image && (
            <div className=" md:px-8 md:py-4 px-0 py-0">
              <Image
                src={image}
                alt={name}
                width={800}
                height={600}
                sizes="(max-width:768px) 100vw, (max-width:1280px) 50vw, 640px"
                className="md:mx-auto h-full w-full md:rounded-md rounded-t-md object-cover"
                priority
              />
            </div>
          )}

          {description && (
            <div className="md:px-8 px-6 md:py-4 py-3 bg-[#F9FAFB] rounded-b-md">
              <h2 className="md:text-2xl text-lg font-bold mb-2">
                Détails de l’offre
              </h2>
              <p className="text-[#374151] font-inter text-sm md:text-base leading-relaxed">
                {description}
              </p>
            </div>
          )}
        </article>

        {/* Colonne actions / infos (ton composant client) */}
        <OfferComponent offer={data} />
      </div>

      {/* JSON-LD */}
      <Script
        id="ld-offer"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldOffer) }}
      />
      <Script
        id="ld-breadcrumbs"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
    </div>
  );
}
