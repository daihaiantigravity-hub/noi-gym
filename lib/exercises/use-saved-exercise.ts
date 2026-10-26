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
type FavoriteLoadResult = { snapshot: FavoriteSnapshot; generation: number };

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
let loadPromise: Promise<FavoriteLoadResult | null> | null = null;
let pendingCompletionPromise: Promise<void> | null = null;
// Logout and expired sessions invalidate every response already in flight.
let sessionGeneration = 0;
const pendingMutations = new Map<string, object>();
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
  if (response.status === 401) return "Sign in with Google to save favorite exercises.";
  try {
    const body = await response.json() as { error?: unknown };
    if (typeof body.error === "string" && body.error) return body.error;
  } catch {
    // Use the fallback when the response is not JSON.
  }
  return "Unable to update your favorite exercises.";
}

function setSaved(exerciseIds: Iterable<string>, saved: boolean) {
  const nextIds = new Set(snapshot.exerciseIds);
  for (const id of exerciseIds) {
    if (saved) nextIds.add(id);
    else nextIds.delete(id);
  }
  emit({ ...snapshot, status: "ready", exerciseIds: nextIds, error: null });
}

function removePendingFavorite() {
  try {
    window.sessionStorage.removeItem(pendingFavoriteKey);
  } catch {
    // Storage can be disabled; signing in and saving must still work.
  }
}

function clearSavedExercises(authenticated: false | null) {
  sessionGeneration += 1;
  loadPromise = null;
  pendingCompletionPromise = null;
  pendingMutations.clear();
  removePendingFavorite();
  emit(authenticated === false
    ? { ...serverSnapshot, status: "ready", authenticated: false }
    : serverSnapshot);
}

function ownsSession(generation: number, userId: string | null) {
  return generation === sessionGeneration && snapshot.authenticated === true && snapshot.userId === userId;
}

function readPendingFavorite() {
  try {
    const raw = window.sessionStorage.getItem(pendingFavoriteKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingFavorite>;
    if (
      typeof parsed.exerciseId !== "string"
      || !parsed.exerciseId.trim()
      || typeof parsed.next !== "string"
      || !parsed.next.startsWith("/")
      || parsed.next.startsWith("//")
      || typeof parsed.createdAt !== "number"
      || !Number.isFinite(parsed.createdAt)
      || parsed.createdAt > Date.now()
      || Date.now() - parsed.createdAt > pendingFavoriteMaxAge
    ) {
      removePendingFavorite();
      return null;
    }
    return parsed as PendingFavorite;
  } catch {
    removePendingFavorite();
    return null;
  }
}

function savePendingFavorite(exerciseId: string) {
  const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  try {
    window.sessionStorage.setItem(pendingFavoriteKey, JSON.stringify({ exerciseId, next, createdAt: Date.now() } satisfies PendingFavorite));
  } catch {
    // OAuth can continue without automatically completing this save.
  }
  return next;
}

async function completePendingFavorite() {
  if (pendingCompletionPromise || !snapshot.authenticated) return pendingCompletionPromise;
  const pending = readPendingFavorite();
  if (!pending) return null;

  const generation = sessionGeneration;
  const userId = snapshot.userId;
  const requestPromise = (async () => {
    try {
      const response = await fetch("/api/favorite-exercises", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId: pending.exerciseId }),
      });
      if (!ownsSession(generation, userId)) return;
      if (response.status === 401) {
        clearSavedExercises(false);
        return;
      }
      if (!response.ok) throw new Error(await getResponseError(response));
      const body = await response.json() as { exerciseIds?: unknown };
      if (!ownsSession(generation, userId)) return;
      const resolvedIds = parseExerciseIds(body.exerciseIds);
      setSaved(resolvedIds.length > 0 ? resolvedIds : [pending.exerciseId], true);
      removePendingFavorite();
    } catch (error) {
      if (!ownsSession(generation, userId)) return;
      emit({
        ...snapshot,
        status: "ready",
        error: error instanceof Error ? error.message : "Unable to complete the save action.",
      });
    }
  })();

  pendingCompletionPromise = requestPromise;
  try {
    await requestPromise;
  } finally {
    if (generation === sessionGeneration && pendingCompletionPromise === requestPromise) pendingCompletionPromise = null;
  }
}

async function loadFavorites(force = false) {
  if (!force && snapshot.status === "ready") return { snapshot, generation: sessionGeneration };
  if (loadPromise) return loadPromise;

  const generation = sessionGeneration;
  emit({ ...snapshot, status: "loading", error: null });
  const requestPromise = (async () => {
    try {
      const response = await fetch("/api/favorite-exercises", { cache: "no-store", credentials: "same-origin" });
      if (generation !== sessionGeneration) return null;
      if (response.status === 401) {
        clearSavedExercises(false);
        return { snapshot, generation: sessionGeneration };
      }
      if (!response.ok) throw new Error(await getResponseError(response));

      const body = await response.json() as { authenticated?: unknown; userId?: unknown; exerciseIds?: unknown };
      if (generation !== sessionGeneration) return null;
      const authenticated = body.authenticated === true && typeof body.userId === "string" && body.userId.length > 0;
      emit({
        status: "ready",
        authenticated,
        userId: authenticated ? body.userId as string : null,
        exerciseIds: new Set(authenticated ? parseExerciseIds(body.exerciseIds) : []),
        error: null,
      });
      await completePendingFavorite();
    } catch (error) {
      if (generation !== sessionGeneration) return null;
      emit({
        status: "error",
        authenticated: null,
        userId: null,
        exerciseIds: new Set(),
        error: error instanceof Error ? error.message : "Unable to load your favorite exercises.",
      });
    }
    return generation === sessionGeneration ? { snapshot, generation } : null;
  })();

  loadPromise = requestPromise;
  try {
    return await requestPromise;
  } finally {
    if (generation === sessionGeneration && loadPromise === requestPromise) loadPromise = null;
  }
}

export function resetSavedExercises() {
  clearSavedExercises(null);
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
    if (isPending || pendingMutations.has(exerciseId)) return;
    const operation = {};
    pendingMutations.set(exerciseId, operation);
    setError(null);
    setIsPending(true);

    try {
      let current = snapshot;
      if (current.status !== "ready") {
        const loaded = await loadFavorites(current.status === "error");
        if (!loaded || loaded.generation !== sessionGeneration) return;
        // Another card may have applied its optimistic update while we waited.
        current = snapshot;
      }
      if (current.status !== "ready") {
        setError(current.error ?? "Unable to load your favorite exercises.");
        return;
      }

      if (!current.authenticated) {
        const next = savePendingFavorite(exerciseId);
        // Preserve sessionStorage and perform a full OAuth document navigation.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/auth/google?next=${encodeURIComponent(next)}`;
        return;
      }

      const generation = sessionGeneration;
      const userId = current.userId;
      const nextSaved = !current.exerciseIds.has(exerciseId);
      setSaved([exerciseId], nextSaved);

      try {
        const response = await fetch("/api/favorite-exercises", {
          method: nextSaved ? "PUT" : "DELETE",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exerciseId }),
        });
        if (!ownsSession(generation, userId)) return;
        if (response.status === 401) {
          const message = await getResponseError(response);
          if (!ownsSession(generation, userId)) return;
          clearSavedExercises(false);
          setError(message);
          return;
        }
        if (!response.ok) throw new Error(await getResponseError(response));

        const body = await response.json() as { exerciseIds?: unknown };
        if (!ownsSession(generation, userId)) return;
        const resolvedIds = parseExerciseIds(body.exerciseIds);
        const updatedIds = resolvedIds.length > 0 ? resolvedIds : [exerciseId];
        setSaved(updatedIds, nextSaved);
        // A successful manual retry supersedes a failed OAuth save intent.
        const pending = readPendingFavorite();
        if (pending && updatedIds.includes(pending.exerciseId)) removePendingFavorite();
      } catch (requestError) {
        if (!ownsSession(generation, userId)) return;
        setSaved([exerciseId], !nextSaved);
        setError(requestError instanceof Error ? requestError.message : "Unable to update the favorite exercise.");
      }
    } finally {
      if (pendingMutations.get(exerciseId) === operation) pendingMutations.delete(exerciseId);
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
