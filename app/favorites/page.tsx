import Link from "next/link";
import { redirect } from "next/navigation";
import FavoriteRemoveButton from "@/components/FavoriteRemoveButton";
import ExercisePagination from "@/components/ExercisePagination";
import { listUserFavoriteExercises, USER_FAVORITES_PAGE_SIZE } from "@/lib/exercises/favorites";
import { parsePage } from "@/lib/exercises/pagination";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/user-auth";
import { getAppLanguage, isLocalizationEnabled } from "@/lib/i18n/server";
import LanguageToggle from "@/components/LanguageToggle";
import { formatDate, formatNumber, getMessages, translate } from "@/lib/i18n/messages";
import { getExerciseLabel, getMuscleLabel } from "@/lib/i18n/labels";

export default async function FavoritesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!isSupabaseConfigured() || !(await getCurrentUser())) redirect("/auth/google?next=/favorites");
  const language = await getAppLanguage();
  const messages = getMessages(language);
  const queryParams = await searchParams;
  const page = parsePage(queryParams.page);
  const favorites = await listUserFavoriteExercises(page, USER_FAVORITES_PAGE_SIZE);
  if (favorites.items.length === 0 && favorites.total > 0 && page > 1) redirect("/favorites");

  return (
    <main className="favorites-page health-mood-surface">
      <header className="favorites-page__header">
        <Link aria-label={messages.backHome} className="exercise-library-back-button" href="/">
          <svg aria-hidden="true" fill="none" height="28" viewBox="0 0 24 24" width="28"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
        </Link>
        <div>
          <span>{messages.yourCollection}</span>
          <h1>{messages.savedExercises}</h1>
          <p>{translate(language, "exerciseCount", { count: formatNumber(language, favorites.total) })}</p>
        </div>
        {isLocalizationEnabled() && <div className="favorites-page__language"><LanguageToggle /></div>}
      </header>

      {favorites.items.length > 0 ? (
        <>
        <section aria-label={messages.savedList} className="favorites-page__grid">
          {favorites.items.map((exercise) => (
            <article className="favorite-card" key={exercise.id}>
              <Link className="favorite-card__media" href={exercise.publicHref}>
                {exercise.posterUrl
                  ? (
                    // Exercise posters can come from the configured R2 domain or legacy sources.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={translate(language, "exercisePreview", { name: exercise.name })} loading="lazy" src={exercise.posterUrl} />
                  )
                  : <span aria-hidden="true"><svg fill="none" height="44" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 32 32" width="44"><path d="M8 11v10M12 8v16M20 8v16M24 11v10M12 16h8M5 13v6M27 13v6" /></svg></span>}
              </Link>
              <div className="favorite-card__body">
                <div className="favorite-card__copy">
                  <h2><Link href={exercise.publicHref}>{exercise.name}</Link></h2>
                  {exercise.isTranslationFallback && <small>{messages.originalContent}</small>}
                  <p>{exercise.primaryMuscles.slice(0, 2).map((muscle) => getMuscleLabel(language, muscle)).join(" · ") || messages.exercise}</p>
                  <small>{exercise.category ? getExerciseLabel(language, exercise.category) : messages.noEquipment} · {translate(language, "savedOn", { date: formatDate(language, exercise.savedAt) })}</small>
                </div>
                <FavoriteRemoveButton exerciseId={exercise.id} exerciseName={exercise.name} />
              </div>
            </article>
          ))}
        </section>
        <ExercisePagination page={favorites.page} pageSize={favorites.pageSize} routePath="/favorites" total={favorites.total} />
        </>
      ) : (
        <section className="favorites-page__empty">
          <svg aria-hidden="true" fill="none" height="42" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 24 24" width="42"><path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1.55.83L12 17.2l-5.45 3.63A1 1 0 0 1 5 20V4a1 1 0 0 1 1-1Z" /></svg>
          <h2>{messages.noSavedExercises}</h2>
          <p>{messages.saveHelp}</p>
          <Link href="/">{messages.exploreExercises}</Link>
        </section>
      )}
    </main>
  );
}
