import { getOffers } from "@/services/FoodServices";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const OffresSectionContent = async () => {
  let items = [];
  try {
    const res = await getOffers(); // idéalement cacheable côté serveur (ISR/tags)
    const raw = Array.isArray(res?.data) ? res.data : [];
    // Garde uniquement les offres valides
    items = raw.filter((o) => o && o._id && o.image && o.name);
  } catch (e) {
    console.error("getOffers failed:", e);
  }

  if (!items.length) {
    // Skeleton simple si aucune donnée
    return (
      <section aria-label="Offres" className="mt-8  ">
        <div className="-mx-6 md:mx-0 px-6 md:px-0">
          <div className="flex gap-3 md:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 w-32 md:h-48 md:w-72 rounded-xl bg-gray-200 animate-pulse flex-none"
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section aria-label="Offres" className="mt-8 ">
      <div
        className="
          -mx-6 md:mx-0 px-6 md:px-0
          overflow-x-auto overscroll-x-contain scroll-smooth touch-pan-x
          scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
        "
      >
        <ul
          role="list"
          className="flex gap-3 md:gap-4 pb-1 snap-x snap-mandatory"
        >
          {items.map((item, idx) => (
            <li key={item._id} role="listitem" className="snap-start">
              <Link
                href={`menu/offres/${item.slug}`}
                aria-haspopup="dialog"
                aria-controls="offer-modal"
                className="
                  group relative block
                  h-20 w-32 md:h-48 md:w-72
                  overflow-hidden rounded-xl ring-1 ring-black/5 shadow-sm
                  transition-transform duration-200 will-change-transform
                  hover:scale-[1.015] focus-visible:scale-[1.015]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pr
                  bg-white
                "
                title={item.name}
              >
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/10 to-transparent rounded-xl" />
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 8rem, (max-width: 1024px) 18rem, 18rem"
                  className="object-cover"
                  priority={idx < 2}
                />
                <span
                  className="
                    absolute left-3 right-3 bottom-2 z-20
                    text-white drop-shadow
                    text-xs md:text-2xl font-bebas-neue tracking-wide
                    line-clamp-1
                    text-left
                  "
                >
                  {item.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default OffresSectionContent;
