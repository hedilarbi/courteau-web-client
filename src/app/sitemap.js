// app/sitemap.js
import { SITE_URL } from "@/lib/siteUrl";

export default async function sitemap() {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now },
    { url: `${SITE_URL}/menu`, lastModified: now },
    { url: `${SITE_URL}/contact`, lastModified: now },
    { url: `${SITE_URL}/blogue`, lastModified: now },

    { url: `${SITE_URL}/a-propos`, lastModified: now },
    // ajoute /menu/c/[slug], /menu/[slug], /menu/offres/[slug] si stables
  ];
}
