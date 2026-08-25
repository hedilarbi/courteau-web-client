import MenuLanding from "@/components/MenuLanding";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Le menu | Casse-Croûte Courteau",
  description: "Parcourez toutes les catégories du menu Courteau et commandez en ligne.",
  alternates: { canonical: "/menu" },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://api.lecourteau.com/api";

export default async function MenuIndexPage({ searchParams }) {
  const query = await searchParams;
  if (typeof query?.category === "string" && query.category) {
    const { redirect } = await import("next/navigation");
    redirect(`/menu/${encodeURIComponent(query.category)}`);
  }
  const [categoriesResponse, articlesResponse, offersResponse] = await Promise.all([
    fetch(`${API_URL}/categories`, { cache: "no-store" }),
    fetch(`${API_URL}/menuItems`, { cache: "no-store" }),
    fetch(`${API_URL}/offers`, { cache: "no-store" }),
  ]);
  if (!categoriesResponse.ok || !articlesResponse.ok || !offersResponse.ok) throw new Error("Impossible de récupérer le menu.");
  const [apiCategories, articles, offers] = await Promise.all([categoriesResponse.json(), articlesResponse.json(), offersResponse.json()]);
  const categories = [
    { _id: "offers", name: "Offres", slug: "offres", image: "/offres.webp" },
    { _id: "recompenses", name: "Récompenses", slug: "recompenses", image: "/awards.png" },
    ...(Array.isArray(apiCategories) ? apiCategories : []),
  ];
  return <MenuLanding categories={categories} articles={Array.isArray(articles) ? articles : []} offers={Array.isArray(offers) ? offers : []} />;
}
