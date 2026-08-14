// app/sitemap.js
import { SITE_URL } from "@/lib/siteUrl";
import blogueList from "@/constants/blogueData";

function isPublishedArticle(article) {
  if (!article?.slug) return false;
  if (article.draft || article.isDraft) return false;
  if (article.deleted || article.isDeleted || article.deletedAt) return false;
  if (article.published === false || article.isPublished === false) return false;

  const status = String(article.status || "").toLowerCase();
  return !status || ["published", "publie", "publié"].includes(status);
}

function getArticleLastModified(article) {
  const value =
    article.dateModified ||
    article.updatedAt ||
    article.datePublished ||
    article.publishedAt ||
    article.date;

  if (!value) return undefined;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function sitemap() {
  const now = new Date();
  const staticPages = [
    { url: `${SITE_URL}/`, lastModified: now },
    { url: `${SITE_URL}/menu`, lastModified: now },
    { url: `${SITE_URL}/contact`, lastModified: now },
    { url: `${SITE_URL}/blogue`, lastModified: now },
    { url: `${SITE_URL}/a-propos`, lastModified: now },
  ];

  const blogPages = blogueList.filter(isPublishedArticle).map((article) => {
    const lastModified = getArticleLastModified(article);

    return {
      url: `${SITE_URL}/blogue/${article.slug}`,
      ...(lastModified ? { lastModified } : {}),
    };
  });

  return [...staticPages, ...blogPages];
}
