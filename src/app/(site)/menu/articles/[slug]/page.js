// app/menu/articles/[slug]/page.jsx
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";

export const dynamic = "force-static";
export const revalidate = 1800; // 30 min

async function fetchItem(slug) {
  const res = await fetch(
    `${process.env.API_URL}/menuItems/slug/${encodeURIComponent(slug)}`,
    { next: { revalidate: 1800, tags: ["menu", `product:${slug}`] } }
  );
  if (!res.ok) return null;
  return res.json();
}

// SEO dynamique pour chaque article (JS, sans types)
export async function generateMetadata({ params }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lecourteau.com";
  const item = await fetchItem(params.slug);

  if (!item) {
    return {
      title: "Article introuvable | Casse-Croûte Courteau",
      robots: { index: false, follow: false },
    };
  }

  const title = `${item.name} | Casse-Croûte Courteau`;
  const desc =
    (item.description && item.description.slice(0, 160)) ||
    `Découvrez ${item.name} et personnalisez votre commande en ligne.`;
  const url = `${base}/menu/articles/${item.slug}`;
  const ogImage = item.image?.startsWith("http")
    ? item.image
    : `${base}${item.image}`;

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
      images: [{ url: ogImage, width: 1200, height: 630, alt: item.name }],
      siteName: "Casse-Croûte Courteau",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [ogImage],
    },
  };
}

// Optionnel : pré-générer des slugs (laisse vide sinon)
export async function generateStaticParams() {
  return [];
}

import ArticleComponent from "@/components/ArticleComponent";

export default async function Page({ params }) {
  const slug = decodeURIComponent(params.slug);
  const item = await fetchItem(slug);
  if (!item) notFound();

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com";
  const pageUrl = `${base}/menu/articles/${item.slug}`;
  const imgAbs = item.image?.startsWith("http")
    ? item.image
    : `${base}${item.image}`;
  const price = item.prices?.[0]?.price ?? 0;

  const ldMenuItem = {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: item.name,
    image: imgAbs,
    description: item.description,
    offers: {
      "@type": "Offer",
      priceCurrency: "CAD",
      price: Number(price).toFixed(2),
      url: pageUrl,
      availability: "https://schema.org/InStock",
    },
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Menu", item: `${base}/menu` },
      ...(item.category?.slug
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: item.category.name,
              item: `${base}/menu?category=${item.category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: item.category?.slug ? 3 : 2,
        name: item.name,
        item: pageUrl,
      },
    ],
  };

  return (
    <div className="mt-10 md:mt-10 bg-[#F3F4F6] w-full md:px-14 ">
      {/* Fil d’Ariane HTML */}
      <nav aria-label="Fil d’Ariane" className="mb-4 text-sm">
        <ol className="flex flex-wrap items-center gap-1 text-gray-600">
          <li>
            <Link href="/menu" className="hover:underline">
              Menu
            </Link>
          </li>
          {item.category?.name && (
            <>
              <li aria-hidden>›</li>
              <li>
                <Link
                  href={`/menu?category=${item.category.slug ?? ""}`}
                  className="hover:underline"
                >
                  {item.category.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>›</li>
          <li aria-current="page" className="text-gray-900 font-medium">
            {item.name}
          </li>
        </ol>
      </nav>

      <div className="flex md:flex-row flex-col md:gap-10 gap-5 items-start py-10">
        {/* Colonne visuel + description */}
        <article className="md:w-1/2 w-full rounded-md shadow-lg bg-white">
          <h1 className="px-6 pt-6 md:px-8 md:pt-8 text-2xl md:text-3xl font-bold">
            {item.name}
          </h1>

          <div className=" md:px-8 md:py-4 px-0 py-0">
            <Image
              src={item.image}
              alt={item.name}
              width={800}
              height={600}
              sizes="(max-width:768px) 100vw, (max-width:1280px) 50vw, 640px"
              className="md:mx-auto h-full w-full  md:rounded-md rounded-t-md object-cover"
              priority
            />
          </div>

          {item.description && (
            <div className="md:px-8 px-6 md:py-4 py-3 bg-[#F9FAFB] rounded-b-md">
              <h2 className="md:text-2xl text-lg font-bold mb-2">
                Description
              </h2>
              <p className="text-[#374151] font-inter text-sm md:text-base leading-relaxed">
                {item.description}
              </p>
            </div>
          )}
        </article>

        {/* Colonne configurateur (client) */}
        <ArticleComponent item={item} />
      </div>

      {/* JSON-LD */}
      <Script
        id="ld-menuitem"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldMenuItem) }}
      />
      <Script
        id="ld-breadcrumbs"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
    </div>
  );
}
