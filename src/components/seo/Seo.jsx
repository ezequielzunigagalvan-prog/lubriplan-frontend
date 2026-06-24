import React from "react";
import { Helmet } from "react-helmet-async";
import { DEFAULT_OG_IMAGE, DEFAULT_SEO, buildCoreSchemas } from "./seoConfig";

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default function Seo({
  title,
  description,
  keywords,
  canonical,
  image,
  type = "website",
  noindex = false,
  includeCoreSchemas = false,
  schema = [],
}) {
  const finalTitle = title || DEFAULT_SEO.title;
  const finalDescription = description || DEFAULT_SEO.description;
  const finalKeywords = Array.isArray(keywords)
    ? keywords.join(", ")
    : keywords || DEFAULT_SEO.keywords.join(", ");
  const finalImage = image || DEFAULT_OG_IMAGE;
  const robots = noindex ? "noindex, nofollow" : "index, follow";
  const schemas = [
    ...(includeCoreSchemas ? buildCoreSchemas() : []),
    ...toArray(schema),
  ];

  return (
    <Helmet prioritizeSeoTags>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={canonical || "https://www.lubriplan.com/"} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="LubriPlan" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      {schemas.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}
