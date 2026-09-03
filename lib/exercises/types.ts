export type ExerciseSource = "custom" | "musclewiki";
export type ExerciseStatus = "Draft" | "Published" | "Archived";
export type ExerciseDifficulty = "Beginner" | "Novice" | "Intermediate" | "Advanced";
export type ExerciseForce = "Push" | "Pull" | "Hold";
export type ExerciseGrip = "Mixed" | "Neutral" | "None" | "Overhand" | "Underhand";
export type ExerciseMechanic = "Compound" | "Isolation";
export type ExerciseGender = "male" | "female";
export type ExerciseAngle = "front" | "side";

export type ExerciseMediaValue = {
  gender: ExerciseGender;
  angle: ExerciseAngle;
  videoUrl: string;
  posterUrl: string;
};

export type ExerciseFormValues = {
  source: ExerciseSource;
  sourceId: number | null;
  name: string;
  slug: string;
  description: string;
  primaryMuscles: string[];
  category: string;
  force: ExerciseForce | "";
  grips: ExerciseGrip | "";
  mechanic: ExerciseMechanic | "";
  difficulty: ExerciseDifficulty | "";
  status: ExerciseStatus;
  steps: string[];
  media: ExerciseMediaValue[];
  sourceSnapshot?: Record<string, unknown> | null;
};

export type ExerciseRecord = ExerciseFormValues & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicExercise = {
  id: string;
  name: string;
  description: string;
  primaryMuscles: string[];
  category: string;
  difficulty: ExerciseDifficulty | "";
  steps: string[];
  media: ExerciseMediaValue[];
};

export type ExerciseListItem = Pick<
  ExerciseRecord,
  "id" | "source" | "sourceId" | "name" | "slug" | "category" | "difficulty" | "status" | "updatedAt"
> & {
  primaryMuscles: string[];
  stepsCount: number;
  mediaCount: number;
};

export type ExerciseSourceOption = {
  id: number;
  name: string;
  category: string;
  primaryMuscles: string[];
  difficulty: ExerciseDifficulty | "";
};

export type ExerciseListFilters = {
  page?: number;
  pageSize?: number;
  query?: string;
  status?: ExerciseStatus | "";
  category?: string;
  muscle?: string;
  source?: ExerciseSource | "";
};

export type ExerciseStats = {
  total: number;
  draft: number;
  published: number;
  archived: number;
};
