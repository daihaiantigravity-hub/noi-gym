"use client";

import { useState } from "react";
import ExerciseFilters from "./ExerciseFilters";
import MuscleMap from "./MuscleMap";

export default function Dashboard() {
  const [isMale, setIsMale] = useState(true);

  return (
    <main className="dashboard-layout" aria-label="Noi Gym dashboard">
      <section className="dashboard-workspace" aria-label="Muscle map and exercise filters">
        <MuscleMap isMale={isMale} />
        <ExerciseFilters isMale={isMale} onGenderChange={setIsMale} />
      </section>
    </main>
  );
}
