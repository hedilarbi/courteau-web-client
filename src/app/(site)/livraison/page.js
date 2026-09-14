import Link from "next/link";
import React from "react";

export const metadata = {
  title: {
    absolute: "Livraison à Trois-Rivières | Pizza et poutine | Casse-Croûte Courteau",
  },
  description:
    "Commandez pizza, poutine et autres classiques du Casse-Croûte Courteau en livraison à Trois-Rivières. Vérifiez votre adresse et commandez en ligne.",
  alternates: {
    canonical: "https://www.lecourteau.com/livraison",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Accueil",
      item: "https://www.lecourteau.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Livraison",
      item: "https://www.lecourteau.com/livraison",
    },
  ],
};

export default function LivraisonPage() {
  return (
    <main className="md:px-14 px-4 md:py-16 py-10 md:mt-28 mt-20">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-lg md:p-10">
        <nav aria-label="Fil d’Ariane" className="mb-4 text-sm">
          <ol className="flex flex-wrap items-center gap-1 text-gray-600">
            <li>
              <Link href="/" className="hover:underline">
                Accueil
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-gray-900 font-medium">
              Livraison
            </li>
          </ol>
        </nav>
        <h1 className="font-bebas-neue text-3xl font-bold md:text-5xl text-black">
          Livraison de pizza et poutine à Trois-Rivières
        </h1>

        <p className="mt-4 font-inter text-base leading-relaxed text-gray-700 md:text-lg font-semibold">
          Faites-vous livrer vos classiques Courteau à Trois-Rivières. La
          livraison est offerte à partir de certaines succursales participantes,
          notamment Des Prairies et Pointe-du-Lac. La disponibilité dépend de
          votre adresse exacte et de la succursale participante la plus proche.
        </p>

        <h2 className="mt-8 font-inter md:text-2xl text-xl font-bold mb-3 text-black">
          Pizza et poutine en livraison
        </h2>
        <p className="font-inter text-base text-gray-700 leading-relaxed">
          Que vous ayez envie de l&apos;une de{" "}
          <Link
            href="/menu/nos-pizzas"
            className="text-[#df0d5a] font-semibold hover:underline"
          >
            nos généreuses pizzas
          </Link>{" "}
          ou de réconfort avec l&apos;une de{" "}
          <Link
            href="/menu/nos-poutines-classiques"
            className="text-[#df0d5a] font-semibold hover:underline"
          >
            nos poutines classiques
          </Link>
          , vous pouvez retrouver tout le menu régulier de notre casse-croûte et
          vous le faire livrer chez vous en toute simplicité.
        </p>

        <h2 className="mt-8 font-inter md:text-2xl text-xl font-bold mb-3 text-black">
          Comment vérifier si la livraison est disponible ?
        </h2>
        <ul className="list-disc pl-5 font-inter text-base text-gray-700 leading-relaxed space-y-2">
          <li>Consultez le menu en ligne et sélectionnez &quot;Livraison&quot;.</li>
          <li>Entrez votre adresse de livraison.</li>
          <li>
            Le système identifiera automatiquement la succursale participante la
            plus proche de chez vous.
          </li>
          <li>
            Votre admissibilité à la livraison ainsi que les frais associés
            seront confirmés avant de valider votre commande.
          </li>
        </ul>

        <h2 className="mt-8 font-inter md:text-2xl text-xl font-bold mb-3 text-black">
          Succursales offrant actuellement la livraison
        </h2>
        <ul className="list-disc pl-5 font-inter text-base text-gray-700 leading-relaxed space-y-2">
          <li>
            <Link
              href="/succursales/des-prairies-trois-rivieres"
              className="font-semibold text-black hover:underline"
            >
              Casse-Croûte Courteau – Des Prairies
            </Link>
          </li>
          <li>
            <Link
              href="/succursales/chemin-ste-marguerite-trois-rivieres"
              className="font-semibold text-black hover:underline"
            >
              Casse-Croûte Courteau – Pointe-du-Lac
            </Link>
          </li>
        </ul>
        <p className="mt-3 font-inter text-sm italic text-gray-500">
          Note : La disponibilité dépend de l’adresse saisie lors de la
          commande.
        </p>

        <div className="mt-10">
          <Link
            href="/menu"
            className="inline-block rounded-md bg-black px-6 py-4 text-center font-bebas-neue text-xl text-white transition hover:bg-gray-800"
          >
            Voir le menu et vérifier mon adresse
          </Link>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}
