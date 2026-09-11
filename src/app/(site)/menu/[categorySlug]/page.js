import MenuContent from "@/components/MenuContent";
import { SITE_URL } from "@/lib/siteUrl";
import { notFound } from "next/navigation";
import Script from "next/script";
import { categorySeo } from "@/lib/categorySeo";

export const dynamic = "force-dynamic";
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://api.lecourteau.com/api";
const specialCategories = [
  { _id: "recompenses", name: "Récompenses", slug: "recompenses", image: "/recompenses.jpeg" },
  { _id: "offers", name: "Offres", slug: "offres", image: "/offres.jpeg" },
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
  const { categorySlug: encodedSlug } = await params;
  const categorySlug = decodeURIComponent(encodedSlug);

  const apiCategories = await fetchJson("/categories", "Impossible de récupérer les catégories.").catch(() => []);
  const categories = [...specialCategories, ...(Array.isArray(apiCategories) ? apiCategories : [])];
  const activeCategory = categories.find((c) => c.slug === categorySlug);

  const categoryName = activeCategory?.name || categorySlug.replaceAll("-", " ");
  const seo = categorySeo[categorySlug];

  return {
    title: seo?.title ? { absolute: seo.title } : `${categoryName} – Menu | Casse-Croûte Courteau`,
    description: seo?.description || `Découvrez la catégorie ${categoryName} du menu du Casse-Croûte Courteau et consultez les articles disponibles.`,
    alternates: { canonical: `https://www.lecourteau.com/menu/${encodeURIComponent(categorySlug)}` },
    robots: { index: true, follow: true },
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
  const seoConfig = categorySeo[categorySlug] || null;

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": "https://www.lecourteau.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Menu",
        "item": "https://www.lecourteau.com/menu"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": activeCategory.name,
        "item": `https://www.lecourteau.com/menu/${encodeURIComponent(categorySlug)}`
      }
    ]
  };

  return <div className="md:pt-28 pt-16">
    <MenuContent categories={categories} items={items} selectedCategory={categorySlug} searchArticles={Array.isArray(searchArticles) ? searchArticles : []} searchOffers={Array.isArray(searchOffers) ? searchOffers : []} seoConfig={seoConfig} />
    {items.length > 0 && <Script id="ld-itemlist" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />}
    <Script id="ld-breadcrumb" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd).replace(/</g, "\\u003c") }} />
  </div>;
}
