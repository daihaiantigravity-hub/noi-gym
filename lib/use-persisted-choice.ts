"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

export function usePersistedChoice<T extends string>(storageKey: string, defaultChoice: T, choices: readonly T[]): [T, Dispatch<SetStateAction<T>>] {
  const [choice, setChoiceState] = useState(defaultChoice);
  const choiceRef = useRef(choice);
  const hasUserSelectedRef = useRef(false);

  useEffect(() => {
    let active = true;
    try {
      const storedChoice = window.localStorage.getItem(storageKey);
      if (storedChoice && choices.includes(storedChoice as T)) {
        queueMicrotask(() => {
          if (!active || hasUserSelectedRef.current) return;
          choiceRef.current = storedChoice as T;
          setChoiceState(storedChoice as T);
        });
      }
    } catch {
      // Browser storage can be unavailable; the page still works with its default choice.
    }
    return () => { active = false; };
  }, [choices, storageKey]);

  const setChoice = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    const resolvedChoice = typeof next === "function" ? (next as (previous: T) => T)(choiceRef.current) : next;
    hasUserSelectedRef.current = true;
    choiceRef.current = resolvedChoice;
    setChoiceState(resolvedChoice);
    try {
      window.localStorage.setItem(storageKey, resolvedChoice);
    } catch {
      // Keep the in-memory selection when storage is unavailable.
    }
  }, [storageKey]);

  return [choice, setChoice];
}
