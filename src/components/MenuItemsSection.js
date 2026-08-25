import Image from "next/image";
import Link from "next/link";
import SelectMenuItemButton from "./SelectMenuItemButton";

const price = (value) => `${Number(value || 0).toFixed(2)}$`;

export default function MenuItemsSection({ items, selectedCategory }) {
  if (!items.length) return <p className="rounded-2xl border border-[#ece5d9] bg-white p-10 text-center text-[#6e6659]">Aucun article dans cette catégorie pour le moment.</p>;

  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
    {items.map((entry) => {
      const isReward = selectedCategory === "recompenses";
      const item = isReward ? entry.item : entry;
      if (!item) return null;
      const displayPrice = isReward ? `${entry.points} pts` : selectedCategory === "offres" ? price(item.price) : `Dès ${price(item.prices?.[0]?.price)}`;
      const href = selectedCategory === "offres" ? `/menu/offres/${item.slug}` : item.slug ? `/menu/articles/${item.slug}` : null;
      return <article key={entry._id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#ece5d9] bg-white transition hover:-translate-y-1 hover:shadow-xl">
        <div className="relative aspect-[1.35] overflow-hidden bg-[#f3ede2]"><Image src={item.image} alt={item.name} fill sizes="(max-width:768px) 50vw, 30vw" className="object-cover transition duration-500 group-hover:scale-105" /></div>
        <div className="flex flex-1 flex-col p-3 md:p-4">
          {href ? <Link href={href}><h2 className="font-bebas-neue text-xl leading-none md:text-2xl">{item.name}</h2></Link> : <h2 className="font-bebas-neue text-xl leading-none md:text-2xl">{item.name}</h2>}
          {item.description && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#8a8074] md:text-sm">{item.description}</p>}
          <div className="mt-auto flex flex-col pt-4"><strong className="font-bebas-neue text-xl md:text-2xl">{displayPrice}</strong><SelectMenuItemButton itemId={entry._id} selectedCategory={selectedCategory} reward={isReward ? entry : undefined} compact /></div>
        </div>
      </article>;
    })}
  </div>;
}
