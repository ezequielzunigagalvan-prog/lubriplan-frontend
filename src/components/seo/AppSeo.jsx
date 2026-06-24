import React from "react";
import { useLocation } from "react-router-dom";
import Seo from "./Seo";
import { DEFAULT_SEO, PUBLIC_ROUTE_SEO, buildCanonical } from "./seoConfig";

export default function AppSeo() {
  const location = useLocation();
  const pathname = location.pathname || "/";
  const publicMeta = PUBLIC_ROUTE_SEO[pathname];

  if (publicMeta) {
    return (
      <Seo
        title={publicMeta.title}
        description={publicMeta.description}
        keywords={publicMeta.keywords || DEFAULT_SEO.keywords}
        canonical={buildCanonical(pathname)}
        includeCoreSchemas
      />
    );
  }

  return (
    <Seo
      title={DEFAULT_SEO.title}
      description={DEFAULT_SEO.description}
      keywords={DEFAULT_SEO.keywords}
      canonical={buildCanonical(pathname)}
      noindex
    />
  );
}
