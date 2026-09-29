import type { ExerciseGender } from "./types";

export function parseExerciseGender(value: string | string[] | undefined): ExerciseGender | undefined {
  const gender = Array.isArray(value) ? value[0] : value;
  return gender === "male" || gender === "female" ? gender : undefined;
}

export function withExerciseGender(route: string, gender?: ExerciseGender) {
  if (!gender) return route;

  const [pathname, query = ""] = route.split("?", 2);
  const searchParams = new URLSearchParams(query);
  searchParams.set("gender", gender);
  return `${pathname}?${searchParams.toString()}`;
}
