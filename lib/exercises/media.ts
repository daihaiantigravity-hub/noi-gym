export const EXERCISE_MEDIA_BUCKET = "exercise-media";
export const MAX_EXERCISE_VIDEO_DURATION_SECONDS = 15;
export const MAX_EXERCISE_VIDEO_SIZE = 25 * 1024 * 1024;

export const EXERCISE_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;

export type ExerciseVideoType = (typeof EXERCISE_VIDEO_TYPES)[number];

export function isExerciseVideoType(value: string): value is ExerciseVideoType {
  return EXERCISE_VIDEO_TYPES.includes(value as ExerciseVideoType);
}

export function exerciseVideoExtension(type: ExerciseVideoType) {
  return type === "video/webm" ? "webm" : type === "video/quicktime" ? "mov" : "mp4";
}
