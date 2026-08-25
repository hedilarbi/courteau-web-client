"use client";

import Image from "next/image";
import Link from "next/link";
import MenuSearch from "./MenuSearch";

export default function MenuLanding({ categories, articles, offers }) {
  return <main className="min-h-screen bg-[#fffdf9] px-5 pb-20 pt-24 text-[#1a1714] md:px-14 md:pt-40">
    <div className="mx-auto max-w-[1350px]">
      <header className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
        <div><p className="text-xs font-bold tracking-[.2em] text-[#a27000]">{categories.length} CATÉGORIES</p><h1 className="mt-2 font-bebas-neue text-6xl leading-none md:text-7xl">LE MENU</h1></div>
        <MenuSearch categories={categories} articles={articles} offers={offers} />
      </header>
      <div className="mt-10 flex items-end justify-between gap-4"><h2 className="font-bebas-neue text-4xl leading-none">PARCOURIR LE MENU</h2><span className="hidden text-sm font-semibold text-[#9c9184] sm:block">{categories.length} catégories</span></div>
      {categories.length ? <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {categories.map((category) => <Link key={category._id} href={`/menu/${category.slug}`} className="group relative aspect-[1.55] overflow-hidden rounded-2xl bg-[#1a1714] transition hover:-translate-y-1 hover:shadow-xl"><Image src={category.image} alt={category.name} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-85" /><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" /><h3 className="absolute bottom-4 left-4 right-4 font-bebas-neue text-2xl leading-none text-white md:text-3xl">{category.name}</h3></Link>)}
      </div> : <p className="mt-6 rounded-2xl border border-[#ece5d9] p-10 text-center text-[#6e6659]">Aucune catégorie ne correspond à cette recherche.</p>}
    </div>
  </main>;
}
