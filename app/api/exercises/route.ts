import { NextResponse } from "next/server";
import { fetchMuscleWikiExercises } from "@/lib/musclewiki";

// Legacy upstream/source-data endpoint. Public localized pages use the exercise
// repository and its database translations; source API keys and filters remain canonical.

const muscleNameBySlug: Record<string, string> = {
  abdominals: "Abdominals",
  biceps: "Biceps",
  calves: "Calves",
  chest: "Chest",
  glutes: "Glutes",
  hamstrings: "Hamstrings",
  lats: "Lats",
  lowerback: "Lower back",
  obliques: "Obliques",
  quads: "Quads",
  shoulders: "Shoulders",
  traps: "Traps",
  triceps: "Triceps",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const muscleSlug = searchParams.get("muscle")?.toLowerCase();
  const gender = searchParams.get("gender");
  const category = searchParams.get("category") || undefined;
  const limit = Number(searchParams.get("limit") || 10);
  const offset = Number(searchParams.get("offset") || 0);

  if (gender && gender !== "male" && gender !== "female") {
    return NextResponse.json({ error: "Invalid gender filter" }, { status: 400 });
  }

  try {
    const data = await fetchMuscleWikiExercises({
      muscle: muscleSlug ? muscleNameBySlug[muscleSlug] ?? muscleSlug : undefined,
      gender: gender as "male" | "female" | undefined,
      category,
      limit,
      offset,
    });

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch exercises";
    const status = message.includes("not configured") ? 503 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
