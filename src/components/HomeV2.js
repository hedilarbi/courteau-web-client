import Image from "next/image";
import Link from "next/link";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import {
  getCategories,
  getMenuItemsByCategory,
  getOffers,
  getVedettes,
} from "@/services/FoodServices";
import HomeClubSection from "./HomeClubSection";

const money = (value) =>
  new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: Number(value) % 1 ? 2 : 0,
  }).format(Number(value) || 0);

const validImage = (item) => item?.image && item?.name && item?.slug;

export default async function HomeV2() {
  const [offersResponse, vedettesResponse, categoriesResponse] =
    await Promise.all([getOffers(), getVedettes(), getCategories()]);

  const allCategories = Array.isArray(categoriesResponse?.data)
    ? categoriesResponse.data
    : [];
  const promoCategory = allCategories.find((category) => {
    const name = String(category?.name || "").toLocaleLowerCase("fr");
    const slug = String(category?.slug || "").toLocaleLowerCase("fr");
    return name.includes("promo") || slug.includes("promo");
  });
  const promoItemsResponse = promoCategory
    ? await getMenuItemsByCategory(promoCategory._id)
    : null;
  const promoNames = (Array.isArray(promoItemsResponse?.data)
    ? promoItemsResponse.data
    : []
  )
    .map((item) => item?.name)
    .filter(Boolean);

  const now = Date.now();
  const offers = (Array.isArray(offersResponse?.data) ? offersResponse.data : [])
    .filter((offer) => {
      const expiry = new Date(offer?.expireAt).getTime();
      return validImage(offer) && Number.isFinite(expiry) && expiry > now;
    })
    .slice(0, 8);

  const vedettes = [
    ...new Map(
      (Array.isArray(vedettesResponse?.data) ? vedettesResponse.data : [])
        .map((entry) => entry?.menuItem)
        .filter(validImage)
        .map((item) => [item.slug, item])
    ).values(),
  ].slice(0, 3);

  const categories = allCategories.filter(validImage).slice(0, 8);

  const activeCount = offers.length;
  const heroImage = offers[0]?.image || vedettes[0]?.image || "/HomeHero.jpg";
  const heroName = offers[0]?.name || vedettes[0]?.name || "Notre poutine maison";
  const heroPrice = offers[0]?.price;

  return (
    <div className="home-v2 overflow-hidden bg-[#fffdf9] text-[#1a1714] font-inter">
      <section className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 pb-12 pt-24 md:grid-cols-[1.05fr_.95fr] md:px-14 md:pb-16 md:pt-40 lg:gap-16">
        <div>

          <h1 className="max-w-3xl font-bebas-neue text-[3.7rem] leading-[.88] tracking-wide sm:text-7xl lg:text-[6rem]">
            Casse-Croûte Courteau à <span className="home-highlight">Trois-Rivières</span> : Poutines, Pizzas & Déjeuners
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[#55504a] md:text-lg">
            Dégustez les meilleures poutines, pizzas et déjeuners de Trois-Rivières. Commandez en ligne dès maintenant et découvrez notre menu authentique et généreux.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/menu" className="rounded-xl bg-pr px-7 py-4 font-bebas-neue text-xl tracking-wider transition hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(247,166,0,.4)]">
              COMMANDER MAINTENANT
            </Link>
            <Link href="#categories" className="flex min-h-14 items-center justify-center rounded-xl border-2 border-[#e0d8c9] px-7 text-sm font-bold leading-none transition hover:border-pr hover:bg-[#fdf0d6]">
              Voir le menu
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-[#8a8175]">
            <span>★ 4,7 / 5 sur Google</span><span>Livraison Trois-Rivières</span><span>Ouvert 7 jours</span>
          </div>
        </div>
        <div className="relative mx-3 mt-4 md:mx-0">
          <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[1.25rem] bg-pr" />
          <div className="relative aspect-[1.2] overflow-hidden rounded-[1.25rem] bg-[#f3ede2]">
            <Image src={heroImage} alt={heroName} fill priority sizes="(max-width: 768px) 100vw, 45vw" className="object-cover" />
          </div>
          <div className="absolute -bottom-5 -left-3 rounded-xl bg-white px-5 py-3 shadow-xl md:-left-6">
            <p className="text-[10px] tracking-[.14em] text-[#8a8175]">PROMO DU MOMENT</p>
            <p className="font-bebas-neue text-2xl">{heroName}{heroPrice != null ? ` · ${money(heroPrice)}` : ""}</p>
          </div>
        </div>
      </section>

      <div className="home-marquee bg-[#1a1714] py-3 text-pr" aria-label="Articles en promotion">
        <div className="home-marquee-track font-bebas-neue text-lg tracking-wider">
          {[0, 1].map((copy) => (
            <span key={copy} aria-hidden={copy === 1}>
              {promoNames.map(
                (name) => `${name.toLocaleUpperCase("fr")}　◆　`
              )}
            </span>
          ))}
        </div>
      </div>

      <HomeClubSection />

      <section id="offres" className="bg-[#1a1714] px-5 py-14 text-[#fffdf9] md:px-14 md:py-16">
        <div className="mx-auto max-w-[1350px]">
          <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><p className="text-xs font-bold tracking-[.2em] text-pr">LES PROMOS DE LA SEMAINE</p><h2 className="mt-2 font-bebas-neue text-5xl leading-none md:text-6xl">NOS OFFRES <span className="text-pr">À SAISIR</span></h2><p className="mt-2 text-sm text-white/60">Des prix généreux pour encore mieux manger.</p></div>
            {offers.length > 0 && <span className="self-start rounded-full border border-pr/50 bg-pr/10 px-4 py-2 text-xs font-bold text-pr md:self-auto">● Offres en cours</span>}
          </div>
          {offers.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {offers.map((item) => <Link key={item._id} href={`/menu/offres/${item.slug}`} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#241f1b] transition hover:-translate-y-1 hover:shadow-2xl">
              <div className="relative aspect-[1.35] bg-[#2a2420]"><Image src={item.image} alt={item.name} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover" /><span className="absolute left-2 top-2 rounded bg-pr px-2 py-1 text-[9px] font-bold tracking-widest text-black">OFFRE</span></div>
              <div className="flex min-h-28 flex-col p-4"><h3 className="font-bebas-neue text-xl leading-none md:text-2xl">{item.name}</h3><div className="mt-auto flex items-end justify-between pt-4"><span className="font-bebas-neue text-2xl text-pr md:text-3xl">{money(item.price)}</span><span className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold transition group-hover:bg-pr group-hover:text-black">Voir</span></div></div>
            </Link>)}
          </div> : <EmptyState label="Les prochaines offres arrivent bientôt." />}
          <div className="mt-8 text-center"><Link href="/menu/offres" className="inline-block rounded-full border-2 border-white/20 px-6 py-3 text-sm font-bold hover:border-pr">Voir toutes les offres →</Link></div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-14 md:px-14 md:py-16">
        <SectionTitle eyebrow="EN VEDETTE" title="CE QU'ON COMMANDE LE PLUS" href="/menu" link="Voir tout le menu →" />
        {vedettes.length ? <div className="mt-7 grid gap-4 md:grid-cols-3">
          {vedettes.map((item, index) => <Link key={item.slug} href={`/menu/articles/${item.slug}`} className={`group overflow-hidden rounded-2xl border border-[#ece5d9] ${index === 0 ? "bg-[#1a1714] text-white md:col-span-1" : "bg-white"} transition hover:-translate-y-1 hover:shadow-xl`}>
            <div className="relative aspect-[1.6] bg-[#f3ede2]"><Image src={item.image} alt={item.name} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105" /></div>
            <div className="p-5"><span className="rounded bg-pr px-2 py-1 text-[9px] font-bold tracking-widest text-black">{index === 0 ? "LE PLUS COMMANDÉ" : "EN VEDETTE"}</span><h3 className="mt-3 font-bebas-neue text-3xl leading-none">{item.name}</h3><p className={`mt-3 text-sm ${index === 0 ? "text-white/60" : "text-[#6e6659]"}`}>À partir de {money(item.prices?.[0]?.price)}</p></div>
          </Link>)}
        </div> : <EmptyState label="Les plats vedettes seront bientôt affichés." light />}
      </section>

      <section id="categories" className="mx-auto max-w-[1440px] px-5 pb-14 md:px-14 md:pb-20">
        <SectionTitle eyebrow="LE MENU" title="PARCOURIR PAR CATÉGORIE" href="/menu" link="Toutes les catégories →" />
        {categories.length ? <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {categories.map((item) => <Link key={item._id} href={`/menu/${item.slug}`} className="group relative aspect-[1.55] overflow-hidden rounded-2xl bg-[#1a1714]">
            <Image src={item.image} alt={item.name} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover opacity-75 transition duration-500 group-hover:scale-105 group-hover:opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" /><h3 className="absolute bottom-4 left-4 right-4 font-bebas-neue text-2xl leading-none text-white md:text-3xl">{item.name}</h3>
          </Link>)}
        </div> : <EmptyState label="Les catégories seront bientôt affichées." light />}
      </section>

      <section className="border-t border-[#ece5d9] bg-[#f6f1e8] px-5 py-14 md:px-14 md:py-16">
        <div className="mx-auto grid max-w-[1350px] items-center gap-9 md:grid-cols-[1.05fr_.95fr]">
          <div><p className="text-xs font-bold tracking-[.2em] text-[#a27000]">APPLICATION COURTEAU</p><h2 className="mt-2 font-bebas-neue text-5xl leading-none md:text-6xl">COMMANDEZ EN DEUX TAPS</h2><p className="mt-4 max-w-lg leading-relaxed text-[#55504a]">Vos commandes favorites enregistrées, les offres membres en premier et les points qui s’accumulent tout seuls.</p><div className="mt-6 flex flex-wrap gap-3"><StoreLink href="https://apps.apple.com/us/app/casse-croûte-courteau/id6476014838" icon={<FaApple />} label="App Store" /><StoreLink href="https://play.google.com/store/apps/details?id=com.hedilarbi95.lecourteauclient" icon={<FaGooglePlay />} label="Google Play" /><Link href="/menu" className="rounded-xl border-2 border-[#d8d0c3] px-5 py-3 text-sm font-bold hover:border-pr">Commander sur le web</Link></div></div>
          <div className="relative aspect-[1.7] overflow-hidden rounded-2xl bg-[#e7ddce]"><Image src="/HomeHero.jpg" alt="Commande Courteau sur mobile" fill sizes="(max-width:768px) 100vw, 45vw" className="object-cover" /></div>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ eyebrow, title, href, link }) {
  return <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="text-xs font-bold tracking-[.2em] text-[#a27000]">{eyebrow}</p><h2 className="mt-2 font-bebas-neue text-4xl leading-none md:text-5xl">{title}</h2></div><Link href={href} className="self-start border-b-2 border-pr pb-1 text-sm font-bold md:self-auto">{link}</Link></div>;
}

function StoreLink({ href, icon, label }) {
  return <Link href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-[#1a1714] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5">{icon}{label}</Link>;
}

function EmptyState({ label, light = false }) {
  return <p className={`mt-7 rounded-2xl border p-8 text-center text-sm ${light ? "border-[#ece5d9] text-[#6e6659]" : "border-white/10 text-white/60"}`}>{label}</p>;
}
