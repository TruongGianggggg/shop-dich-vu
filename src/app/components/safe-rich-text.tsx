"use client";

import DOMPurify from "dompurify";
import { useCallback, useSyncExternalStore } from "react";

function subscribeToBrowserSnapshot() {
  return () => undefined;
}

export function SafeRichText({ className, html }: { className?: string; html: string }) {
  const getSanitizedHtml = useCallback(
    () => DOMPurify.sanitize(html, {
      ALLOWED_ATTR: ["colspan", "href", "rel", "rowspan", "target"],
      ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "s", "h2", "h3", "ul", "ol", "li", "blockquote", "a", "table", "thead", "tbody", "tfoot", "tr", "th", "td"],
    }),
    [html],
  );
  const sanitizedHtml = useSyncExternalStore(
    subscribeToBrowserSnapshot,
    getSanitizedHtml,
    () => "",
  );

  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
}
