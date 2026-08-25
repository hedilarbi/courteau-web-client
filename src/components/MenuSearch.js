"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .trim();

const itemSlug = (item) =>
  item?.slug ||
  String(item?.name || "")
    .toLocaleLowerCase("fr")
    .trim()
    .replace(/\s+/g, "-");

export default function MenuSearch({ categories = [], articles = [], offers = [], compact = false }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const term = normalize(query);

  useEffect(() => {
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const results = useMemo(() => {
    if (!term) return { categories: [], articles: [], offers: [] };
    const matchingCategories = categories.filter((category) =>
      normalize(category.name).includes(term)
    );
    const matchingCategoryRefs = new Set(
      matchingCategories.flatMap((category) =>
        [category._id, category.slug, category.name]
          .filter(Boolean)
          .map(normalize)
      )
    );

    return {
      categories: matchingCategories.slice(0, 4),
      articles: articles
        .filter((article) => {
          if (!article?.name || !article?.image) return false;
          const categoryRefs = typeof article.category === "object"
            ? [article.category?._id, article.category?.slug, article.category?.name]
            : [article.category];
          const belongsToMatchingCategory = categoryRefs
            .filter(Boolean)
            .map(normalize)
            .some((reference) => matchingCategoryRefs.has(reference));
          return belongsToMatchingCategory ||
            [article.name, article.description]
              .some((value) => normalize(value).includes(term));
        }),
      offers: offers
        .filter((offer) => offer?.slug && offer?.image &&
          [offer.name, offer.description].some((value) => normalize(value).includes(term))
        )
        .slice(0, 4),
    };
  }, [articles, categories, offers, term]);

  const hasResults = results.categories.length || results.articles.length || results.offers.length;
  return <div ref={rootRef} className={`relative z-30 w-full ${compact ? "md:max-w-xs" : "md:max-w-sm"}`}>
    <label className={`flex items-center gap-3 rounded-full border border-[#e5ddcf] bg-white px-5 text-[#6e6659] shadow-sm focus-within:border-pr ${compact ? "py-3" : "py-4"}`}>
      <FiSearch aria-hidden className="shrink-0" />
      <span className="sr-only">Chercher dans le menu</span>
      <input value={query} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} placeholder="Chercher un article, une catégorie…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9c9184]" />
      {query && <button type="button" onClick={() => setQuery("")} aria-label="Effacer la recherche" className="rounded-full p-1 hover:bg-[#f3ede2]"><FiX /></button>}
    </label>
    {open && term && <div className="absolute left-0 right-0 top-[calc(100%+8px)] max-h-[420px] overflow-y-auto rounded-2xl border border-[#e5ddcf] bg-white p-2 shadow-2xl">
      {results.categories.length > 0 && <SuggestionGroup title="CATÉGORIES">{results.categories.map((category) => <Suggestion key={category._id} href={`/menu/${category.slug}`} image={category.image} name={category.name} meta="Catégorie" onClick={() => setOpen(false)} />)}</SuggestionGroup>}
      {results.articles.length > 0 && <SuggestionGroup title="ARTICLES">{results.articles.map((article) => <Suggestion key={article._id} href={`/menu/articles/${itemSlug(article)}`} image={article.image} name={article.name} meta={article.category?.name || "Article"} onClick={() => setOpen(false)} />)}</SuggestionGroup>}
      {results.offers.length > 0 && <SuggestionGroup title="OFFRES">{results.offers.map((offer) => <Suggestion key={offer._id} href={`/menu/offres/${offer.slug}`} image={offer.image} name={offer.name} meta="Offre" onClick={() => setOpen(false)} />)}</SuggestionGroup>}
      {!hasResults && <p className="px-4 py-7 text-center text-sm text-[#8a8074]">Aucun résultat pour « {query} ».</p>}
    </div>}
  </div>;
}

function SuggestionGroup({ title, children }) {
  return <div className="p-1"><p className="px-3 pb-1 pt-2 text-[9px] font-bold tracking-[.16em] text-[#9c9184]">{title}</p>{children}</div>;
}

function Suggestion({ href, image, name, meta, onClick }) {
  return <Link href={href} onClick={onClick} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-[#fdf0d6]"><span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#f3ede2]"><Image src={image} alt="" fill sizes="44px" className="object-cover" /></span><span className="min-w-0"><strong className="block truncate text-sm">{name}</strong><span className="block truncate text-xs text-[#9c9184]">{meta}</span></span></Link>;
}
