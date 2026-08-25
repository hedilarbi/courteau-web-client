import MenuContent from "@/components/MenuContent";
import { SITE_URL } from "@/lib/siteUrl";
import { notFound } from "next/navigation";
import Script from "next/script";

export const dynamic = "force-dynamic";
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://api.lecourteau.com/api";
const specialCategories = [
  { _id: "recompenses", name: "Récompenses", slug: "recompenses", image: "/awards.png" },
  { _id: "offers", name: "Offres", slug: "offres", image: "/offres.webp" },
];

async function fetchJson(path, errorMessage) {
  const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(errorMessage);
  return response.json();
}

async function getItems(slug) {
  if (slug === "offres") {
    const offers = await fetchJson("/offers", "Impossible de récupérer les offres.");
    const now = Date.now();
    return (Array.isArray(offers) ? offers : []).filter((offer) => {
      const expiry = new Date(offer?.expireAt).getTime();
      return Number.isFinite(expiry) && expiry > now;
    });
  }
  if (slug === "recompenses") return fetchJson("/rewards", "Impossible de récupérer les récompenses.");
  return fetchJson(`/menuItems/category/slug/${encodeURIComponent(slug)}`, "Impossible de récupérer les articles.");
}

function sortItems(items = []) {
  return [...(Array.isArray(items) ? items : [])].sort((a, b) => {
    const aOrder = Number.isFinite(Number(a?.order)) ? Number(a.order) : Infinity;
    const bOrder = Number.isFinite(Number(b?.order)) ? Number(b.order) : Infinity;
    return aOrder - bOrder || String(a?.name || "").localeCompare(String(b?.name || ""), "fr");
  });
}

export async function generateMetadata({ params }) {
  const { categorySlug } = await params;
  const readableName = decodeURIComponent(categorySlug).replaceAll("-", " ");
  return {
    title: `${readableName} – Menu | Casse-Croûte Courteau`,
    description: `Découvrez nos ${readableName} et commandez en ligne au Casse-Croûte Courteau.`,
    alternates: { canonical: `/menu/${categorySlug}` },
  };
}

export default async function MenuCategoryPage({ params }) {
  const { categorySlug: encodedSlug } = await params;
  const categorySlug = decodeURIComponent(encodedSlug);
  const [apiCategories, searchArticles, searchOffers] = await Promise.all([
    fetchJson("/categories", "Impossible de récupérer les catégories."),
    fetchJson("/menuItems", "Impossible de récupérer les articles."),
    fetchJson("/offers", "Impossible de récupérer les offres."),
  ]);
  const categories = [...specialCategories, ...(Array.isArray(apiCategories) ? apiCategories : [])];
  const activeCategory = categories.find((category) => category.slug === categorySlug);
  if (!activeCategory) notFound();
  const items = sortItems(await getItems(categorySlug));
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem", position: index + 1,
      url: item.slug
        ? categorySlug === "offres"
          ? `${SITE_URL}/menu/offres/${encodeURIComponent(item.slug)}`
          : `${SITE_URL}/menu/articles/${encodeURIComponent(item.slug)}`
        : `${SITE_URL}/menu/${categorySlug}`,
      name: item.name, image: item.image,
    })),
  };
  return <div className="md:pt-28 pt-16">
    <h1 className="sr-only">Menu {activeCategory.name}</h1>
    <MenuContent categories={categories} items={items} selectedCategory={categorySlug} searchArticles={Array.isArray(searchArticles) ? searchArticles : []} searchOffers={Array.isArray(searchOffers) ? searchOffers : []} />
    {items.length > 0 && <Script id="ld-itemlist" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />}
  </div>;
}
