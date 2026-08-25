import MenuCategoriesSection from "./MenuCategoriesSection";
import MenuItemsSection from "./MenuItemsSection";
import MenuSearch from "./MenuSearch";

export default function MenuContent({ categories, items, selectedCategory, searchArticles, searchOffers }) {
  const activeCategory = categories.find((category) => category.slug === selectedCategory);
  return <main className="min-h-screen bg-[#fffdf9] pb-20 text-[#1a1714]">
    <MenuCategoriesSection categories={categories} selectedCategory={selectedCategory} />
    <div className="mx-auto grid max-w-[1440px] items-start gap-8 px-5 py-9 md:px-14">
      <section>
        <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="text-[11px] font-bold tracking-[.16em] text-[#9c9184]">MENU · {activeCategory?.name?.toLocaleUpperCase("fr")}</p><h1 className="mt-2 font-bebas-neue text-5xl leading-none md:text-6xl">{activeCategory?.name}</h1><p className="mt-2 text-sm text-[#6e6659]">{items.length} article{items.length > 1 ? "s" : ""}</p></div>
          <MenuSearch categories={categories} articles={searchArticles} offers={searchOffers} compact />
        </header>
        <MenuItemsSection items={items} selectedCategory={selectedCategory} />
      </section>
    </div>
  </main>;
}
