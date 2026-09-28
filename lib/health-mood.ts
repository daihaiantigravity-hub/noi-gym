export const HEALTH_MOODS = ["dawn", "morning", "midday", "afternoon", "evening", "night"] as const;

export type HealthMood = (typeof HEALTH_MOODS)[number];

export const DEFAULT_HEALTH_MOOD: HealthMood = "morning";

const MOOD_START_HOURS: ReadonlyArray<{ mood: HealthMood; startHour: number }> = [
  { mood: "dawn", startHour: 5 },
  { mood: "morning", startHour: 8 },
  { mood: "midday", startHour: 12 },
  { mood: "afternoon", startHour: 14 },
  { mood: "evening", startHour: 18 },
  { mood: "night", startHour: 22 },
];

export function getHealthMood(date: Date): HealthMood {
  const currentHour = date.getHours() + date.getMinutes() / 60;

  for (let index = MOOD_START_HOURS.length - 1; index >= 0; index -= 1) {
    const moodWindow = MOOD_START_HOURS[index];
    if (moodWindow && currentHour >= moodWindow.startHour) {
      return moodWindow.mood;
    }
  }

  return "night";
}

export function getMillisecondsUntilNextHealthMood(date: Date): number {
  const nextBoundary = new Date(date);
  const nextMoodWindow = MOOD_START_HOURS.find(({ startHour }) => date.getHours() < startHour);

  if (nextMoodWindow) {
    nextBoundary.setHours(nextMoodWindow.startHour, 0, 0, 0);
  } else {
    nextBoundary.setDate(nextBoundary.getDate() + 1);
    nextBoundary.setHours(MOOD_START_HOURS[0].startHour, 0, 0, 0);
  }

  return Math.max(1000, nextBoundary.getTime() - date.getTime());
}
