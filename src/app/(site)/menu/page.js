// app/menu/page.jsx
export const dynamic = "force-dynamic";
export const viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

import MenuContent from "@/components/MenuContent";
import Script from "next/script";

// 👉 Remplace par tes vrais appels serveur (ou direct DB)
async function fetchCategories() {
  const res = await fetch(`${process.env.API_URL}/categories`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Impossible de récupérer les catégories.");
  }
  return res.json();
}

async function fetchItemsByCategory(categorySlug) {
  const res = await fetch(
    `${process.env.API_URL}/menuItems/category/slug/${categorySlug}`,
    {
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error("Impossible de récupérer les items.");
  }

  return res.json();
}

async function fetchAwards() {
  const res = await fetch(`${process.env.API_URL}/rewards`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Impossible de récupérer les récompenses.");
  }
  return res.json();
}

async function fetchOffers() {
  const res = await fetch(`${process.env.API_URL}/offers`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Impossible de récupérer les offres.");
  }
  return res.json();
}

function sortItemsByOrder(items = []) {
  if (!Array.isArray(items)) return [];

  return [...items].sort((a, b) => {
    const orderA = Number.isFinite(Number(a?.order))
      ? Number(a.order)
      : Number.POSITIVE_INFINITY;
    const orderB = Number.isFinite(Number(b?.order))
      ? Number(b.order)
      : Number.POSITIVE_INFINITY;

    if (orderA !== orderB) return orderA - orderB;

    return String(a?.name || "").localeCompare(String(b?.name || ""), "fr", {
      sensitivity: "base",
    });
  });
}
export default async function Page({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  let categories = [
    {
      _id: "recompenses",
      name: "Récompenses",
      slug: "recompenses",
      image: "/awards.png",
    },
    {
      _id: "offers",
      name: "Offres",
      slug: "offres",
      image: "/offres.webp", // Remplace par une image par défaut ou une
    },
  ];
  const res = await fetchCategories();

  categories = [...categories, ...res];

  const urlCategory =
    typeof resolvedSearchParams?.category === "string"
      ? resolvedSearchParams.category
      : null;

  const knownIds = new Set((categories ?? []).map((c) => c.slug));

  const firstCategorySlug = categories?.[2]?.slug ?? null;
  const isKnownCategory = urlCategory && knownIds.has(urlCategory);
  let items = [];
  // Récupère les items de la catégorie sélectionnée ou de la première catégorie
  if (isKnownCategory && urlCategory === "offres") {
    items = await fetchOffers();
  } else if (isKnownCategory && urlCategory === "recompenses") {
    items = await fetchAwards();
  } else {
    items = isKnownCategory
      ? await fetchItemsByCategory(urlCategory)
      : await fetchItemsByCategory(firstCategorySlug);
  }
  items = sortItemsByOrder(items);

  const selectedCategorySlug = isKnownCategory
    ? urlCategory
    : firstCategorySlug;
  // JSON-LD ItemList pour la catégorie active (bonus SEO)
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement:
      items?.map((it, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `https://www.lecourteau.com/menu?category=${encodeURIComponent(
          it.slug || it._id,
        )}`,
        name: it.name,
        image: it.image,
      })) ?? [],
  };

  return (
    <div className="md:mt-28 mt-20">
      <h1 className="sr-only">Menu</h1>

      {/* Contenu intercatif hydraté avec des données SSG */}
      <MenuContent
        categories={categories}
        items={items}
        selectedCategory={selectedCategorySlug}
      />

      {/* Données structurées ItemList */}
      {items?.length > 0 && (
        <Script
          id="ld-itemlist"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
        />
      )}
    </div>
  );
}
