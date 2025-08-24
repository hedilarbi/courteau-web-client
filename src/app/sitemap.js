// app/sitemap.js
export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.example.com";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/menu`, lastModified: now },
    { url: `${base}/contact`, lastModified: now },
    { url: `${base}/blogue`, lastModified: now },

    { url: `${base}/a-propos`, lastModified: now },
    // ajoute /menu/c/[slug], /menu/[slug], /menu/offres/[slug] si stables
  ];
}
