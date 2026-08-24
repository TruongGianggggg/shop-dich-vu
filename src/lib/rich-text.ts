const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

export function richTextToPlainText(value: string | null | undefined) {
  if (!value) return "";

  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(?:blockquote|h[1-6]|li|p|td|th|tr)>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (entity, code: string) => {
      if (code.startsWith("#x")) {
        return decodeCodePoint(entity, Number.parseInt(code.slice(2), 16));
      }
      if (code.startsWith("#")) {
        return decodeCodePoint(entity, Number.parseInt(code.slice(1), 10));
      }
      return HTML_ENTITIES[code.toLowerCase()] ?? entity;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function decodeCodePoint(fallback: string, codePoint: number) {
  return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
    ? String.fromCodePoint(codePoint)
    : fallback;
}
