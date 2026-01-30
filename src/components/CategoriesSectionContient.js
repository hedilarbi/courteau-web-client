// components/CategoriesSectionContient.jsx
import { getCategories } from "@/services/FoodServices";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const CategoriesSectionContient = async () => {
  // Récupération sécurisée + fallback
  let data = [];
  try {
    const res = await getCategories(); // ⚠️ Assure-toi que ce fetch est cacheable côté serveur (ISR/tags si possible)
    data = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    // En prod, on reste silencieux côté UI
    console.error("Échec du chargement des catégories :", e);
  }

  if (!data.length) {
    // Fallback discret si aucune catégorie
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
    <section aria-label="Catégories du menu" className="mt-8  ">
      <div
        className="
         
          overflow-x-auto overscroll-x-contain
          scroll-smooth touch-pan-x
          scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
        "
      >
        <ul
          role="list"
          className="
            flex gap-3 md:gap-4
            snap-x snap-mandatory
            pb-1
          "
        >
          {data.map((item, idx) => {
            const href = `/menu?category=${item.slug}`;
            return (
              <li key={item._id} role="listitem" className="snap-start">
                <Link
                  href={href}
                  prefetch
                  className="
                    group relative block
                    h-20 w-32 md:h-48 md:w-72
                    overflow-hidden rounded-xl
                    ring-1 ring-black/5 shadow-sm
                    transition-transform duration-200 will-change-transform
                    hover:scale-[1.015] focus-visible:scale-[1.015]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pr
                  "
                  aria-label={`Voir la catégorie ${item.name}`}
                  title={item.name}
                >
                  {/* overlay dégradé lisible */}
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    // tailles réactives = CLS maîtrisé + perf
                    sizes="(max-width: 640px) 8rem, (max-width: 1024px) 18rem, 18rem"
                    className="object-cover"
                    // Priorité sur les 2 premières pour un feeling immédiat
                    priority={idx < 2}
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

export default CategoriesSectionContient;
