"use client";

import Image from "next/image";
import Link from "next/link";
import { useUser } from "@/context/UserContext";

function hasActiveSubscription(user) {
  if (!user) return false;
  const status = String(user.subscriptionStatus || "").toLowerCase().trim();
  const end = user.subscriptionCurrentPeriodEnd
    ? new Date(user.subscriptionCurrentPeriodEnd).getTime()
    : null;
  return Boolean(user.subscriptionIsActive) ||
    (["active", "trialing"].includes(status) &&
      (!Number.isFinite(end) || end > Date.now()));
}

const benefits = [
  { value: "−15 %", label: "Sur tout le menu" },
  { value: "0 $", label: "De frais de livraison" },
  { value: "1 / MOIS", label: "Article offert" },
];

export default function HomeClubSection() {
  const { user } = useUser();
  if (hasActiveSubscription(user)) return null;

  return (
    <section className="club-home-shell bg-pr px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-10">
      <div className="relative mx-auto max-w-[1480px] overflow-hidden bg-[#151513] text-white shadow-[0_24px_70px_rgba(62,38,0,.25)]">
        <div className="grid lg:min-h-[690px] lg:grid-cols-[55%_45%]">
          <div className="relative z-10 flex flex-col px-6 pb-9 pt-9 sm:px-10 sm:pb-11 sm:pt-11 lg:px-16 lg:py-14 xl:px-20">
            <div className="mb-7 flex items-center gap-3 font-bebas-neue text-sm tracking-[.18em] text-pr sm:text-base">
              <span aria-hidden="true">★</span><span>ABONNEMENT MENSUEL</span><span aria-hidden="true">★</span>
            </div>

            <div className="w-fit">
              <span className="bg-white px-3 py-1 font-bebas-neue text-2xl tracking-[.18em] text-[#151513] sm:text-3xl">CLUB</span>
              <h2 className="bg-pr px-3 pb-1 pt-2 font-bebas-neue text-[4.25rem] leading-[.82] tracking-wide text-[#151513] sm:text-[6.2rem] lg:text-[7.2rem]">COURTEAU</h2>
            </div>

            <p className="mt-8 font-bebas-neue text-[2.8rem] leading-[.9] tracking-wide sm:text-[4rem] lg:text-[4.5rem]">
              VOS CLASSIQUES.<br /><span className="text-pr">À MEILLEUR PRIX.</span>
            </p>

            <p className="mt-6 max-w-[650px] text-sm leading-7 text-white/70 sm:text-base">
              Les membres profitent de <strong className="text-white">15 % de rabais</strong> sur le menu, de la <strong className="text-white">livraison offerte</strong> et d&apos;un <strong className="text-white">article gratuit chaque mois</strong>.
            </p>

            <div className="mt-7 grid grid-cols-3 border-y border-white/15 py-5">
              {benefits.map((benefit, index) => (
                <div key={benefit.label} className={`min-w-0 px-3 first:pl-0 sm:px-5 ${index > 0 ? "border-l border-white/15" : ""}`}>
                  <p className="font-bebas-neue text-3xl leading-none text-pr sm:text-4xl">{benefit.value}</p>
                  <p className="mt-1 text-[10px] leading-tight text-white/70 sm:text-xs">{benefit.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex items-end gap-2">
                <strong className="font-bebas-neue text-6xl leading-none sm:text-7xl">11,99 $</strong>
                <span className="pb-1 text-[10px] font-bold uppercase leading-4 text-white/60">Par mois<br />Sans engagement</span>
              </div>
              <Link href="/abonnement" className="group flex min-h-14 flex-1 items-center justify-center gap-5 bg-pr px-6 font-bebas-neue text-xl tracking-wider text-[#151513] transition hover:bg-[#ffba2b] sm:max-w-[310px] sm:text-2xl">
                DEVENIR MEMBRE <span className="transition group-hover:translate-x-1">→</span>
              </Link>
            </div>
            <p className="mt-3 text-[10px] text-white/35">Annulable en tout temps. Avantages appliqués aux commandes admissibles.</p>
          </div>

          <div className="relative min-h-[390px] overflow-hidden sm:min-h-[480px] lg:min-h-0">
            <Image src="/HomeHero.jpg" alt="Poutine Courteau généreusement garnie" fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover object-[62%_center]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#151513]/10 via-transparent to-[#151513] lg:bg-gradient-to-r lg:from-[#151513] lg:via-[#151513]/5 lg:to-transparent" />
            <div className="absolute right-5 top-5 rotate-2 border-[5px] border-[#151513] bg-pr px-5 py-4 text-[#151513] shadow-[8px_8px_0_rgba(0,0,0,.35)] sm:right-8 sm:top-8 sm:px-7 sm:py-5">
              <p className="text-[10px] font-black tracking-[.12em] sm:text-xs">AVANTAGE MEMBRE</p>
              <p className="font-bebas-neue text-4xl leading-[.82] sm:text-5xl">UN ARTICLE<br />GRATUIT</p>
              <p className="mt-1 text-[10px] font-black tracking-wide">CHAQUE MOIS</p>
            </div>
            <div className="absolute bottom-7 left-6 right-6 border-l-4 border-pr pl-4 sm:bottom-10 sm:left-10 lg:left-12">
              <p className="font-bebas-neue text-3xl leading-none sm:text-4xl">RENTABILISÉ EN 2 COMMANDES</p>
              <p className="mt-2 max-w-md text-xs text-white/60">Plus vous commandez, plus votre abonnement vous récompense.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
