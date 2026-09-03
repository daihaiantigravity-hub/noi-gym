import type {
  ExerciseAngle,
  ExerciseDifficulty,
  ExerciseForce,
  ExerciseGender,
  ExerciseGrip,
  ExerciseMechanic,
  ExerciseSource,
  ExerciseStatus,
} from "./types";

export const EXERCISE_CATEGORIES = [
  "Band",
  "Barbell",
  "Bodyweight",
  "Cables",
  "Dumbbells",
  "Kettlebells",
  "Machine",
  "Stretches",
] as const;

export const EXERCISE_MUSCLES = [
  "Abdominals",
  "Anterior Deltoid",
  "Biceps",
  "Calves",
  "Chest",
  "Forearms",
  "Front Shoulders",
  "Gastrocnemius",
  "Glutes",
  "Gluteus Maximus",
  "Gluteus Medius",
  "Hamstrings",
  "Lateral Deltoid",
  "Lateral Hamstrings",
  "Lats",
  "Long Head Bicep",
  "Long Head Tricep",
  "Lower Abdominals",
  "Lower back",
  "Medial Hamstrings",
  "Obliques",
  "Posterior Deltoid",
  "Quads",
  "Rear Shoulders",
  "Shoulders",
  "Short Head Bicep",
  "Traps",
  "Traps (mid-back)",
  "Triceps",
  "Upper Abdominals",
  "Upper Traps",
] as const;

export const EXERCISE_DIFFICULTIES: ExerciseDifficulty[] = ["Beginner", "Novice", "Intermediate", "Advanced"];
export const EXERCISE_FORCES: ExerciseForce[] = ["Push", "Pull", "Hold"];
export const EXERCISE_GRIPS: ExerciseGrip[] = ["Mixed", "Neutral", "None", "Overhand", "Underhand"];
export const EXERCISE_MECHANICS: ExerciseMechanic[] = ["Compound", "Isolation"];
export const EXERCISE_STATUSES: ExerciseStatus[] = ["Draft", "Published", "Archived"];
export const EXERCISE_SOURCES: ExerciseSource[] = ["custom", "musclewiki"];
export const EXERCISE_GENDERS: ExerciseGender[] = ["male", "female"];
export const EXERCISE_ANGLES: ExerciseAngle[] = ["front", "side"];

export const EMPTY_EXERCISE_FORM: import("./types").ExerciseFormValues = {
  source: "custom",
  sourceId: null,
  name: "",
  slug: "",
  description: "",
  primaryMuscles: [],
  category: "",
  force: "",
  grips: "",
  mechanic: "",
  difficulty: "",
  status: "Draft",
  steps: [""],
  media: [],
};
