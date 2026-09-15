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

async function fetchCategoriesAndProducts() {
  try {
    const categoriesResponse = await fetch(`${API_URL}/categories`, {
      cache: "no-store",
    });
    if (!categoriesResponse.ok) return { categories: [], products: [] };

    const categories = await categoriesResponse.json();
    const validCategories = Array.isArray(categories) ? categories : [];

    const categorySlugs = validCategories
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

    const products = results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );

    return { categories: validCategories, products };
  } catch {
    return { categories: [], products: [] };
  }
}

async function fetchActiveOffers() {
  try {
    const response = await fetch(`${API_URL}/offers`, {
      cache: "no-store",
    });
    if (!response.ok) return [];

    const offers = await response.json();
    const now = Date.now();

    return (Array.isArray(offers) ? offers : []).filter((offer) => {
      const slug = typeof offer?.slug === "string" ? offer.slug.trim() : "";
      if (!slug || /[/?#]/.test(slug)) return false;
      if (offer.deleted || offer.isDeleted || offer.deletedAt) return false;
      if (offer.active === false || offer.isActive === false) return false;

      if (offer.expireAt) {
        const expireAt = new Date(offer.expireAt).getTime();
        if (Number.isFinite(expireAt) && expireAt < now) return false;
      }

      try {
        encodeURIComponent(slug);
        return true;
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const staticPages = [
    { url: `${SITE_URL}/` },
    { url: `${SITE_URL}/menu` },
    { url: `${SITE_URL}/menu/offres` },
    { url: `${SITE_URL}/contact` },
    { url: `${SITE_URL}/blogue` },
    { url: `${SITE_URL}/a-propos` },
    { url: `${SITE_URL}/succursales` },
    { url: `${SITE_URL}/succursales/des-prairies-trois-rivieres` },
    {
      url: `${SITE_URL}/succursales/boulevard-des-forges-trois-rivieres`,
    },
    {
      url: `${SITE_URL}/succursales/chemin-ste-marguerite-trois-rivieres`,
    },
    { url: `${SITE_URL}/succursales/avenue-arseneault-becancour` },
    {
      url: `${SITE_URL}/succursales/boulevard-trudel-est-saint-boniface`,
    },
    { url: `${SITE_URL}/livraison` },
  ];

  const blogPages = blogueList.filter(isPublishedArticle).map((article) => {
    const lastModified = getArticleLastModified(article);

    return {
      url: `${SITE_URL}/blogue/${article.slug}`,
      ...(lastModified ? { lastModified } : {}),
    };
  });

  const { categories, products } = await fetchCategoriesAndProducts();

  const categoryPagesRaw = categories
    .filter((cat) => typeof cat?.slug === "string" && cat.slug.trim() !== "")
    .map((cat) => {
      const url = `${SITE_URL}/menu/${encodeURIComponent(cat.slug.trim())}`;
      const lastModified = getProductLastModified(cat);

      return {
        url,
        ...(lastModified ? { lastModified } : {}),
      };
    });

  const existingUrls = new Set([...staticPages, ...blogPages].map(p => p.url));
  const categoryPages = categoryPagesRaw.filter((p) => {
    if (existingUrls.has(p.url)) return false;
    existingUrls.add(p.url);
    return true;
  });

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

  const offers = await fetchActiveOffers();
  const offerPages = [
    ...new Set(offers.map((offer) => offer.slug.trim())),
  ].map((slug) => ({
    url: `${SITE_URL}/menu/offres/${encodeURIComponent(slug)}`,
  }));

  return [
    ...staticPages,
    ...blogPages,
    ...categoryPages,
    ...productPages,
    ...offerPages,
  ];
}
