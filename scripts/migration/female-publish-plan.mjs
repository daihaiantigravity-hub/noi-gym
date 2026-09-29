// MuscleWiki listing membership is used for browse groups; it is not an
// independently verified anatomical claim about a single primary muscle.
const standardMuscles = {
  abdominals: "Abdominals", biceps: "Biceps", calves: "Calves", chest: "Chest",
  forearms: "Forearms", "front-shoulders": "Front Shoulders", glutes: "Glutes",
  hamstrings: "Hamstrings", lats: "Lats", lowerback: "Lower back",
  obliques: "Obliques", quads: "Quads", "rear-shoulders": "Rear Shoulders",
  shoulders: "Shoulders", traps: "Traps", triceps: "Triceps",
};

const advancedTargets = {
  neck: "Neck", feet: "Feet", groin: "Groin", "upper-trapezius": "Upper Traps",
  gastrocnemius: "Gastrocnemius", tibialis: "Tibialis", soleus: "Soleus",
  "outer-quadricep": "Outer Quadriceps", "rectus-femoris": "Rectus Femoris",
  "inner-quadricep": "Inner Quadriceps", "inner-thigh": "Inner Thigh",
  "wrist-extensors": "Wrist Extensors", "wrist-flexors": "Wrist Flexors",
  "long-head-bicep": "Long Head Bicep", "short-head-bicep": "Short Head Bicep",
  obliques: "Obliques", "lower-abdominals": "Lower Abdominals",
  "upper-abdominals": "Upper Abdominals", "mid-lower-pectoralis": "Mid and Lower Chest",
  "upper-pectoralis": "Upper Pectoralis", "anterior-deltoid": "Anterior Deltoid",
  "lateral-deltoid": "Lateral Deltoid", hands: "Hands",
};

const jointTargets = {
  shoulders: "Shoulders", elbow: "Elbow", wrist: "Wrist",
  hips: "Hips", knees: "Knees", ankles: "Ankles",
};

const advancedOnlyMuscles = {
  "traps-middle": ["Traps (mid-back)", "Traps"], "gluteus-medius": ["Gluteus Medius", "Glutes"],
  "inner-thigh": "Inner Thigh", "lower-trapezius": ["Lower Trapezius", "Traps"],
  "wrist-extensors": "Wrist Extensors",
};

const categories = new Set([
  "Dumbbells", "Barbell", "Cables", "Machine", "Smith Machine", "Cardio",
  "Band", "Bodyweight", "Kettlebells", "Plate", "Medicine Ball", "TRX",
  "Stretches", "Pilates", "Yoga", "Bosu Ball", "Recovery", "Vitruvian",
]);

export function buildFemalePublishPlan(exercise) {
  if (!Number.isSafeInteger(exercise?.id) || !Array.isArray(exercise?.videos)) throw new Error("Invalid female source exercise");
  const listedIn = [...new Set(exercise.listed_in ?? [])];
  const joints = [...new Set(exercise.joint_targets ?? [])];
  const standard = [...new Set(listedIn.map((slug) => standardMuscles[slug]).filter(Boolean))];
  const primaryMuscles = standard.length > 0
    ? standard
    : [...new Set(listedIn.flatMap((slug) => advancedOnlyMuscles[slug] ?? []))];
  if (primaryMuscles.length === 0 && joints.length === 0) throw new Error(`No browse target for ${exercise.id}`);

  const videoTypes = [...new Set(exercise.videos.map((video) => {
    const match = new URL(video.url).pathname.match(/\/female-(Recovery|Vitruvian)-/i);
    return match ? match[1].toLowerCase() : null;
  }).filter(Boolean))];
  const inferredCategory = videoTypes.length === 1
    ? videoTypes[0] === "recovery" ? "Recovery" : "Vitruvian"
    : "";
  const category = exercise.category || inferredCategory;
  if (!categories.has(category)) throw new Error(`No supported category for ${exercise.id}: ${category}`);
  if (!new Set(["Beginner", "Novice", "Intermediate", "Advanced"]).has(exercise.difficulty)) {
    throw new Error(`Invalid difficulty for ${exercise.id}`);
  }
  if (!Array.isArray(exercise.steps) || !exercise.steps.some((step) => typeof step === "string" && step.trim())) {
    throw new Error(`Missing steps for ${exercise.id}`);
  }

  const targets = [
    ...listedIn.filter((slug) => advancedTargets[slug]).map((slug) => ({
      mode: "advanced", slug, label: advancedTargets[slug],
      source_url: `https://musclewiki.com/exercises/${slug}`,
    })),
    ...joints.filter((slug) => jointTargets[slug]).map((slug) => ({
      mode: "joint", slug, label: jointTargets[slug],
      source_url: `https://musclewiki.com/exercises/${slug}/recovery`,
    })),
  ];
  if (joints.some((slug) => !jointTargets[slug])) throw new Error(`Unknown joint target for ${exercise.id}`);

  return {
    sourceId: exercise.id,
    name: exercise.name,
    primaryMuscles,
    muscleSource: standard.length > 0 ? "source-standard-listings" : primaryMuscles.length > 0 ? "source-advanced-listing" : "joint-only",
    category,
    categorySource: exercise.category ? exercise.category_source : "female-video-filename",
    difficulty: exercise.difficulty,
    stepsCount: exercise.steps.length,
    targets,
  };
}
