// app/blogue/[slug]/page.jsx
import blogueList from "@/constants/blogueData";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";

export const dynamic = "force-static"; // SSG si possible
export const revalidate = 60 * 60 * 24 * 7; // ISR: 7 jours

const BRAND = "Casse-Croûte Courteau";
const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lecourteau.com";

export async function generateStaticParams() {
  // SSG des articles connus
  return (blogueList || []).map((b) => ({ slug: b.slug }));
}

function summarize(text = "", max = 160) {
  const clean = String(text).replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max - 1) + "…" : clean;
}

export async function generateMetadata({ params }) {
  const post = (blogueList || []).find((b) => b.slug === params.slug);
  if (!post) {
    return {
      title: `Article introuvable | ${BRAND}`,
      robots: { index: false },
    };
  }
  const title = `${post.title} | ${BRAND}`;
  const description =
    post.excerpt ||
    summarize(
      post.full_content ||
        post.paragraphs?.map((p) => p.content).join(" ") ||
        ""
    );
  const canonical = `${BASE}/blogue/${post.slug}`;
  const imgAbs = (post.image || "").startsWith("http")
    ? post.image
    : `${BASE}${post.image || ""}`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description,
      siteName: BRAND,
      locale: "fr_CA",
      images: imgAbs
        ? [{ url: imgAbs, width: 1200, height: 630, alt: post.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imgAbs ? [imgAbs] : undefined,
    },
  };
}

export default function Page({ params }) {
  const { slug } = params;
  const blogue = (blogueList || []).find((item) => item.slug === slug);
  if (!blogue) return notFound();

  const canonical = `${BASE}/blogue/${blogue.slug}`;
  const imgAbs = (blogue.image || "").startsWith("http")
    ? blogue.image
    : `${BASE}${blogue.image || ""}`;

  // Dates & auteur (facultatifs dans tes données)
  const datePublished = blogue.datePublished || blogue.date || null; // ex: "2024-10-05"
  const dateModified = blogue.dateModified || datePublished || null;
  const authorName = blogue.author || "Équipe Le Courteau";

  // Temps de lecture (approx. 200 mots/min)
  const bodyText = [
    blogue.full_content || "",
    ...(Array.isArray(blogue.paragraphs)
      ? blogue.paragraphs.map((p) => p.content || "")
      : []),
  ].join(" ");
  const words = bodyText.trim().split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.round(words / 200));

  // JSON-LD BlogPosting
  const ldArticle = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blogue.title,
    ...(imgAbs ? { image: [imgAbs] } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    ...(datePublished ? { datePublished: datePublished } : {}),
    ...(dateModified ? { dateModified: dateModified } : {}),
    author: { "@type": "Person", name: authorName },
    publisher: {
      "@type": "Organization",
      name: BRAND,
      logo: { "@type": "ImageObject", url: `${BASE}/og/cover.jpg` },
    },
    articleSection: blogue.category || "Blogue",
    articleBody: bodyText,
  };

  // JSON-LD Breadcrumbs
  const ldBreadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: `${BASE}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blogue",
        item: `${BASE}/blogue`,
      },
      { "@type": "ListItem", position: 3, name: blogue.title, item: canonical },
    ],
  };

  return (
    <main className="md:mt-32 mt-22 pb-20">
      <nav aria-label="Fil d’Ariane" className="px-4 md:px-14">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-600">
          <li>
            <Link href="/" className="hover:underline">
              Accueil
            </Link>
          </li>
          <li aria-hidden>›</li>
          <li>
            <Link href="/blogue" className="hover:underline">
              Blogue
            </Link>
          </li>
          <li aria-hidden>›</li>
          <li aria-current="page" className="text-gray-900">
            {blogue.title}
          </li>
        </ol>
      </nav>

      {/* Hero + résumé */}
      <section className="px-4 md:px-14 flex md:flex-row flex-col md:gap-14 gap-8 pt-8 items-stretch">
        <article className="md:w-1/2 w-full">
          <h1 className="text-4xl md:text-6xl font-bold font-bebas-neue mb-3 md:mt-12">
            {blogue.title}
          </h1>

          <div className="text-sm text-gray-600 mb-4">
            {datePublished && (
              <time dateTime={datePublished}>
                Publié le{" "}
                {new Date(datePublished).toLocaleDateString("fr-CA", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            )}
            <span className="mx-2">•</span>
            <span>{readMins} min de lecture</span>
            <span className="mx-2">•</span>
            <span>Par {authorName}</span>
          </div>

          {blogue.full_content && (
            <p className="text-lg/relaxed md:text-xl font-inter mb-6 font-medium">
              {blogue.full_content}
            </p>
          )}
        </article>

        <div className="md:w-1/2 w-full">
          <div className="relative h-full min-h-[280px]">
            {blogue.image && (
              <Image
                src={blogue.image}
                alt={blogue.title}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="rounded-lg shadow-md object-cover"
                priority
              />
            )}
          </div>
        </div>
      </section>

      {/* Corps */}
      {Array.isArray(blogue.paragraphs) && blogue.paragraphs.length > 0 && (
        <section className="px-4 md:px-14 mt-10">
          <div className="space-y-6">
            {blogue.paragraphs.map((paragraph, index) => (
              <section key={index}>
                {paragraph.subtitle && (
                  <h2 className="text-xl font-semibold mb-2">
                    {paragraph.subtitle}
                  </h2>
                )}
                <p className="text-lg/relaxed font-inter">
                  {paragraph.content}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-10 flex md:flex-row flex-col md:gap-10 gap-6">
            <Link
              href="/blogue"
              className="text-lg font-semibold text-inter text-center px-8 py-2 bg-black text-pr rounded-md hover:underline"
            >
              Retour aux articles
            </Link>
            <Link
              href="/menu"
              className="text-lg font-semibold text-inter text-center px-8 py-2 bg-pr text-black rounded-md hover:underline"
            >
              Voir le menu
            </Link>
          </div>
        </section>
      )}

      {/* JSON-LD */}
      <Script
        id="ld-blogpost"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldArticle) }}
      />
      <Script
        id="ld-breadcrumbs"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldBreadcrumbs) }}
      />
    </main>
  );
}
