import Link from "next/link";

export const metadata = {
  title: {
    absolute: "Restaurant à Bécancour | Casse-Croûte Courteau",
  },
  description:
    "Découvrez le Casse-Croûte Courteau à Bécancour, dans le secteur Saint-Grégoire, au 3840 Avenue Arseneault. Consultez le menu et commandez en ligne.",
  alternates: {
    canonical:
      "https://www.lecourteau.com/succursales/avenue-arseneault-becancour",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  parentOrganization: {
    "@type": "Organization",
    "@id": "https://www.lecourteau.com/#organization",
  },
  "@id":
    "https://www.lecourteau.com/succursales/avenue-arseneault-becancour#restaurant",
  name: "Casse-Croûte Courteau – Avenue Arseneault",
  url: "https://www.lecourteau.com/succursales/avenue-arseneault-becancour",
  telephone: "+1-819-371-3935",
  address: {
    "@type": "PostalAddress",
    streetAddress: "3840 Avenue Arseneault",
    addressLocality: "Bécancour",
    addressRegion: "QC",
    postalCode: "G9H 1V8",
    addressCountry: "CA",
  },
  menu: "https://www.lecourteau.com/menu",
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.lecourteau.com" },
    { "@type": "ListItem", position: 2, name: "Succursales", item: "https://www.lecourteau.com/succursales" },
    { "@type": "ListItem", position: 3, name: "Bécancour – Saint-Grégoire", item: "https://www.lecourteau.com/succursales/avenue-arseneault-becancour" },
  ],
};

export default function AvenueArseneaultPage() {
  return (
    <main className="md:px-14 px-4 md:py-16 py-10 md:mt-28 mt-20">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-lg md:p-10">
        <nav aria-label="Fil d’Ariane" className="mb-4 text-sm">
          <ol className="flex flex-wrap items-center gap-1 text-gray-600">
            <li><Link href="/" className="hover:underline">Accueil</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link href="/succursales" className="hover:underline">Succursales</Link></li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-gray-900 font-medium">Bécancour – Saint-Grégoire</li>
          </ol>
        </nav>
        <h1 className="font-bebas-neue text-3xl font-bold md:text-5xl">
          Casse-Croûte Courteau – Bécancour, secteur Saint-Grégoire
        </h1>

        <p className="mt-4 font-inter text-base leading-relaxed text-gray-700 md:text-lg">
          Découvrez notre restaurant à Bécancour, dans le secteur Saint-Grégoire.
          Le Casse-Croûte Courteau vous propose poutines, pizzas, déjeuners et
          autres classiques du menu, sur place ou à commander en ligne.
        </p>

        <address className="mt-6 font-inter text-base not-italic leading-7 text-gray-700 md:text-lg">
          3840 Avenue Arseneault
          <br />
          Bécancour, QC G9H 1V8
          <br />
          Canada
        </address>

        <p className="mt-4 font-inter text-base text-gray-700 md:text-lg">
          <a href="tel:+18193713935" className="hover:underline">
            +1-819-371-3935
          </a>
        </p>

        <section aria-labelledby="restaurant-becancour-title" className="mt-8">
          <h2
            id="restaurant-becancour-title"
            className="font-inter md:text-2xl text-xl font-bold mb-3 text-black"
          >
            Restaurant à Bécancour – Saint-Grégoire
          </h2>
          <p className="font-inter text-base leading-relaxed text-gray-700 mb-3 md:text-lg">
            Notre succursale de Bécancour, dans le secteur Saint-Grégoire, vous
            propose les classiques Courteau :{" "}
            <Link href="/menu/nos-poutines-classiques" className="font-semibold text-[#df0d5a] hover:underline">poutines</Link>,{" "}
            <Link href="/menu/nos-pizzas" className="font-semibold text-[#df0d5a] hover:underline">pizzas</Link>,{" "}
            <Link href="/menu/les-déjeuners" className="font-semibold text-[#df0d5a] hover:underline">déjeuners</Link>,{" "}
            <Link href="/menu/le-poulet-frit-courteau" className="font-semibold text-[#df0d5a] hover:underline">poulet frit</Link>{" "}
            et autres choix du menu.
          </p>
          <p className="font-inter text-base leading-relaxed text-gray-700 md:text-lg">
            Vous pouvez commander en ligne pour emporter ou en livraison selon
            votre adresse.
          </p>
        </section>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/menu"
            className="rounded-md bg-pr px-6 py-3 text-center font-bebas-neue text-lg text-black"
          >
            Voir le menu
          </Link>
          <Link
            href="/menu"
            className="rounded-md bg-black px-6 py-3 text-center font-bebas-neue text-lg text-white"
          >
            Commander en ligne
          </Link>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(restaurantJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
      }} />
    </main>
  );
}
