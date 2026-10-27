"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppLanguage } from "@/components/LanguageProvider";
import LanguageToggle from "@/components/LanguageToggle";
import { getExerciseLabel, getMuscleLabel } from "@/lib/i18n/labels";
import { getMessages, translate } from "@/lib/i18n/messages";
import { WORKOUT_SCHEDULE_GROUPS, WORKOUT_WEEKDAYS, type WorkoutScheduleDay, type WorkoutWeekday } from "@/lib/workout-schedule";

function BackIcon() {
  return <svg aria-hidden="true" fill="none" height="28" viewBox="0 0 24 24" width="28"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

export default function WorkoutScheduleEditor({ initialSchedule, initialLoadError = false }: { initialSchedule: WorkoutScheduleDay[]; initialLoadError?: boolean }) {
  const { enabled, language } = useAppLanguage();
  const messages = getMessages(language);
  const router = useRouter();
  const [schedule, setSchedule] = useState(initialSchedule);
  const [expandedWeekday, setExpandedWeekday] = useState<WorkoutWeekday | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadError] = useState(initialLoadError);
  const [saveError, setSaveError] = useState(false);

  function toggleGroup(weekday: WorkoutWeekday, group: string) {
    setSchedule((current) => current.map((day) => {
      if (day.weekday !== weekday) return day;
      const muscleGroups = day.muscleGroups.includes(group)
        ? day.muscleGroups.filter((item) => item !== group)
        : [...day.muscleGroups, group];
      return { ...day, muscleGroups };
    }));
    setSaveError(false);
  }

  async function saveSchedule() {
    if (saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      const response = await fetch("/api/user/workout-schedule", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule }),
      });
      if (!response.ok) throw new Error("Unable to save workout schedule");
      router.replace("/");
    } catch {
      setSaveError(true);
      setSaving(false);
    }
  }

  return (
    <main className="exercise-library-page workout-schedule-editor health-mood-surface">
      <header className={`exercise-library-header workout-schedule-editor__header${enabled ? " exercise-library-header--localized" : ""}`}>
        <Link aria-label={messages.scheduleBackHome} className="exercise-library-back-button" href="/">
          <BackIcon />
        </Link>
        <h1 className="exercise-library-results__title">{messages.scheduleEditorTitle}</h1>
        <LanguageToggle whenEnabledOnly />
      </header>
      <p className="workout-schedule-editor__intro">{messages.scheduleEditorHelp}</p>

      <section aria-label={messages.weeklySchedule} className="workout-schedule-editor__days">
        {WORKOUT_WEEKDAYS.map(({ weekday, label }) => {
          const day = schedule.find((item) => item.weekday === weekday);
          const muscleGroups = day?.muscleGroups ?? [];
          const isExpanded = expandedWeekday === weekday;
          const dayName = getExerciseLabel(language, label);
          const summary = muscleGroups.length
            ? muscleGroups.map((group) => getMuscleLabel(language, group)).join(" · ")
            : messages.scheduleRestDay;

          return (
            <article className={`workout-schedule-day${isExpanded ? " workout-schedule-day--expanded" : ""}`} key={weekday}>
              <button
                aria-controls={`workout-schedule-groups-${weekday}`}
                aria-expanded={isExpanded}
                className="workout-schedule-day__toggle"
                onClick={() => setExpandedWeekday((current) => current === weekday ? null : weekday)}
                type="button"
              >
                <span className="workout-schedule-day__heading">
                  <strong>{dayName}</strong>
                  <small>{translate(language, "scheduleGroupCount", { count: muscleGroups.length })}</small>
                </span>
                <span className={`workout-schedule-day__summary${muscleGroups.length ? "" : " workout-schedule-day__summary--rest"}`}>{summary}</span>
                <svg aria-hidden="true" className="workout-schedule-day__chevron" fill="none" height="20" viewBox="0 0 24 24" width="20"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
              </button>
              <fieldset aria-label={translate(language, "scheduleDayGroups", { day: dayName })} className="workout-schedule-day__groups" hidden={!isExpanded} id={`workout-schedule-groups-${weekday}`}>
                <legend>{messages.scheduleGroupsHeading}</legend>
                {WORKOUT_SCHEDULE_GROUPS.map((group) => {
                  const selected = muscleGroups.includes(group);
                  return (
                    <button
                      aria-pressed={selected}
                      className={`workout-schedule-group${selected ? " workout-schedule-group--selected" : ""}`}
                      disabled={loadError || saving}
                      key={group}
                      onClick={() => toggleGroup(weekday, group)}
                      type="button"
                    >
                      <span aria-hidden="true" className="workout-schedule-group__check">
                        <svg fill="none" height="12" viewBox="0 0 12 12" width="12"><path d="m2.5 6 2.3 2.3 4.7-4.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" /></svg>
                      </span>
                      {getMuscleLabel(language, group)}
                    </button>
                  );
                })}
                <p className="workout-schedule-day__rest-hint">{messages.scheduleRestHint}</p>
              </fieldset>
            </article>
          );
        })}
      </section>

      {loadError && <p className="workout-schedule-editor__error" role="alert">{messages.scheduleLoadFailed}</p>}
      {saveError && <p className="workout-schedule-editor__error" role="alert">{messages.scheduleSaveFailed}</p>}
      <footer aria-busy={saving} className="workout-schedule-editor__actions">
        <Link className="workout-schedule-editor__cancel" href="/">{messages.cancel}</Link>
        <button className="workout-schedule-editor__save" disabled={saving || loadError} onClick={saveSchedule} type="button">
          {!saving && <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18"><path d="m5 12 4 4L19 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>}
          {saving ? messages.scheduleSaving : messages.scheduleSave}
        </button>
      </footer>
    </main>
  );
}
