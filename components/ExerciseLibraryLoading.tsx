"use client";

import { useAppLanguage } from "@/components/LanguageProvider";
import { getMessages } from "@/lib/i18n/messages";

const loadingCards = ["first", "second", "third"];

export default function ExerciseLibraryLoading() {
  const { language } = useAppLanguage();
  const messages = getMessages(language);
  return (
    <main aria-busy="true" aria-label={messages.loadingExerciseList} className="exercise-library-page exercise-library-loading health-mood-surface">
      <header aria-hidden="true" className="exercise-library-header">
        <div className="exercise-library-loading__back" />
        <div className="exercise-library-loading__title" />
      </header>
      <section aria-hidden="true" className="exercise-library-results">
        <div className="exercise-library-results__list">
          {loadingCards.map((card) => (
            <article className="health-card exercise-library-loading__card" key={card}>
              <div className="exercise-library-loading__line exercise-library-loading__line--heading" />
              <div className="exercise-library-loading__media" />
              <div className="exercise-library-loading__line" />
              <div className="exercise-library-loading__line exercise-library-loading__line--short" />
            </article>
          ))}
        </div>
      </section>
      <p className="exercise-library-loading__status" role="status">{messages.loadingExercises}</p>
    </main>
  );
}
