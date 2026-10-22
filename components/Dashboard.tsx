"use client";

import { useState } from "react";
import ExerciseFilters from "./ExerciseFilters";
import MuscleMap from "./MuscleMap";

export default function Dashboard() {
  const [isMale, setIsMale] = useState(true);

  return (
    <main className="dashboard-layout" aria-label="Bảng điều khiển Noi Gym">
      <section className="dashboard-workspace" aria-label="Bản đồ cơ thể và bộ lọc bài tập">
        <MuscleMap isMale={isMale} />
        <ExerciseFilters isMale={isMale} onGenderChange={setIsMale} />
      </section>
    </main>
  );
}
