// app/sitemap.js
import { SITE_URL } from "@/lib/siteUrl";
import blogueList from "@/constants/blogueData";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "https://api.lecourteau.com/api";

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

function isValidProduct(product) {
  const slug = typeof product?.slug === "string" ? product.slug.trim() : "";
  if (!slug || /[/?#]/.test(slug)) return false;
  if (product.is_available === false) return false;
  if (product.deleted || product.isDeleted || product.deletedAt) return false;
  if (product.active === false || product.isActive === false) return false;
  if (product.published === false || product.isPublished === false) return false;

  try {
    encodeURIComponent(slug);
    return true;
  } catch {
    return false;
  }
}

function getProductLastModified(product) {
  if (!product?.updatedAt) return undefined;

  const date = new Date(product.updatedAt);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function fetchMenuProducts() {
  try {
    const categoriesResponse = await fetch(`${API_URL}/categories`, {
      cache: "no-store",
    });
    if (!categoriesResponse.ok) return [];

    const categories = await categoriesResponse.json();
    const categorySlugs = (Array.isArray(categories) ? categories : [])
      .map((category) => category?.slug)
      .filter(Boolean);

    const results = await Promise.allSettled(
      categorySlugs.map(async (categorySlug) => {
        const response = await fetch(
          `${API_URL}/menuItems/category/slug/${encodeURIComponent(categorySlug)}`,
          { cache: "no-store" },
        );
        if (!response.ok) return [];

        const products = await response.json();
        return Array.isArray(products) ? products : [];
      }),
    );

    return results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const staticPages = [
    { url: `${SITE_URL}/` },
    { url: `${SITE_URL}/menu` },
    { url: `${SITE_URL}/contact` },
    { url: `${SITE_URL}/blogue` },
    { url: `${SITE_URL}/a-propos` },
  ];

  const blogPages = blogueList.filter(isPublishedArticle).map((article) => {
    const lastModified = getArticleLastModified(article);

    return {
      url: `${SITE_URL}/blogue/${article.slug}`,
      ...(lastModified ? { lastModified } : {}),
    };
  });

  const products = await fetchMenuProducts();
  const uniqueProducts = [
    ...new Map(
      products
        .filter(isValidProduct)
        .map((product) => [
          product.slug.trim(),
          { ...product, slug: product.slug.trim() },
        ]),
    ).values(),
  ];
  const productPages = uniqueProducts.map((product) => {
    const lastModified = getProductLastModified(product);

    return {
      url: `${SITE_URL}/menu/articles/${encodeURIComponent(product.slug)}`,
      ...(lastModified ? { lastModified } : {}),
    };
  });

  return [...staticPages, ...blogPages, ...productPages];
}
