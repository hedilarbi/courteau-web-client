import Image from "next/image";
import Link from "next/link";

export default function MenuCategoriesSection({
  categories,
  selectedCategory,
}) {
  if (!categories?.length) return null;

  return (
    <div className="py-6 shadow-md border-b border-gray-200 md:px-24 px-6 flex gap-2 md:gap-4 overflow-x-auto">
      {categories.map((category) => {
        const active = category.slug === selectedCategory;
        const href = `/menu?category=${category.slug}`;
        return (
          <Link
            key={category._id}
            href={href}
            scroll={false}
            prefetch
            aria-current={active ? "page" : undefined} // 🔁 mieux que aria-pressed sur un lien
            className={`${
              active ? "ring-2 ring-pr" : ""
            } rounded-full md:h-24 md:w-24 h-16 w-16 relative flex-none shadow-md flex justify-center items-center`}
          >
            <Image
              src={category.image}
              alt={category.name}
              fill
              sizes="(max-width: 768px) 64px, 96px"
              className="rounded-full object-cover"
            />
            <div className="absolute inset-0 z-10 bg-black/55 rounded-full" />
            <h2
              className={`${
                active ? "text-pr" : "text-white"
              } text-xs md:text-xl absolute z-20 font-bebas-neue`}
            >
              {category.name}
            </h2>
          </Link>
        );
      })}
    </div>
  );
}
