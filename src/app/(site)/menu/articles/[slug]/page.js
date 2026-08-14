// app/menu/articles/[slug]/page.jsx
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { SITE_URL } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "https://api.lecourteau.com/api";

async function fetchItem(slug) {
  const res = await fetch(
    `${API_URL}/menuItems/slug/${encodeURIComponent(slug)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

async function fetchRelatedItems(categorySlug, currentItem) {
  if (!categorySlug) return [];

  try {
    const res = await fetch(
      `${API_URL}/menuItems/category/slug/${encodeURIComponent(categorySlug)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];

    const items = await res.json();
    if (!Array.isArray(items)) return [];

    return items
      .filter((relatedItem) => {
        const relatedSlug = String(relatedItem?.slug || "").trim();
        const relatedName = String(relatedItem?.name || "").trim();
        const status = String(relatedItem?.status || "").toLowerCase();
        const isCurrentItem =
          String(relatedItem?._id || "") === String(currentItem?._id || "") ||
          relatedSlug === String(currentItem?.slug || "");

        return (
          relatedSlug &&
          relatedName &&
          !isCurrentItem &&
          relatedItem.is_available !== false &&
          relatedItem.active !== false &&
          relatedItem.isActive !== false &&
          relatedItem.published !== false &&
          relatedItem.isPublished !== false &&
          !relatedItem.deleted &&
          !relatedItem.isDeleted &&
          !relatedItem.deletedAt &&
          !["draft", "deleted", "disabled", "inactive", "unpublished"].includes(
            status
          )
        );
      })
      .slice(0, 4);
  } catch {
    return [];
  }
}

function cleanMetadataText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// SEO dynamique pour chaque article (JS, sans types)
export async function generateMetadata({ params }) {
  const { slug: menuItemSlug } = await params;
  const slug = decodeURIComponent(menuItemSlug);
  const base = SITE_URL;
  const item = await fetchItem(slug);

  if (!item) {
    return {
      title: { absolute: "Article introuvable | Casse-Croûte Courteau" },
      robots: { index: false, follow: false },
    };
  }

  const title = `${item.name} | Casse-Croûte Courteau`;
  const productDescription = cleanMetadataText(item.description);
  const productName = cleanMetadataText(item.name);
  const desc =
    productDescription ||
    `Découvrez ${productName} au Casse-Croûte Courteau. Consultez les détails et commandez en ligne.`;
  const url = `${base}/menu/articles/${item.slug}`;
  const ogImage = item.image?.startsWith("http")
    ? item.image
    : `${base}${item.image}`;

  return {
    title: { absolute: title },
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
import BackButton from "@/components/BackButton";

export default async function Page({ params }) {
  const { slug: menuItemSlug } = await params;
  const slug = decodeURIComponent(menuItemSlug);
  const item = await fetchItem(slug);
  if (!item) notFound();
  const relatedItems = await fetchRelatedItems(item.category?.slug, item);

  const base = SITE_URL;
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
              item: `${base}/menu?category=${encodeURIComponent(
                item.category.slug
              )}`,
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
    <div className="mt-6 md:mt-6 bg-[#F3F4F6] w-full md:px-14 ">
      <BackButton />
      <nav aria-label="Fil d’Ariane" className="mb-4 text-sm mt-4">
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
                  href={{
                    pathname: "/menu",
                    query: { category: item.category.slug ?? "" },
                  }}
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

      <div className="flex md:flex-row flex-col md:gap-10 gap-5 items-start">
        {/* Colonne visuel + description */}
        <article className="md:w-1/2 w-full rounded-md shadow-lg bg-white">
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

      {relatedItems.length > 0 && (
        <section className="mt-10 pb-10" aria-labelledby="related-items-title">
          <h2
            id="related-items-title"
            className="font-bebas-neue text-2xl font-bold md:text-3xl"
          >
            Vous aimerez aussi
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedItems.map((relatedItem) => (
              <Link
                key={relatedItem._id || relatedItem.slug}
                href={`/menu/articles/${relatedItem.slug}`}
                className="overflow-hidden rounded-md bg-white shadow-md"
              >
                {relatedItem.image && (
                  <Image
                    src={relatedItem.image}
                    alt={relatedItem.name}
                    width={500}
                    height={375}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="h-48 w-full object-cover"
                  />
                )}
                <span className="block p-4 font-inter font-semibold">
                  {relatedItem.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

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
