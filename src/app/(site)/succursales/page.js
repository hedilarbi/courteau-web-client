import Link from "next/link";

export const metadata = {
  title: {
    absolute:
      "Succursales à Trois-Rivières, Bécancour et Saint-Boniface | Casse-Croûte Courteau",
  },
  description:
    "Découvrez les 5 succursales du Casse-Croûte Courteau à Trois-Rivières, Bécancour et Saint-Boniface. Consultez leurs adresses et accédez au menu.",
  alternates: {
    canonical: "https://www.lecourteau.com/succursales",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const branches = [
  {
    name: "Casse-Croûte Courteau – Rue des Prairies",
    street: "3331 Rue des Prairies",
    locality: "Trois-Rivières, QC G8V 1W7",
    href: "/succursales/des-prairies-trois-rivieres",
  },
  {
    name: "Casse-Croûte Courteau – Boulevard des Forges",
    street: "4845 Boulevard des Forges",
    locality: "Trois-Rivières, QC G8Y 4Z3",
    href: "/succursales/boulevard-des-forges-trois-rivieres",
  },
  {
    name: "Casse-Croûte Courteau – Chemin Ste-Marguerite",
    street: "9866 Chemin Ste-Marguerite",
    locality: "Trois-Rivières, QC",
    href: "/succursales/chemin-ste-marguerite-trois-rivieres",
  },
  {
    name: "Casse-Croûte Courteau – Avenue Arseneault",
    street: "3840 Avenue Arseneault",
    locality: "Bécancour, QC G9H 1V8",
    href: "/succursales/avenue-arseneault-becancour",
  },
  {
    name: "Casse-Croûte Courteau – Boulevard Trudel Est",
    street: "1620 Boulevard Trudel Est",
    locality: "Saint-Boniface, QC",
    href: "/succursales/boulevard-trudel-est-saint-boniface",
  },
];

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
      name: "Succursales",
      item: "https://www.lecourteau.com/succursales",
    },
  ],
};

export default function SuccursalesPage() {
  return (
    <main className="md:px-14 px-4 md:py-16 py-10 md:mt-28 mt-20">
      <section className="mx-auto max-w-6xl">
        <nav aria-label="Fil d’Ariane" className="mb-4 text-sm">
          <ol className="flex flex-wrap items-center gap-1 text-gray-600">
            <li>
              <Link href="/" className="hover:underline">
                Accueil
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-gray-900 font-medium">
              Succursales
            </li>
          </ol>
        </nav>
        <h1 className="font-bebas-neue text-3xl font-bold md:text-5xl">
          Nos succursales
        </h1>
        <p className="mt-4 max-w-4xl font-inter text-base leading-7 text-gray-700 md:text-lg">
          Retrouvez les cinq succursales du Casse-Croûte Courteau à
          Trois-Rivières, Bécancour et Saint-Boniface. Choisissez
          l’établissement le plus près de chez vous pour consulter ses
          informations et commander en ligne.
        </p>

        <ul className="mt-8 grid list-none gap-6 md:grid-cols-2">
          {branches.map((branch) => (
            <li key={branch.href}>
              <article className="h-full rounded-lg bg-white p-6 shadow-md">
                <h2 className="font-bebas-neue text-2xl font-bold md:text-3xl">
                  <Link href={branch.href} className="hover:text-pr">
                    {branch.name}
                  </Link>
                </h2>
                <address className="mt-4 font-inter not-italic leading-7 text-gray-700">
                  {branch.street}
                  <br />
                  {branch.locality}
                </address>
                <Link
                  href={branch.href}
                  className="mt-6 inline-block rounded-md bg-pr px-5 py-2 font-bebas-neue text-lg text-black"
                >
                  Voir cette succursale
                </Link>
              </article>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <Link
            href="/menu"
            className="inline-block rounded-md bg-black px-6 py-3 font-bebas-neue text-lg text-white"
          >
            Voir le menu
          </Link>
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}
