"use client";

import Link from "next/link";
import { useUser } from "@/context/UserContext";

function hasActiveSubscription(user) {
  if (!user) return false;
  const status = String(user.subscriptionStatus || "").toLowerCase().trim();
  const end = user.subscriptionCurrentPeriodEnd ? new Date(user.subscriptionCurrentPeriodEnd).getTime() : null;
  return Boolean(user.subscriptionIsActive) || (["active", "trialing"].includes(status) && (!Number.isFinite(end) || end > Date.now()));
}

export default function HomeClubSection() {
  const { user } = useUser();
  if (hasActiveSubscription(user)) return null;

  const benefits = [
    ["−15%", "Sur tout le menu", "Appliqué directement à vos commandes."],
    ["0$", "Livraison gratuite", "Sur toutes vos commandes admissibles."],
    ["1 / MOIS", "Article gratuit", "Un produit offert chaque mois."],
    ["0", "Engagement", "Résiliable à tout moment."],
  ];

  return <section className="relative overflow-hidden bg-pr px-5 py-14 md:px-14 md:py-16">
    <span className="pointer-events-none absolute -bottom-20 left-8 font-bebas-neue text-[16rem] leading-none text-black/[.06]">CLUB</span>
    <div className="relative mx-auto grid max-w-[1350px] gap-8 lg:grid-cols-[1.25fr_.75fr]">
      <div><p className="inline-block rounded-full bg-[#1a1714] px-4 py-2 text-[10px] font-bold tracking-[.16em] text-pr">ABONNEMENT · CLUB COURTEAU</p><h2 className="mt-5 font-bebas-neue text-6xl leading-[.85] md:text-[6.5rem]">CLUB COURTEAU</h2><p className="mt-5 max-w-2xl text-lg leading-relaxed text-black/75">Profitez de <strong>15 % de rabais</strong> sur le menu, de la <strong>livraison offerte</strong> et d’un <strong>article gratuit chaque mois</strong>.</p>
        <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">{benefits.map(([value, title, copy]) => <div key={title} className="rounded-2xl bg-[#fffdf9]/95 p-4 md:p-5"><p className="font-bebas-neue text-4xl leading-none">{value}</p><h3 className="mt-2 text-sm font-bold">{title}</h3><p className="mt-1 hidden text-xs leading-relaxed text-[#6e6659] md:block">{copy}</p></div>)}</div>
      </div>
      <div className="self-start rounded-2xl bg-[#1a1714] p-7 text-white"><p className="text-[10px] tracking-[.16em] text-white/50">ADHÉSION MENSUELLE</p><div className="mt-3 flex items-end gap-2"><strong className="font-bebas-neue text-7xl leading-none text-pr">9.99$</strong><span className="pb-2 text-sm text-white/60">/ mois</span></div><div className="my-5 h-px bg-white/10" /><ul className="space-y-3 text-sm"><li><span className="mr-2 text-pr">✓</span>15 % sur chaque commande</li><li><span className="mr-2 text-pr">✓</span>Livraison gratuite</li><li><span className="mr-2 text-pr">✓</span>Un article offert par mois</li></ul><Link href="/abonnement" className="mt-6 block rounded-xl bg-pr p-4 text-center font-bebas-neue text-2xl tracking-wider text-black transition hover:-translate-y-0.5">DEVENIR MEMBRE</Link></div>
    </div>
  </section>;
}
