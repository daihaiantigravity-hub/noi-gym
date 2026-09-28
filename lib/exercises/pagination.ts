export const PUBLIC_EXERCISES_PAGE_SIZE = 5;

export type PaginationItem = number | "ellipsis";

/** A smaller window on phones keeps both arrows on the same row. */
export function getPaginationItems(page: number, totalPages: number, slots: 5 | 7 = 7): PaginationItem[] {
  if (totalPages <= slots) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const siblings = slots === 7 ? 1 : 0;
  const edgeCount = slots - 2;
  if (page <= edgeCount - siblings) {
    return [...Array.from({ length: edgeCount }, (_, index) => index + 1), "ellipsis", totalPages];
  }
  if (page >= totalPages - edgeCount + siblings + 1) {
    return [1, "ellipsis", ...Array.from({ length: edgeCount }, (_, index) => totalPages - edgeCount + index + 1)];
  }
  return [1, "ellipsis", ...Array.from({ length: siblings * 2 + 1 }, (_, index) => page - siblings + index), "ellipsis", totalPages];
}

export function getPageHref(path: string, page: number) {
  const [pathname, query = ""] = path.split("?", 2);
  const searchParams = new URLSearchParams(query);
  if (page <= 1) searchParams.delete("page");
  else searchParams.set("page", String(page));
  const serializedQuery = searchParams.toString();
  return `${pathname}${serializedQuery ? `?${serializedQuery}` : ""}`;
}

export function parsePage(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const page = Number(rawValue);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function paginate<T>(items: T[], page: number, pageSize = PUBLIC_EXERCISES_PAGE_SIZE) {
  const total = items.length;
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
  };
}
