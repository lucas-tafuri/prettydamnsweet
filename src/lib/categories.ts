/**
 * Single source of truth for portfolio categories.
 * Used by portfolio pages, nav/filters, CMS labels, and cards.
 */
export type CategorySlug =
  | "design-and-motion"
  | "branded-content"
  | "immersive-experiences"
  | "healthcare"
  | "sports"
  | "film-and-theater";

export interface CategoryMeta {
  slug: CategorySlug;
  title: string;
  blurb: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: "design-and-motion",
    title: "Design & Motion",
    blurb: "Bold design brought to life with captivating movement.",
  },
  {
    slug: "branded-content",
    title: "Branded Content",
    blurb: "Full service storytelling that elevates brands across every screen.",
  },
  {
    slug: "immersive-experiences",
    title: "Immersive Experiences",
    blurb: "Screens, media servers, projection mapping and mixed reality media.",
  },
  {
    slug: "healthcare",
    title: "Healthcare",
    blurb: "Clear, human storytelling for healthcare and wellness brands.",
  },
  {
    slug: "sports",
    title: "Sports",
    blurb: "High-energy content for teams, leagues and live sports moments.",
  },
  {
    slug: "film-and-theater",
    title: "Film & Theater",
    blurb: "Cinematic and stage work blending narrative with spectacle.",
  },
];

export const CATEGORY_BY_SLUG: Record<CategorySlug, CategoryMeta> =
  Object.fromEntries(CATEGORIES.map((c) => [c.slug, c])) as Record<
    CategorySlug,
    CategoryMeta
  >;

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.title])
);

/** Filter nav: All first, then every category */
export const PORTFOLIO_FILTERS: { slug: string; label: string }[] = [
  { slug: "", label: "All" },
  ...CATEGORIES.map((c) => ({ slug: c.slug, label: c.title })),
];

export function isCategorySlug(value: string): value is CategorySlug {
  return value in CATEGORY_BY_SLUG;
}

export function categoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? slug;
}
