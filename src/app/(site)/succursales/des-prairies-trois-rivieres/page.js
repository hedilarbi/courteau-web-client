import Link from "next/link";

export const metadata = {
  title: {
    absolute: "Casse-Croûte Courteau – Rue des Prairies | Trois-Rivières",
  },
  description:
    "Découvrez le Casse-Croûte Courteau situé au 3331 Rue des Prairies à Trois-Rivières. Consultez le menu et commandez en ligne.",
  alternates: {
    canonical:
      "https://www.lecourteau.com/succursales/des-prairies-trois-rivieres",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DesPrairiesPage() {
  return (
    <main className="md:px-14 px-4 md:py-16 py-10 md:mt-28 mt-20">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-lg md:p-10">
        <h1 className="font-bebas-neue text-3xl font-bold md:text-5xl">
          Casse-Croûte Courteau – Rue des Prairies
        </h1>

        <address className="mt-6 font-inter text-base not-italic leading-7 text-gray-700 md:text-lg">
          3331 Rue des Prairies
          <br />
          Trois-Rivières, QC G8V 1W7
          <br />
          Canada
        </address>

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
    </main>
  );
}
