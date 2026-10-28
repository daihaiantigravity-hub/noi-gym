import { EXERCISE_MUSCLES } from "@/lib/exercises/constants";

export const WORKOUT_WEEKDAYS = [
  { weekday: 1, label: "Monday" },
  { weekday: 2, label: "Tuesday" },
  { weekday: 3, label: "Wednesday" },
  { weekday: 4, label: "Thursday" },
  { weekday: 5, label: "Friday" },
  { weekday: 6, label: "Saturday" },
  { weekday: 7, label: "Sunday" },
] as const;

export type WorkoutWeekday = (typeof WORKOUT_WEEKDAYS)[number]["weekday"];
export type WorkoutScheduleDay = { weekday: WorkoutWeekday; muscleGroups: string[] };

// Cardio is a training focus in the existing weekly template, although it is not an anatomical muscle.
export const WORKOUT_SCHEDULE_GROUPS = [...EXERCISE_MUSCLES, "Cardio"] as const;
export type WorkoutScheduleGroup = (typeof WORKOUT_SCHEDULE_GROUPS)[number];

export const DEFAULT_WORKOUT_SCHEDULE: WorkoutScheduleDay[] = [
  { weekday: 1, muscleGroups: ["Chest", "Shoulders", "Triceps"] },
  { weekday: 2, muscleGroups: ["Lats", "Lower back", "Biceps"] },
  { weekday: 3, muscleGroups: ["Quads", "Hamstrings", "Glutes", "Calves"] },
  { weekday: 4, muscleGroups: ["Chest", "Lats", "Shoulders", "Biceps", "Triceps"] },
  { weekday: 5, muscleGroups: ["Quads", "Hamstrings", "Glutes", "Abdominals"] },
  { weekday: 6, muscleGroups: ["Cardio", "Abdominals", "Obliques"] },
  { weekday: 7, muscleGroups: [] },
];

export function createDefaultWorkoutSchedule(): WorkoutScheduleDay[] {
  return DEFAULT_WORKOUT_SCHEDULE.map((day) => ({ ...day, muscleGroups: [...day.muscleGroups] }));
}

export function normalizeWorkoutSchedule(rows: Array<{ weekday: number; muscle_groups?: string[] | null; muscleGroups?: string[] }>): WorkoutScheduleDay[] {
  const byWeekday = new Map(rows.map((row) => [row.weekday, row.muscleGroups ?? row.muscle_groups ?? []]));
  return WORKOUT_WEEKDAYS.map(({ weekday }) => ({ weekday, muscleGroups: [...(byWeekday.get(weekday) ?? [])] }));
}

export function getMondayFirstDayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

export function getMondayFirstWeekDates(date: Date): Date[] {
  const monday = new Date(date);
  monday.setHours(12, 0, 0, 0);
  monday.setDate(monday.getDate() - getMondayFirstDayIndex(monday));

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
}

export function isValidWorkoutSchedule(value: unknown): value is WorkoutScheduleDay[] {
  if (!Array.isArray(value) || value.length !== WORKOUT_WEEKDAYS.length) return false;
  const seenDays = new Set<number>();

  for (const row of value) {
    if (!row || typeof row !== "object") return false;
    const candidate = row as { weekday?: unknown; muscleGroups?: unknown };
    if (!Number.isInteger(candidate.weekday) || Number(candidate.weekday) < 1 || Number(candidate.weekday) > 7) return false;
    if (seenDays.has(Number(candidate.weekday))) return false;
    if (!Array.isArray(candidate.muscleGroups) || candidate.muscleGroups.length > WORKOUT_SCHEDULE_GROUPS.length) return false;
    const groups = candidate.muscleGroups;
    if (groups.some((group) => typeof group !== "string" || !WORKOUT_SCHEDULE_GROUPS.includes(group as WorkoutScheduleGroup))) return false;
    if (new Set(groups).size !== groups.length) return false;
    seenDays.add(Number(candidate.weekday));
  }

  return seenDays.size === WORKOUT_WEEKDAYS.length;
}
