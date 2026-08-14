import Image from "next/image";
import Link from "next/link";
import React from "react";
import blogueList from "@/constants/blogueData";

// 🧩 SEO dynamique
export const metadata = {
  title: "Blogue | Casse-Croûte Courteau — Nos articles gourmands et nouvelles",
  description:
    "Découvrez nos articles de blogue gourmands : conseils, nouveautés et coulisses du Casse-Croûte Courteau. 🍔 Restez à jour sur nos plats, événements et promotions!",
  alternates: {
    canonical: "/blogue",
  },
  openGraph: {
    type: "website",
    locale: "fr_CA",
    url: "https://www.lecourteau.com/blogue",
    siteName: "Casse-Croûte Courteau",
    title: "Blogue | Casse-Croûte Courteau — Actualités et gourmandises",
    description:
      "Plongez dans l’univers du Casse-Croûte Courteau à travers nos articles : recettes, inspirations et nouveautés gourmandes!",
    images: [
      {
        url: "https://www.lecourteau.com/logo.png",
        width: 1200,
        height: 630,
        alt: "Blogue Casse-Croûte Courteau",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blogue | Casse-Croûte Courteau",
    description:
      "Articles gourmands, conseils, nouveautés — découvrez le blogue du Casse-Croûte Courteau 🍔",
    images: ["https://www.lecourteau.com/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const Page = () => {
  return (
    <div className="md:mt-28 mt-18 pb-20" id="main">
      {/* 🏷️ Section Hero */}
      <section
        className="bg-black flex justify-center items-center md:h-[40vh] h-[50vh]"
        aria-labelledby="blogue-title"
      >
        <div className="px-4 text-center max-w-5xl">
          <h1
            id="blogue-title"
            className="text-white text-3xl md:text-5xl font-bold font-bebas-neue"
          >
            Notre blogue gourmand
          </h1>
          <p className="text-white text-base md:text-xl mt-4 font-inter font-semibold">
            Plongez dans les coulisses du Casse-Croûte Courteau : découvrez nos
            recettes, astuces et nouvelles saveurs à ne pas manquer!
          </p>
        </div>
      </section>

      {/* 📰 Liste des articles */}
      <section className="md:px-14 px-4 mt-10">
        <h2
          id="blogue-list-title"
          className="text-2xl md:text-4xl font-bold font-bebas-neue text-center mb-6"
        >
          Articles récents
        </h2>

        <div className="grid md:grid-cols-3 grid-cols-1 gap-6">
          {blogueList.map((article) => (
            <article
              key={article.id}
              className="bg-white p-6 rounded-lg shadow-md font-inter h-full flex flex-col"
              aria-labelledby={`${article.slug}-title`}
            >
              <Image
                src={article.image}
                alt={article.title}
                width={800}
                height={600}
                sizes="(max-width:768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="w-full h-48 object-cover rounded-md mb-4"
              />
              <h3
                id={`${article.slug}-title`}
                className="text-xl font-semibold text-center mb-4"
              >
                <Link href={article.link} className="hover:underline">
                  {article.title}
                </Link>
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-4">
                {article.content}
              </p>
              <Link
                href={article.link}
                className="bg-pr text-black px-4 py-2 rounded-md hover:bg-pr/80 transition-colors font-inter font-semibold text-center mx-auto mt-auto"
              >
                Lire l&apos;article
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ✅ Données structurées JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "Casse-Croûte Courteau — Blogue",
            url: "https://www.lecourteau.com/blogue",
            description:
              "Articles et actualités gourmandes du Casse-Croûte Courteau : recettes, promotions et événements.",
            author: {
              "@type": "Organization",
              name: "Casse-Croûte Courteau",
              url: "https://www.lecourteau.com",
            },
            publisher: {
              "@type": "Organization",
              name: "Casse-Croûte Courteau",
              logo: {
                "@type": "ImageObject",
                url: "https://www.lecourteau.com/logo.png",
              },
            },
          }),
        }}
      />
    </div>
  );
};

export default Page;
