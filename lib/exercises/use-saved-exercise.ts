"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

type FavoriteStatus = "idle" | "loading" | "ready" | "error";
type FavoriteSnapshot = {
  status: FavoriteStatus;
  authenticated: boolean | null;
  userId: string | null;
  exerciseIds: ReadonlySet<string>;
  error: string | null;
};

type PendingFavorite = {
  exerciseId: string;
  next: string;
  createdAt: number;
};

const pendingFavoriteKey = "noi-gym:pending-favorite:v1";
const pendingFavoriteMaxAge = 15 * 60 * 1000;
const serverSnapshot: FavoriteSnapshot = {
  status: "idle",
  authenticated: null,
  userId: null,
  exerciseIds: new Set(),
  error: null,
};
let snapshot: FavoriteSnapshot = serverSnapshot;
let loadPromise: Promise<FavoriteSnapshot> | null = null;
let pendingCompletionPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: FavoriteSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return serverSnapshot;
}

function parseExerciseIds(value: unknown) {
  return Array.isArray(value)
    ? value.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];
}

async function getResponseError(response: Response) {
  if (response.status === 401) return "Hãy đăng nhập bằng Google để lưu bài tập yêu thích.";
  try {
    const body = await response.json() as { error?: unknown };
    if (typeof body.error === "string" && body.error) return body.error;
  } catch {
    // Use the fallback when the response is not JSON.
  }
  return "Không thể cập nhật danh sách bài tập yêu thích.";
}

function setSaved(exerciseIds: Iterable<string>, saved: boolean) {
  const nextIds = new Set(snapshot.exerciseIds);
  for (const id of exerciseIds) {
    if (saved) nextIds.add(id);
    else nextIds.delete(id);
  }
  emit({ ...snapshot, status: "ready", exerciseIds: nextIds, error: null });
}

function readPendingFavorite() {
  try {
    const raw = window.sessionStorage.getItem(pendingFavoriteKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingFavorite>;
    if (
      typeof parsed.exerciseId !== "string"
      || typeof parsed.next !== "string"
      || typeof parsed.createdAt !== "number"
      || Date.now() - parsed.createdAt > pendingFavoriteMaxAge
    ) {
      window.sessionStorage.removeItem(pendingFavoriteKey);
      return null;
    }
    return parsed as PendingFavorite;
  } catch {
    window.sessionStorage.removeItem(pendingFavoriteKey);
    return null;
  }
}

function savePendingFavorite(exerciseId: string) {
  const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.sessionStorage.setItem(pendingFavoriteKey, JSON.stringify({ exerciseId, next, createdAt: Date.now() } satisfies PendingFavorite));
  return next;
}

async function completePendingFavorite() {
  if (pendingCompletionPromise || !snapshot.authenticated) return pendingCompletionPromise;
  const pending = readPendingFavorite();
  if (!pending) return null;

  pendingCompletionPromise = (async () => {
    try {
      const response = await fetch("/api/favorite-exercises", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: pending.exerciseId }),
      });
      if (!response.ok) throw new Error(await getResponseError(response));
      const body = await response.json() as { exerciseIds?: unknown };
      const resolvedIds = parseExerciseIds(body.exerciseIds);
      setSaved(resolvedIds.length > 0 ? resolvedIds : [pending.exerciseId], true);
      window.sessionStorage.removeItem(pendingFavoriteKey);
    } catch (error) {
      emit({
        ...snapshot,
        status: "ready",
        error: error instanceof Error ? error.message : "Không thể hoàn tất thao tác lưu bài tập.",
      });
    } finally {
      pendingCompletionPromise = null;
    }
  })();

  return pendingCompletionPromise;
}

async function loadFavorites(force = false) {
  if (!force && snapshot.status === "ready") return snapshot;
  if (loadPromise) return loadPromise;

  emit({ ...snapshot, status: "loading", error: null });
  loadPromise = (async () => {
    try {
      const response = await fetch("/api/favorite-exercises", { cache: "no-store", credentials: "same-origin" });
      if (response.status === 401) {
        emit({ status: "ready", authenticated: false, userId: null, exerciseIds: new Set(), error: null });
        return snapshot;
      }
      if (!response.ok) throw new Error(await getResponseError(response));

      const body = await response.json() as { authenticated?: unknown; userId?: unknown; exerciseIds?: unknown };
      emit({
        status: "ready",
        authenticated: body.authenticated === true,
        userId: typeof body.userId === "string" ? body.userId : null,
        exerciseIds: new Set(parseExerciseIds(body.exerciseIds)),
        error: null,
      });
      await completePendingFavorite();
    } catch (error) {
      emit({
        status: "error",
        authenticated: null,
        userId: null,
        exerciseIds: new Set(),
        error: error instanceof Error ? error.message : "Không thể tải danh sách bài tập yêu thích.",
      });
    } finally {
      loadPromise = null;
    }
    return snapshot;
  })();

  return loadPromise;
}

export function resetSavedExercises() {
  loadPromise = null;
  pendingCompletionPromise = null;
  emit(serverSnapshot);
}

export function useSavedExercise(exerciseId: string) {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const isSaved = favorites.exerciseIds.has(exerciseId);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadFavorites(), 100);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const toggleSaved = useCallback(async () => {
    if (isPending) return;
    setError(null);
    setIsPending(true);

    let current = snapshot;
    if (current.status !== "ready") current = await loadFavorites(current.status === "error");
    if (current.status !== "ready") {
      setError(current.error ?? "Không thể tải danh sách bài tập yêu thích.");
      setIsPending(false);
      return;
    }

    if (!current.authenticated) {
      const next = savePendingFavorite(exerciseId);
      // Preserve sessionStorage and perform a full OAuth document navigation.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/auth/google?next=${encodeURIComponent(next)}`;
      return;
    }

    const nextSaved = !current.exerciseIds.has(exerciseId);
    setSaved([exerciseId], nextSaved);

    try {
      const response = await fetch("/api/favorite-exercises", {
        method: nextSaved ? "PUT" : "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId }),
      });
      if (!response.ok) throw new Error(await getResponseError(response));

      const body = await response.json() as { exerciseIds?: unknown };
      const resolvedIds = parseExerciseIds(body.exerciseIds);
      setSaved(resolvedIds.length > 0 ? resolvedIds : [exerciseId], nextSaved);
    } catch (requestError) {
      setSaved([exerciseId], !nextSaved);
      setError(requestError instanceof Error ? requestError.message : "Không thể cập nhật bài tập yêu thích.");
    } finally {
      setIsPending(false);
    }
  }, [exerciseId, isPending]);

  return {
    isSaved,
    isAuthenticated: favorites.authenticated === true,
    isLoading: favorites.status === "idle" || favorites.status === "loading",
    isPending,
    toggleSaved,
    error: error ?? favorites.error,
  };
}
