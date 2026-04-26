/**
 * Generate a URL-safe slug from a Vietnamese/Chinese/Latin title.
 * Strips diacritics, lowercases, replaces non-alphanumeric runs with hyphens.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

/** Slugify title and append a 6-char hex suffix for uniqueness. */
export function generateSlug(title: string): string {
  const base = slugify(title) || "nhom";
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6);
  return `${base}-${suffix}`;
}
