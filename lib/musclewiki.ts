const DEFAULT_BASE_URL = "https://api.musclewiki.com";

export type MuscleWikiVideo = {
  url?: string;
  angle?: string;
  gender?: string;
  og_image?: string;
};

export type MuscleWikiExercise = {
  id: number;
  name: string;
  primary_muscles?: string[];
  category?: string;
  difficulty?: string;
  steps?: string[];
  videos?: MuscleWikiVideo[];
};

export type MuscleWikiExerciseResponse = {
  total: number;
  limit: number;
  offset: number;
  count: number;
  results: MuscleWikiExercise[];
};

export function getMuscleWikiConfig() {
  return {
    apiKey: process.env.MUSCLEWIKI_API_KEY?.trim(),
    baseUrl: (process.env.MUSCLEWIKI_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, ""),
  };
}

export function getMuscleWikiUrl(params: {
  muscle?: string;
  gender?: "male" | "female";
  category?: string;
  limit?: number;
  offset?: number;
}) {
  const { baseUrl } = getMuscleWikiConfig();
  const searchParams = new URLSearchParams();

  searchParams.set("limit", String(Math.min(Math.max(params.limit ?? 10, 1), 100)));
  searchParams.set("offset", String(Math.max(params.offset ?? 0, 0)));

  if (params.muscle) searchParams.set("muscles", params.muscle);
  if (params.gender) searchParams.set("gender", params.gender);
  if (params.category) searchParams.set("category", params.category);

  return `${baseUrl}/exercises?${searchParams.toString()}`;
}

export async function fetchMuscleWikiExercises(params: Parameters<typeof getMuscleWikiUrl>[0]) {
  const { apiKey } = getMuscleWikiConfig();

  if (!apiKey) {
    throw new Error("MUSCLEWIKI_API_KEY is not configured");
  }

  const response = await fetch(getMuscleWikiUrl(params), {
    headers: {
      Accept: "application/json",
      "X-API-Key": apiKey,
    },
    next: { revalidate: 300 },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = typeof payload?.detail === "string" ? payload.detail : `MuscleWiki API returned ${response.status}`;
    throw new Error(message);
  }

  return payload as MuscleWikiExerciseResponse;
}
