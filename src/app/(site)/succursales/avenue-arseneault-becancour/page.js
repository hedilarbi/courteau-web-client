import Link from "next/link";

export const metadata = {
  title: {
    absolute: "Casse-Croûte Courteau – Avenue Arseneault | Bécancour",
  },
  description:
    "Découvrez le Casse-Croûte Courteau situé au 3840 Avenue Arseneault à Bécancour. Consultez le menu et commandez en ligne.",
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
    { "@type": "ListItem", position: 3, name: "Avenue Arseneault", item: "https://www.lecourteau.com/succursales/avenue-arseneault-becancour" },
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
            <li aria-current="page" className="text-gray-900 font-medium">Avenue Arseneault</li>
          </ol>
        </nav>
        <h1 className="font-bebas-neue text-3xl font-bold md:text-5xl">
          Casse-Croûte Courteau – Avenue Arseneault
        </h1>

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
