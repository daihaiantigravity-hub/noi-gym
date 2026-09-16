import { EXERCISE_CATEGORY_ITEMS } from "./constants";

export type ExerciseTargetMode = "advanced" | "joint";

export type ExerciseTargetDefinition = {
  mode: ExerciseTargetMode;
  slug: string;
  label: string;
  pathSuffix?: string;
};

export const ADVANCED_TARGETS: readonly ExerciseTargetDefinition[] = [
  { mode: "advanced", slug: "neck", label: "Neck" },
  { mode: "advanced", slug: "feet", label: "Feet" },
  { mode: "advanced", slug: "groin", label: "Groin" },
  { mode: "advanced", slug: "upper-trapezius", label: "Upper Traps" },
  { mode: "advanced", slug: "gastrocnemius", label: "Gastrocnemius" },
  { mode: "advanced", slug: "tibialis", label: "Tibialis" },
  { mode: "advanced", slug: "soleus", label: "Soleus" },
  { mode: "advanced", slug: "outer-quadricep", label: "Outer Quadriceps" },
  { mode: "advanced", slug: "rectus-femoris", label: "Rectus Femoris" },
  { mode: "advanced", slug: "inner-quadricep", label: "Inner Quadriceps" },
  { mode: "advanced", slug: "inner-thigh", label: "Inner Thigh" },
  { mode: "advanced", slug: "wrist-extensors", label: "Wrist Extensors" },
  { mode: "advanced", slug: "wrist-flexors", label: "Wrist Flexors" },
  { mode: "advanced", slug: "long-head-bicep", label: "Long Head Bicep" },
  { mode: "advanced", slug: "short-head-bicep", label: "Short Head Bicep" },
  { mode: "advanced", slug: "obliques", label: "Obliques" },
  { mode: "advanced", slug: "lower-abdominals", label: "Lower Abdominals" },
  { mode: "advanced", slug: "upper-abdominals", label: "Upper Abdominals" },
  { mode: "advanced", slug: "mid-lower-pectoralis", label: "Mid and Lower Chest" },
  { mode: "advanced", slug: "upper-pectoralis", label: "Upper Pectoralis" },
  { mode: "advanced", slug: "anterior-deltoid", label: "Anterior Deltoid" },
  { mode: "advanced", slug: "lateral-deltoid", label: "Lateral Deltoid" },
  { mode: "advanced", slug: "hands", label: "Hands" },
];

export const JOINT_TARGETS: readonly ExerciseTargetDefinition[] = [
  { mode: "joint", slug: "shoulders", label: "Shoulders", pathSuffix: "recovery" },
  { mode: "joint", slug: "elbow", label: "Elbow", pathSuffix: "recovery" },
  { mode: "joint", slug: "wrist", label: "Wrist", pathSuffix: "recovery" },
  { mode: "joint", slug: "hips", label: "Hips", pathSuffix: "recovery" },
  { mode: "joint", slug: "knees", label: "Knees", pathSuffix: "recovery" },
  { mode: "joint", slug: "ankles", label: "Ankles", pathSuffix: "recovery" },
];

export const ALL_EXERCISE_TARGETS = [...ADVANCED_TARGETS, ...JOINT_TARGETS] as const;

const advancedBySlug = new Map(ADVANCED_TARGETS.map((target) => [target.slug, target]));
const jointBySlug = new Map(JOINT_TARGETS.map((target) => [target.slug, target]));

export function getAdvancedTarget(slug: string) {
  return advancedBySlug.get(slug.trim().toLowerCase());
}

export function getJointTarget(slug: string) {
  return jointBySlug.get(slug.trim().toLowerCase());
}

export function getTargetRoute(target: ExerciseTargetDefinition) {
  return `/exercises/${target.slug}${target.pathSuffix ? `/${target.pathSuffix}` : ""}`;
}

const categoryBySlug = new Map<string, string>(EXERCISE_CATEGORY_ITEMS.map((item) => [item.icon, item.label]));

export function getExerciseCategoryBySlug(slug: string) {
  return categoryBySlug.get(slug.trim().toLowerCase());
}

export function getExerciseCategorySlug(category: string) {
  return [...categoryBySlug.entries()].find(([, label]) => label === category)?.[0];
}

export function isAdvancedSlugConflict(slug: string) {
  return slug.trim().toLowerCase() === "obliques";
}

export function getAdvancedRoute(slug: string, categorySlug?: string) {
  const query = isAdvancedSlugConflict(slug) ? "?view=advanced" : "";
  return `/exercises/${slug}${categorySlug ? `/${categorySlug}` : ""}${query}`;
}
