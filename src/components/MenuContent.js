import Link from "next/link";
import MenuCategoriesSection from "./MenuCategoriesSection";
import MenuItemsSection from "./MenuItemsSection";
import MenuSearch from "./MenuSearch";

export default function MenuContent({ categories, items, selectedCategory, searchArticles, searchOffers, seoConfig }) {
  const activeCategory = categories.find((category) => category.slug === selectedCategory);
  return <main className="min-h-screen bg-[#fffdf9] pb-20 text-[#1a1714]">
    <MenuCategoriesSection categories={categories} selectedCategory={selectedCategory} />
    <div className="mx-auto grid max-w-[1440px] items-start gap-8 px-5 py-9 md:px-14">
      <section>
        <nav aria-label="Fil d’Ariane" className="mb-4 text-sm text-[#6e6659]">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:underline">Accueil</Link>
            </li>
            <li>
              <span aria-hidden="true">→</span>
            </li>
            <li>
              <Link href="/menu" className="hover:underline">Menu</Link>
            </li>
            <li>
              <span aria-hidden="true">→</span>
            </li>
            <li aria-current="page" className="font-semibold text-[#1a1714]">
              {activeCategory?.name}
            </li>
          </ol>
        </nav>
        <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-bold tracking-[.16em] text-[#9c9184]">MENU · {activeCategory?.name?.toLocaleUpperCase("fr")}</p>
            <h1 className="mt-2 font-bebas-neue text-5xl leading-none md:text-6xl">{seoConfig?.h1 || activeCategory?.name}</h1>
            {seoConfig?.intro && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#6e6659]">
                {seoConfig.intro}
              </p>
            )}
            <p className="mt-2 text-sm text-[#6e6659]">{items.length} article{items.length > 1 ? "s" : ""}</p>
          </div>
          <MenuSearch categories={categories} articles={searchArticles} offers={searchOffers} compact />
        </header>
        <MenuItemsSection items={items} selectedCategory={selectedCategory} />
      </section>
    </div>
  </main>;
}
