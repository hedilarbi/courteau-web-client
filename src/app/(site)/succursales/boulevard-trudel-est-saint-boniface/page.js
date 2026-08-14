import Link from "next/link";

export const metadata = {
  title: {
    absolute:
      "Casse-Croûte Courteau – Boulevard Trudel Est | Saint-Boniface",
  },
  description:
    "Découvrez le Casse-Croûte Courteau situé au 1620 Boulevard Trudel Est à Saint-Boniface. Consultez le menu et commandez en ligne.",
  alternates: {
    canonical:
      "https://www.lecourteau.com/succursales/boulevard-trudel-est-saint-boniface",
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
    "https://www.lecourteau.com/succursales/boulevard-trudel-est-saint-boniface#restaurant",
  name: "Casse-Croûte Courteau – Boulevard Trudel Est",
  url: "https://www.lecourteau.com/succursales/boulevard-trudel-est-saint-boniface",
  telephone: "+1-819-371-3935",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1620 Boulevard Trudel Est",
    addressLocality: "Saint-Boniface",
    addressRegion: "QC",
    addressCountry: "CA",
  },
  menu: "https://www.lecourteau.com/menu",
};

export default function BoulevardTrudelEstPage() {
  return (
    <main className="md:px-14 px-4 md:py-16 py-10 md:mt-28 mt-20">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-lg md:p-10">
        <h1 className="font-bebas-neue text-3xl font-bold md:text-5xl">
          Casse-Croûte Courteau – Boulevard Trudel Est
        </h1>

        <address className="mt-6 font-inter text-base not-italic leading-7 text-gray-700 md:text-lg">
          1620 Boulevard Trudel Est
          <br />
          Saint-Boniface, QC
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
    </main>
  );
}
