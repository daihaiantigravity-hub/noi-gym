import { EXERCISE_CATEGORY_ITEMS } from "./constants";

const categoryOrder = new Map(
  EXERCISE_CATEGORY_ITEMS.map((item, index) => [item.label.toLowerCase(), index]),
);

export function getExerciseCategoryOrder(category: string | null | undefined) {
  return categoryOrder.get(category?.trim().toLowerCase() ?? "") ?? Number.MAX_SAFE_INTEGER;
}
