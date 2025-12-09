// app/menu/page.jsx
export const revalidate = 1800; // ISR: regénère au plus toutes les 30 min
export const dynamic = "force-dynamic"; // force SSG si possible

import MenuContent from "@/components/MenuContent";
import Script from "next/script";

// 👉 Remplace par tes vrais appels serveur (ou direct DB)
async function fetchCategories() {
  const res = await fetch(`${process.env.API_URL}/categories`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

async function fetchItemsByCategory(categorySlug) {
  const res = await fetch(
    `${process.env.API_URL}/menuItems/category/slug/${categorySlug}`,
    {
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch items");
  }

  return res.json();
}

async function fetchAwards() {
  const res = await fetch(`${process.env.API_URL}/rewards`, {
    next: { revalidate: 1800, tags: ["menu", "rewards"] },
  });
  if (!res.ok) throw new Error("Failed to fetch awards");
  return res.json();
}

async function fetchOffers() {
  const res = await fetch(`${process.env.API_URL}/offers`, {
    next: { revalidate: 1800, tags: ["menu", "offers"] },
  });
  if (!res.ok) throw new Error("Failed to fetch offers");
  return res.json();
}
export default async function Page({ searchParams }) {
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
    typeof searchParams?.category === "string" ? searchParams.category : null;

  const knownIds = new Set((categories ?? []).map((c) => c.slug));

  const firstCategorySlug = categories?.[2]?.slug ?? null;
  let items = [];
  // Récupère les items de la catégorie sélectionnée ou de la première catégorie
  if (urlCategory && knownIds.has(urlCategory) && urlCategory === "offres") {
    items = await fetchOffers();
  } else if (
    urlCategory &&
    knownIds.has(urlCategory) &&
    urlCategory === "recompenses"
  ) {
    items = await fetchAwards();
  } else {
    items =
      urlCategory && knownIds.has(urlCategory)
        ? await fetchItemsByCategory(urlCategory)
        : await fetchItemsByCategory(firstCategorySlug);
  }

  const selectedCategorySlug = urlCategory ? urlCategory : firstCategorySlug;
  // JSON-LD ItemList pour la catégorie active (bonus SEO)
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement:
      items?.map((it, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `https://www.lecourteau.com/menu?category=${it.slug || it._id}`,
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
