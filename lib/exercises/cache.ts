import { revalidateTag } from "next/cache";

export const PUBLIC_EXERCISES_CACHE_TAG = "public-exercises";
export const PUBLIC_EXERCISES_CONTENT_CACHE_TAG = "public-exercise-content";
export const PUBLIC_EXERCISES_PRIORITY_CACHE_TAG = "public-exercise-priority";

export function isExerciseDataCacheEnabled() {
  return process.env.EXERCISE_DATA_CACHE_DISABLED !== "true";
}

/** Content and its approved translation must move to the same revision. */
export function invalidateExerciseContent() {
  revalidateTag(PUBLIC_EXERCISES_CONTENT_CACHE_TAG, { expire: 0 });
  revalidateTag(PUBLIC_EXERCISES_CACHE_TAG, { expire: 0 });
  revalidateTag(PUBLIC_EXERCISES_PRIORITY_CACHE_TAG, { expire: 0 });
}

/** Refresh ordering in the background, while retaining public text and media. */
export function invalidateExerciseRanking() {
  // Ranking is computed outside the cache, so fresh counts are used on the next
  // read after refresh without waiting for another nested cache to expire.
  revalidateTag(PUBLIC_EXERCISES_PRIORITY_CACHE_TAG, "max");
  revalidateTag(PUBLIC_EXERCISES_CACHE_TAG, "max");
}
