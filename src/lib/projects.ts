/** Shared project listing helpers */

type Ordered = { data: { order: number } };

/**
 * Sort by CMS `order` as priority — higher numbers appear first.
 * Default / unset priority is 0 (shows last among set priorities).
 */
export function sortByPriority<T extends Ordered>(projects: T[]): T[] {
  return [...projects].sort((a, b) => b.data.order - a.data.order);
}
