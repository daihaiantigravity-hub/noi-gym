export function buildFemaleMergePlan(exercises, databaseRows) {
  const rowsByKey = new Map();
  for (const row of databaseRows) {
    if (row.source !== "musclewiki" || row.source_id == null) continue;
    const key = `${row.source}:${row.source_id}`;
    if (rowsByKey.has(key)) throw new Error(`Duplicate database source key: ${key}`);
    rowsByKey.set(key, row);
  }

  const seenIds = new Set();
  const matched = [];
  const newExercises = [];
  for (const exercise of exercises) {
    if (seenIds.has(exercise.id)) throw new Error(`Duplicate female source ID: ${exercise.id}`);
    seenIds.add(exercise.id);
    if (!exercise.videos?.length || exercise.videos.some((video) => video.gender !== "female" || !["front", "side"].includes(video.angle))) {
      throw new Error(`Invalid female videos: ${exercise.name}`);
    }
    const row = rowsByKey.get(`musclewiki:${exercise.id}`);
    const angleCounts = exercise.videos.reduce((counts, video) => counts.set(video.angle, (counts.get(video.angle) || 0) + 1), new Map());
    const duplicateAngles = [...angleCounts].filter(([, count]) => count > 1).map(([angle]) => angle);
    if (row) {
      const existingMedia = Array.isArray(row.media) ? row.media : [];
      const maleBefore = existingMedia.filter((media) => media.gender === "male");
      const existingFemaleAngles = new Set(existingMedia.filter((media) => media.gender === "female").map((media) => media.angle));
      const femaleAnglesToAdd = duplicateAngles.length ? [] : [...angleCounts.keys()].filter((angle) => !existingFemaleAngles.has(angle));
      matched.push({
        sourceId: exercise.id,
        databaseId: row.id,
        name: exercise.name,
        statusBefore: row.status,
        statusAfter: row.status,
        maleMediaBefore: maleBefore.length,
        maleMediaAfter: maleBefore.length,
        primaryMuscleCount: exercise.primary_muscles?.length || 0,
        femaleAnglesToAdd,
        issues: duplicateAngles.length ? [`multiple-videos-per-angle:${duplicateAngles.join(",")}`] : [],
        action: duplicateAngles.length ? "review-video-variants" : femaleAnglesToAdd.length ? "merge-female-media" : "already-present",
      });
      continue;
    }
    const issues = [
      ...(!exercise.primary_muscles?.length ? ["missing-primary-muscle"] : []),
      ...(!exercise.category ? ["missing-supported-category"] : []),
      ...(duplicateAngles.length ? [`multiple-videos-per-angle:${duplicateAngles.join(",")}`] : []),
    ];
    newExercises.push({
      sourceId: exercise.id,
      name: exercise.name,
      sourceUrl: exercise.source_url,
      jointTargets: exercise.joint_targets || [],
      listedIn: exercise.listed_in || [],
      issues,
      action: issues.length ? "review-before-create" : "eligible-as-draft",
    });
  }

  return {
    mode: "read-only-plan",
    summary: {
      femaleExercises: exercises.length,
      matchedExisting: matched.length,
      existingPublished: matched.filter((item) => item.statusBefore === "Published").length,
      existingReadyToMerge: matched.filter((item) => item.action === "merge-female-media").length,
      existingNeedingReview: matched.filter((item) => item.action === "review-video-variants").length,
      existingWithoutPrimaryMuscle: matched.filter((item) => item.primaryMuscleCount === 0).length,
      existingMaleMediaPreserved: matched.every((item) => item.maleMediaBefore === item.maleMediaAfter && item.statusBefore === item.statusAfter),
      femaleAnglesToAdd: matched.reduce((sum, item) => sum + item.femaleAnglesToAdd.length, 0),
      newExercises: newExercises.length,
      newEligibleAsDraft: newExercises.filter((item) => item.action === "eligible-as-draft").length,
      newNeedingReview: newExercises.filter((item) => item.action === "review-before-create").length,
      newWithOneMuscleListing: newExercises.filter((item) => item.listedIn.length === 1).length,
      newWithMultipleMuscleListings: newExercises.filter((item) => item.listedIn.length > 1).length,
      newWithNoMuscleListing: newExercises.filter((item) => item.listedIn.length === 0).length,
      databaseWrites: 0,
      storageUploads: 0,
    },
    matched,
    newExercises,
  };
}
