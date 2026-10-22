import { getExerciseCategoryOrder } from "./category-order";

export type PublicRankableExercise = {
  id: string;
  name: string;
  category: string;
  updated_at: string;
};

export type ExercisePriority = {
  favoriteCounts: ReadonlyMap<string, number>;
  featuredExerciseIds: ReadonlySet<string>;
};

export function comparePublicExercisePriority(
  first: PublicRankableExercise,
  second: PublicRankableExercise,
  priority: ExercisePriority,
) {
  const featuredDifference = Number(priority.featuredExerciseIds.has(second.id)) - Number(priority.featuredExerciseIds.has(first.id));
  if (featuredDifference !== 0) return featuredDifference;

  const favoriteDifference = (priority.favoriteCounts.get(second.id) ?? 0) - (priority.favoriteCounts.get(first.id) ?? 0);
  if (favoriteDifference !== 0) return favoriteDifference;

  const categoryDifference = getExerciseCategoryOrder(first.category) - getExerciseCategoryOrder(second.category);
  if (categoryDifference !== 0) return categoryDifference;

  const updatedAtDifference = new Date(second.updated_at).getTime() - new Date(first.updated_at).getTime();
  if (updatedAtDifference !== 0) return updatedAtDifference;

  return first.name.localeCompare(second.name);
}
