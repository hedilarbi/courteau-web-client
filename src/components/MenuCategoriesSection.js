import Image from "next/image";
import Link from "next/link";

export default function MenuCategoriesSection({
  categories,
  selectedCategory,
}) {
  if (!categories?.length) return null;

  return (
    <nav aria-label="Catégories du menu" className="sticky top-20 z-20 flex gap-2 overflow-x-auto border-b border-[#ece5d9] bg-white/95 px-5 py-3 shadow-sm backdrop-blur md:top-28 md:px-14">
      {categories.map((category) => {
        const active = category.slug === selectedCategory;
        const href = `/menu/${category.slug}`;
        return (
          <Link
            key={category._id}
            href={href}
            prefetch
            aria-current={active ? "page" : undefined} // 🔁 mieux que aria-pressed sur un lien
            className={`${active ? "ring-2 ring-pr" : ""
              } relative flex h-11 flex-none items-center gap-2 rounded-full border border-[#e5ddcf] bg-white py-1 pl-1 pr-4 transition hover:border-pr ${active ? "bg-[#1a1714] text-white" : ""}`}
          >
            <Image
              src={category.image}
              alt={category.name}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
            />
            <h2
              className={`${active ? "text-pr" : "text-[#3d372f]"} text-sm font-bold whitespace-nowrap`}
            >
              {category.name}
            </h2>
          </Link>
        );
      })}
    </nav>
  );
}
