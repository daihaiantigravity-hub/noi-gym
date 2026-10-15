"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

type FavoriteStatus = "idle" | "loading" | "ready" | "error";
type FavoriteSnapshot = {
  status: FavoriteStatus;
  exerciseIds: ReadonlySet<string>;
  error: string | null;
};

const serverSnapshot: FavoriteSnapshot = { status: "idle", exerciseIds: new Set(), error: null };
let snapshot: FavoriteSnapshot = serverSnapshot;
let loadPromise: Promise<FavoriteSnapshot> | null = null;
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

async function getResponseError(response: Response) {
  if (response.status === 401) return "Hãy đăng nhập tài khoản quản trị để lưu bài tập yêu thích.";
  try {
    const body = await response.json() as { error?: unknown };
    if (typeof body.error === "string" && body.error) return body.error;
  } catch {
    // Use the status-specific fallback below when the response is not JSON.
  }
  return "Không thể tải danh sách bài tập yêu thích.";
}

async function loadFavorites(force = false) {
  if (!force && snapshot.status === "ready") return snapshot;
  if (loadPromise) return loadPromise;

  emit({ ...snapshot, status: "loading", error: null });
  loadPromise = (async () => {
    try {
      const response = await fetch("/api/admin/favorite-exercises", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error(await getResponseError(response));
      const body = await response.json() as { exerciseIds?: unknown };
      const exerciseIds = Array.isArray(body.exerciseIds)
        ? body.exerciseIds.filter((id): id is string => typeof id === "string" && id.length > 0)
        : [];
      emit({ status: "ready", exerciseIds: new Set(exerciseIds), error: null });
    } catch (error) {
      emit({
        status: "error",
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

function setSaved(exerciseIds: Iterable<string>, saved: boolean) {
  const nextIds = new Set(snapshot.exerciseIds);
  for (const id of exerciseIds) {
    if (saved) nextIds.add(id);
    else nextIds.delete(id);
  }
  emit({ status: "ready", exerciseIds: nextIds, error: null });
}

export function useSavedExercise(exerciseId: string) {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const isSaved = favorites.exerciseIds.has(exerciseId);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadFavorites(), 250);
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

    const nextSaved = !current.exerciseIds.has(exerciseId);
    setSaved([exerciseId], nextSaved);

    try {
      const response = await fetch("/api/admin/favorite-exercises", {
        method: nextSaved ? "PUT" : "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId }),
      });
      if (!response.ok) throw new Error(await getResponseError(response));

      const body = await response.json() as { exerciseIds?: unknown };
      const resolvedIds = Array.isArray(body.exerciseIds)
        ? body.exerciseIds.filter((id): id is string => typeof id === "string" && id.length > 0)
        : [exerciseId];
      setSaved(resolvedIds, nextSaved);
    } catch (requestError) {
      setSaved([exerciseId], !nextSaved);
      setError(requestError instanceof Error ? requestError.message : "Không thể cập nhật bài tập yêu thích.");
    } finally {
      setIsPending(false);
    }
  }, [exerciseId, isPending]);

  return {
    isSaved,
    isLoading: favorites.status === "idle" || favorites.status === "loading",
    isPending,
    toggleSaved,
    error,
  };
}
