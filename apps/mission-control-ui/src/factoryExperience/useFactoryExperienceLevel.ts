import { useEffect, useState } from "react";
import type { FactoryExperienceLevel } from "./recipeCatalog";

export const FACTORY_EXPERIENCE_STORAGE_KEY = "mc.factory.experience-level";
const FACTORY_EXPERIENCE_EVENT = "mc:factory-experience-level";
const LEVELS = new Set<FactoryExperienceLevel>([
  "basic",
  "intermediate",
  "advanced",
]);

export function parseFactoryExperienceLevel(
  value: string | null | undefined,
): FactoryExperienceLevel {
  return LEVELS.has(value as FactoryExperienceLevel)
    ? (value as FactoryExperienceLevel)
    : "basic";
}

function readStoredLevel(): FactoryExperienceLevel {
  try {
    return parseFactoryExperienceLevel(
      window.localStorage.getItem(FACTORY_EXPERIENCE_STORAGE_KEY),
    );
  } catch {
    return "basic";
  }
}

export function useFactoryExperienceLevel() {
  const [level, setLevelState] = useState<FactoryExperienceLevel>(() =>
    readStoredLevel(),
  );

  useEffect(() => {
    const syncStorage = (event: StorageEvent) => {
      if (event.key === FACTORY_EXPERIENCE_STORAGE_KEY)
        setLevelState(parseFactoryExperienceLevel(event.newValue));
    };
    const syncLocal = (event: Event) => {
      setLevelState(
        parseFactoryExperienceLevel((event as CustomEvent<string>).detail),
      );
    };
    window.addEventListener("storage", syncStorage);
    window.addEventListener(FACTORY_EXPERIENCE_EVENT, syncLocal);
    return () => {
      window.removeEventListener("storage", syncStorage);
      window.removeEventListener(FACTORY_EXPERIENCE_EVENT, syncLocal);
    };
  }, []);

  const setLevel = (next: FactoryExperienceLevel) => {
    setLevelState(next);
    try {
      window.localStorage.setItem(FACTORY_EXPERIENCE_STORAGE_KEY, next);
    } catch {
      // Presentation state remains usable in memory when storage is unavailable.
    }
    window.dispatchEvent(
      new CustomEvent(FACTORY_EXPERIENCE_EVENT, { detail: next }),
    );
  };

  return [level, setLevel] as const;
}
