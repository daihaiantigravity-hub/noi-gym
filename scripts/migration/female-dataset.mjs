import crypto from "node:crypto";

export function canonicalExerciseUrl(value) {
  const url = new URL(value);
  if (url.origin !== "https://musclewiki.com" || !/^\/exercise\/[a-z0-9-]+\/?$/i.test(url.pathname)) {
    throw new Error(`Unexpected exercise URL: ${value}`);
  }
  return `${url.origin}${url.pathname.replace(/\/$/, "")}`;
}

export function sourceIdForUrl(value) {
  return Number.parseInt(crypto.createHash("sha256").update(canonicalExerciseUrl(value)).digest("hex").slice(0, 12), 16) + 1;
}

export function classifyVideo(value) {
  const url = new URL(value);
  if (url.origin !== "https://musclewiki.com" || !url.pathname.startsWith("/api-next/videos/")) return null;
  const filename = decodeURIComponent(url.pathname.split("/").at(-1));
  const gender = filename.match(/^(female|male)[-_]/i)?.[1]?.toLowerCase();
  const angle = filename.match(/[-_](front|side)(?:_[a-z0-9]+)?\.[a-z0-9]+$/i)?.[1]?.toLowerCase();
  return gender && angle ? { gender, angle, url: url.href } : null;
}

const femaleMediaCategories = [
  ["medicine-ball", "Medicine Ball"],
  ["medicineball", "Medicine Ball"],
  ["bodyweight", "Bodyweight"],
  ["kettlebells", "Kettlebells"],
  ["dumbbells", "Dumbbells"],
  ["dumbbell", "Dumbbells"],
  ["barbell", "Barbell"],
  ["cables", "Cables"],
  ["machine", "Machine"],
  ["band", "Band"],
];

export function categoryFromFemaleMedia(videos) {
  const categories = videos.map((video) => {
    const filename = decodeURIComponent(new URL(video.url).pathname.split("/").at(-1)).toLowerCase();
    return femaleMediaCategories.find(([prefix]) => filename.startsWith(`female-${prefix}-`))?.[1] ?? "";
  });
  return categories.length && categories.every((category) => category && category === categories[0]) ? categories[0] : "";
}

const scopeEquipmentCategories = {
  barbell: "Barbell", dumbbells: "Dumbbells", bodyweight: "Bodyweight", machine: "Machine",
  "medicine-ball": "Medicine Ball", kettlebells: "Kettlebells", stretches: "Stretches",
  cables: "Cables", band: "Band", plate: "Plate", trx: "TRX", yoga: "Yoga",
  "bosu-ball": "Bosu Ball", cardio: "Cardio", "smith-machine": "Smith Machine",
  pilates: "Pilates",
};

export function equipmentFromScopes(scopes = []) {
  const slugs = [...new Set(scopes.filter((scope) => scope.startsWith("equipment:")).map((scope) => scope.split(":")[2]))];
  if (slugs.length !== 1) return { category: "", sourceEquipment: slugs };
  const slug = slugs[0];
  return { category: scopeEquipmentCategories[slug] || "", sourceEquipment: [slug] };
}

export function mergeFemaleCaptureRecords(baseRecords, scopedRecords) {
  const byUrl = new Map();
  for (const record of [...baseRecords, ...scopedRecords]) {
    const url = canonicalExerciseUrl(record.sourceUrl);
    const prior = byUrl.get(url);
    if (!prior) {
      byUrl.set(url, { ...record, media: [...(record.media || [])], listedIn: [...(record.listedIn || [])], listedInScopes: [...(record.listedInScopes || [])] });
      continue;
    }
    const media = new Map([...prior.media, ...(record.media || [])].map((item) => [item.url, item]));
    byUrl.set(url, {
      ...prior,
      name: prior.name || record.name,
      difficulty: prior.difficulty || record.difficulty,
      instructions: prior.instructions?.length ? prior.instructions : record.instructions,
      media: [...media.values()],
      listedIn: [...new Set([...prior.listedIn, ...(record.listedIn || [])])],
      listedInScopes: [...new Set([...prior.listedInScopes, ...(record.listedInScopes || [])])],
    });
  }
  return [...byUrl.values()];
}

export function resolveFemaleMedia(record, resolution) {
  if (!resolution) return record;
  const selected = new Set(resolution.selectedUrls);
  if (selected.size !== 2) throw new Error(`Expected two selected videos: ${record.name}`);
  const observed = (record.media || []).filter((item) => item.type === "video");
  const selectedVideos = observed.filter((item) => selected.has(item.url)).map((item) => classifyVideo(item.url));
  if (selectedVideos.length !== 2 || new Set(selectedVideos.map((item) => item?.angle)).size !== 2 || selectedVideos.some((item) => item?.gender !== "female")) {
    throw new Error(`Video resolution does not match observed female front/side media: ${record.name}`);
  }
  return {
    ...record,
    media: (record.media || []).filter((item) => item.type !== "video" || selected.has(item.url)),
    videoResolution: { reason: resolution.reason, excludedUrls: observed.filter((item) => !selected.has(item.url)).map((item) => item.url) },
  };
}

export function prepareFemaleRecord(record, existing = {}, detail = {}) {
  const sourceUrl = canonicalExerciseUrl(record.sourceUrl);
  const id = existing.id ?? sourceIdForUrl(sourceUrl);
  const videos = [...new Map((record.media || [])
    .filter((item) => item.type === "video")
    .map((item) => classifyVideo(item.url))
    .filter((item) => item?.gender === "female")
    .map((item) => [item.url, item])).values()];
  const inferredCategory = categoryFromFemaleMedia(videos);
  const scopedEquipment = equipmentFromScopes(record.listedInScopes);
  const scopeCategory = scopedEquipment.category;
  const category = existing.category || detail.category || scopeCategory || inferredCategory;
  return {
    id,
    name: record.name,
    primary_muscles: existing.primary_muscles?.length ? existing.primary_muscles : (detail.primary_muscles || []),
    category,
    category_source: existing.category ? "existing-project-dataset" : detail.category ? "source-detail-page" : scopeCategory ? "source-equipment-listing" : inferredCategory ? "female-media-filename" : "unresolved",
    primary_muscles_source: existing.primary_muscles?.length ? "existing-project-dataset" : detail.primary_muscles?.length ? "source-detail-page" : "unresolved",
    force: existing.force || detail.force || "",
    grips: existing.grips || detail.grips || "",
    mechanic: existing.mechanic || detail.mechanic || "",
    difficulty: record.difficulty || existing.difficulty || detail.difficulty || "",
    steps: record.instructions || [],
    videos,
    source_url: sourceUrl,
    female_source_url: record.sourceUrl,
    listed_in: [...new Set(record.listedIn || [])],
    listed_in_scopes: [...new Set(record.listedInScopes || [])],
    joint_targets: [...new Set((record.listedInScopes || []).filter((scope) => scope.startsWith("joint:")).map((scope) => scope.split(":")[1]))],
    source_equipment: scopedEquipment.sourceEquipment,
    video_resolution: record.videoResolution || null,
    metadata_source: existing.category && existing.primary_muscles?.length ? "existing-project-dataset" : detail.sourceUrl ? "source-detail-page" : "partial-or-unresolved",
  };
}
