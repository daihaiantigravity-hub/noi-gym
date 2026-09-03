import ExerciseLibrary from "@/components/ExerciseLibrary";

export default async function ExercisesPage({
  params,
}: {
  params: Promise<{ muscle: string }>;
}) {
  const { muscle } = await params;

  return <ExerciseLibrary muscle={muscle} />;
}
