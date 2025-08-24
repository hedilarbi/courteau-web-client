// app/contact/page.jsx
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";

export const dynamic = "force-static";
export const revalidate = 60 * 60 * 24 * 30; // 30 jours

export async function generateMetadata() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com";
  const brand = "Casse-Croûte Courteau";
  const title = `Contact | ${brand}`;
  const description =
    "Contactez le Casse-Croûte Courteau. Retrouvez nos succursales en Mauricie (Trois-Rivières, Bécancour, Saint-Boniface) : adresses, téléphone et plan d’accès.";
  const ogImage = `${base}/og/cover.jpg`; // remplace par ton image OG si dispo

  return {
    title,
    description,
    alternates: { canonical: `${base}/contact` },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      url: `${base}/contact`,
      title,
      description,
      siteName: brand,
      locale: "fr_CA",
      images: [{ url: ogImage, width: 1200, height: 630, alt: brand }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function Page() {
  const brand = "Casse-Croûte Courteau";
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com";

  // Centralise les données (évite la duplication + facilite le JSON-LD)
  const telDisplay = "(819) 371-3935";
  const telHref = "+18193713935";

  const branches = [
    {
      id: "prairies",
      title: "Trois-Rivières — Rue des Prairies",
      street: "3331 Rue des Prairies",
      locality: "Trois-Rivières",
      region: "QC",
      postal: "G8V 1W7",
      country: "CA",
      phoneDisplay: telDisplay,
      phoneHref: telHref,
      map: "https://maps.app.goo.gl/RkC73qVxZRr2bcQg7",
      image: "/RuePrairies.png",
      imageAlt: "Façade de la succursale Rue des Prairies à Trois-Rivières",
    },
    {
      id: "sainte-marguerite",
      title: "Trois-Rivières — Chemin Ste-Marguerite (Pointe-du-Lac)",
      street: "9866 Chemin Ste-Marguerite",
      locality: "Trois-Rivières",
      region: "QC",
      postal: "",
      country: "CA",
      phoneDisplay: telDisplay,
      phoneHref: telHref,
      map: "https://maps.app.goo.gl/FHAU1jaBWWTZCwJ67",
      image: "/SainteMarguerite.png",
      imageAlt: "Façade de la succursale Chemin Ste-Marguerite",
    },
    {
      id: "arseneault",
      title: "Bécancour — Avenue Arseneault",
      street: "3840 Avenue Arseneault",
      locality: "Bécancour",
      region: "QC",
      postal: "G9H 1V8",
      country: "CA",
      phoneDisplay: telDisplay,
      phoneHref: telHref,
      map: "https://maps.app.goo.gl/f837Pnoocha1bQRB8",
      image: "/Arsenault.png",
      imageAlt: "Façade de la succursale Avenue Arseneault à Bécancour",
    },
    {
      id: "forges",
      title: "Trois-Rivières — Boulevard des Forges",
      street: "4845 Boulevard des Forges",
      locality: "Trois-Rivières",
      region: "QC",
      postal: "G8Y 4Z3",
      country: "CA",
      phoneDisplay: telDisplay,
      phoneHref: telHref,
      map: "https://maps.app.goo.gl/irLjMWLqxuweUSGfA",
      image: "/map-courteau-bd-forges.png",
      imageAlt: "Façade de la succursale Boulevard des Forges",
    },
    {
      id: "trudel",
      title: "Saint-Boniface — Boulevard Trudel Est",
      street: "1620 Boulevard Trudel Est",
      locality: "Saint-Boniface",
      region: "QC",
      postal: "",
      country: "CA",
      phoneDisplay: telDisplay,
      phoneHref: telHref,
      map: "https://maps.app.goo.gl/2iiLtKimnS9NMAZh6",
      image: "/Trudel.png",
      imageAlt: "Façade de la succursale Boulevard Trudel Est à Saint-Boniface",
    },
  ];

  // JSON-LD principal (Restaurant) + succursales (departments) + fil d’Ariane
  const restaurantId = `${base}/#restaurant`;
  const ldGraph = [
    {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "@id": restaurantId,
      name: brand,
      url: base,
      image: `${base}/og/cover.jpg`,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Trois-Rivières",
        addressRegion: "QC",
        addressCountry: "CA",
      },
      areaServed: ["Trois-Rivières", "Bécancour", "Saint-Boniface", "Mauricie"],
      telephone: telHref,
      servesCuisine: ["Casse-croûte", "Poutine", "Burgers", "Sandwichs"],
      priceRange: "$$",
    },
    ...branches.map((b) => ({
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "@id": `${base}/contact#${b.id}`,
      name: `${brand} — ${b.title}`,
      url: `${base}/contact#${b.id}`,
      branchOf: { "@id": restaurantId },
      address: {
        "@type": "PostalAddress",
        streetAddress: b.street,
        addressLocality: b.locality,
        addressRegion: b.region,
        postalCode: b.postal || undefined,
        addressCountry: b.country,
      },
      telephone: b.phoneHref,
      hasMap: b.map,
      image: `${base}${b.image}`,
    })),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${base}/` },
        {
          "@type": "ListItem",
          position: 2,
          name: "Contact",
          item: `${base}/contact`,
        },
      ],
    },
  ];

  return (
    <div className="md:mt-28 mt-18 pb-20">
      {/* Hero */}
      <section
        className="bg-black flex justify-center items-center md:h-[25vh] h-[35vh]"
        aria-labelledby="contact-title"
      >
        <div className="px-4 text-center">
          <h1
            id="contact-title"
            className="text-white text-3xl md:text-5xl font-bold font-bebas-neue"
          >
            Contactez-nous
          </h1>
          <p className="text-white/90 mt-2 font-inter">
            Des questions? Appelez-nous au{" "}
            <a href={`tel:${telHref}`} className="underline">
              {telDisplay}
            </a>
            .
          </p>
        </div>
      </section>

      {/* Succursales */}
      <section className="md:px-14 px-4 mt-10" aria-labelledby="branches-title">
        <h2
          id="branches-title"
          className="text-2xl md:text-4xl font-bold font-bebas-neue text-center mb-6"
        >
          Nos succursales
        </h2>

        <div className="grid md:grid-cols-2 grid-cols-1 gap-6">
          {branches.map((b) => (
            <article
              key={b.id}
              id={b.id}
              className="bg-white p-6 rounded-lg shadow-md font-inter"
              aria-labelledby={`${b.id}-title`}
            >
              <h3
                id={`${b.id}-title`}
                className="text-xl font-semibold text-center"
              >
                <Link
                  href={b.map}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-pr"
                  title={`Ouvrir l’itinéraire vers ${b.title} (Google Maps)`}
                >
                  {b.street}, {b.locality}
                  {b.region ? `, ${b.region}` : ""} {b.postal}
                </Link>
              </h3>

              <p className="text-gray-600 text-center mt-3">
                <a href={`tel:${b.phoneHref}`} className="hover:underline">
                  {b.phoneDisplay}
                </a>
              </p>

              <div className="mt-3 rounded-3xl overflow-hidden">
                <Image
                  src={b.image}
                  alt={b.imageAlt}
                  width={1000}
                  height={600}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 600px"
                  className="w-full h-auto"
                  priority={b.id === "prairies"} // priorité sur la 1ère
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* JSON-LD */}
      <Script
        id="ld-contact-graph"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldGraph) }}
      />
    </div>
  );
}
