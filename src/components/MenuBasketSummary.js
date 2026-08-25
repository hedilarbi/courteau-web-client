"use client";

import Link from "next/link";
import { useSelectBasket, useSelectBasketItemCount, useSelectBasketTotal } from "@/context/BasketContext";

export default function MenuBasketSummary() {
  const basket = useSelectBasket();
  const count = useSelectBasketItemCount();
  const total = useSelectBasketTotal();
  const entries = [...basket.items, ...basket.offers, ...basket.rewards].slice(0, 3);
  return <aside className="sticky top-32 hidden rounded-2xl border border-[#ece5d9] bg-white p-5 lg:block">
    <div className="flex items-baseline justify-between"><h2 className="font-bebas-neue text-3xl">VOTRE PANIER</h2><span className="text-[10px] tracking-widest text-[#9c9184]">{count} ARTICLE{count > 1 ? "S" : ""}</span></div>
    {entries.length ? <div className="my-5 space-y-4">{entries.map((item, index) => <div key={item.uid || index} className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{item.name || item.item?.name || "Article"}</p><p className="text-xs text-[#9c9184]">1 ×</p></div><span className="font-bebas-neue text-xl">{Number(item.price || item.extraPrice || 0).toFixed(2)}$</span></div>)}</div> : <p className="my-6 text-sm leading-relaxed text-[#8a8074]">Votre panier est vide. Ajoutez un article pour commencer.</p>}
    <div className="flex items-baseline justify-between border-t border-[#ece5d9] pt-4"><span className="text-sm font-semibold text-[#55504a]">Sous-total</span><strong className="font-bebas-neue text-3xl">{total.toFixed(2)}$</strong></div>
    <Link href={count ? "/checkout" : "/menu"} className={`mt-4 block rounded-xl p-4 text-center font-bebas-neue text-xl tracking-wider ${count ? "bg-pr text-black" : "bg-[#eee8de] text-[#9c9184]"}`}>PASSER LA COMMANDE</Link>
    <p className="mt-3 rounded-xl bg-[#fdf0d6] p-3 text-xs leading-relaxed text-[#8a5f00]">★ Membre du Club : <strong>−15 %</strong> et livraison offerte.</p>
  </aside>;
}
