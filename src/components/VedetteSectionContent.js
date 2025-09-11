// components/VedetteSectionContent.jsx
import { getVedettes } from "@/services/FoodServices";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const VedetteSectionContent = async () => {
  // 1) Récupération + assainissement + dédoublonnage par slug
  let items = [];
  try {
    const res = await getVedettes();
    console.log("getVedettes response:", res);
    const raw = Array.isArray(res?.data) ? res.data : [];
    const cleaned = raw
      .map((it) => it?.menuItem)
      .filter((m) => m && m.slug && m.image && m.name);
    const uniqueBySlug = [...new Map(cleaned.map((m) => [m.slug, m])).values()];
    items = uniqueBySlug;
  } catch (e) {
    console.error("getVedettes failed:", e);
  }

  // 2) Skeleton si vide
  if (!items.length) {
    return (
      <section aria-label="Plats en vedette" className="mt-8  ">
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
    <section aria-label="Plats en vedette" className="mt-8 ">
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
          {items.map((item, idx) => {
            const href = `/menu/articles/${item.slug}`;
            return (
              <li key={item.slug} role="listitem" className="snap-start">
                <Link
                  href={href}
                  prefetch
                  className="
                    group relative block
                    h-20 w-32 md:h-48 md:w-72
                    overflow-hidden rounded-xl ring-1 ring-black/5 shadow-sm
                    transition-transform duration-200 will-change-transform
                    hover:scale-[1.015] focus-visible:scale-[1.015]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pr
                  "
                  aria-label={`Voir ${item.name}`}
                  title={item.name}
                >
                  {/* overlay lisible + badge “Vedette” */}
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <span className="absolute left-2 top-2 z-20 text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-white/90 text-black font-medium">
                    Vedette
                  </span>

                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 8rem, (max-width: 1024px) 18rem, 18rem"
                    className="object-cover"
                    priority={idx < 2} // charge plus vite les 2 premières
                  />

                  <span
                    className="
                      absolute left-3 right-3 bottom-2 z-20
                      text-white drop-shadow
                      text-xs md:text-2xl font-bebas-neue tracking-wide
                      line-clamp-1
                    "
                  >
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default VedetteSectionContent;
