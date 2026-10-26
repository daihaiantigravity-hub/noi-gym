import "server-only";

/** Opt-in diagnostics: fixed labels and durations only, never query data or identity. */
export async function measureExerciseRead<T>(
  phase: "translations.query" | "translations.read" | "list.read" | "ranking.query" | "content.query" | "auth.refresh",
  read: () => Promise<T>,
): Promise<T> {
  if (process.env.EXERCISE_PERFORMANCE_LOG !== "true") return read();
  const started = performance.now();
  try {
    return await read();
  } finally {
    console.info(JSON.stringify({ event: "exercise-read", phase, ms: Math.round(performance.now() - started) }));
  }
}
