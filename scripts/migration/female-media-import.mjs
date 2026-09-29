import { isDeepStrictEqual } from "node:util";

export const FEMALE_STORAGE_PREFIX = "exercises/musclewiki/female";
const supportedCategories = new Set(["Dumbbells", "Barbell", "Cables", "Machine", "Smith Machine", "Cardio", "Band", "Bodyweight", "Kettlebells", "Plate", "Medicine Ball", "TRX", "Stretches", "Pilates", "Yoga", "Bosu Ball"]);

function findMovieHeader(view, start = 0, end = view.byteLength) {
  let offset = start;
  while (offset + 8 <= end) {
    let size = view.getUint32(offset, false);
    let headerSize = 8;
    if (size === 1) {
      if (offset + 16 > end) return null;
      size = Number(view.getBigUint64(offset + 8, false));
      headerSize = 16;
    } else if (size === 0) size = end - offset;
    if (size < headerSize || offset + size > end) return null;
    const type = String.fromCharCode(...Array.from({ length: 4 }, (_, index) => view.getUint8(offset + 4 + index)));
    if (type === "mvhd") return { offset: offset + headerSize, size: size - headerSize };
    if (type === "moov") {
      const nested = findMovieHeader(view, offset + headerSize, offset + size);
      if (nested) return nested;
    }
    offset += size;
  }
  return null;
}

export function readMp4Duration(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const header = findMovieHeader(view);
  if (!header || header.size < 20) throw new Error("Could not read MP4 duration");
  const version = view.getUint8(header.offset);
  let timescale;
  let duration;
  if (version === 0) {
    timescale = view.getUint32(header.offset + 12, false);
    duration = view.getUint32(header.offset + 16, false);
  } else if (version === 1 && header.size >= 32) {
    timescale = view.getUint32(header.offset + 20, false);
    duration = Number(view.getBigUint64(header.offset + 24, false));
  } else throw new Error(`Unsupported MP4 mvhd version: ${version}`);
  if (!timescale) throw new Error("Invalid MP4 timescale");
  const seconds = duration / timescale;
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 60) throw new Error(`Invalid imported MP4 duration: ${seconds}s`);
  return seconds;
}

export function femaleStoragePath(sourceId, angle) {
  if (!Number.isSafeInteger(sourceId) || sourceId <= 0 || !["front", "side"].includes(angle)) {
    throw new Error(`Invalid female video identity: ${sourceId}/${angle}`);
  }
  return `${FEMALE_STORAGE_PREFIX}/${sourceId}-${angle}.mp4`;
}

export function validateFemaleVideo(video) {
  if (video?.gender !== "female") throw new Error("Expected female video");
  femaleStoragePath(1, video.angle);
  const url = new URL(video.url);
  if (url.protocol !== "https:" || url.hostname !== "musclewiki.com" || !url.pathname.startsWith("/api-next/videos/") || !url.pathname.endsWith(".mp4")) {
    throw new Error(`Unexpected female video source: ${video.url}`);
  }
  return url.href;
}

export function validateFemaleExercise(exercise) {
  if (!Number.isSafeInteger(exercise?.id) || exercise.id <= 0 || !exercise.name || !Array.isArray(exercise.videos)) {
    throw new Error(`Invalid female exercise: ${exercise?.id}`);
  }
  const angles = new Set();
  for (const video of exercise.videos) {
    validateFemaleVideo(video);
    if (angles.has(video.angle)) throw new Error(`Duplicate female angle: ${exercise.id}/${video.angle}`);
    angles.add(video.angle);
  }
  if (angles.size !== 2 || !angles.has("front") || !angles.has("side")) {
    throw new Error(`Incomplete female video pair: ${exercise.id}`);
  }
}

export function missingFemaleVideos(exercise, media) {
  const existing = Array.isArray(media) ? media : [];
  return exercise.videos.filter((video) => !existing.some((item) => item.gender === "female" && item.angle === video.angle && (item.videoUrl || item.storagePath === femaleStoragePath(exercise.id, video.angle))));
}

export function keepFemaleMediaAdminOnly(media) {
  return media.map((item) => item.gender === "female" && item.storagePath?.startsWith(`${FEMALE_STORAGE_PREFIX}/`)
    ? { ...item, videoUrl: "" }
    : item);
}

export function mergeFemaleMedia(existing, incoming) {
  const before = Array.isArray(existing) ? existing : [];
  const merged = [...before];
  for (const item of incoming) {
    if (item.gender !== "female" || !["front", "side"].includes(item.angle) || !item.videoUrl || !item.storagePath?.startsWith(`${FEMALE_STORAGE_PREFIX}/`)) {
      throw new Error("Invalid uploaded female media");
    }
    const index = merged.findIndex((candidate) => candidate.gender === "female" && candidate.angle === item.angle);
    if (index < 0) merged.push(item);
    else if (!merged[index].videoUrl) merged[index] = { ...merged[index], ...item };
  }
  const oldOtherMedia = before.filter((item) => item.gender !== "female");
  const newOtherMedia = merged.filter((item) => item.gender !== "female");
  if (!isDeepStrictEqual(oldOtherMedia, newOtherMedia)) throw new Error("Existing non-female media changed");
  return merged;
}

export function slugifyExercise(name) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function chooseDraftSlug(exercise, reserved) {
  const base = slugifyExercise(exercise.name).slice(0, 160).replace(/-+$/g, "") || `exercise-${exercise.id}`;
  let candidate = base;
  if (reserved.has(candidate)) candidate = `${base}-musclewiki-${exercise.id}`.slice(0, 180);
  if (reserved.has(candidate)) throw new Error(`Could not reserve slug for ${exercise.id}`);
  reserved.add(candidate);
  return candidate;
}

export function newFemaleDraft(exercise, slug, media) {
  return {
    source: "musclewiki",
    source_id: exercise.id,
    name: exercise.name,
    slug,
    description: "",
    primary_muscles: exercise.primary_muscles || [],
    category: supportedCategories.has(exercise.category) ? exercise.category : "",
    force: ["Push", "Pull", "Hold"].includes(exercise.force) ? exercise.force : null,
    grips: ["Mixed", "Neutral", "None", "Overhand", "Underhand"].includes(exercise.grips) ? exercise.grips : null,
    mechanic: ["Compound", "Isolation"].includes(exercise.mechanic) ? exercise.mechanic : null,
    difficulty: ["Beginner", "Novice", "Intermediate", "Advanced"].includes(exercise.difficulty) ? exercise.difficulty : "",
    status: "Draft",
    steps: Array.isArray(exercise.steps) ? exercise.steps.filter(Boolean) : [],
    media,
    source_snapshot: exercise,
  };
}
