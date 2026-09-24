const loadingCards = ["first", "second", "third"];

export default function ExerciseLibraryLoading() {
  return (
    <main aria-busy="true" aria-label="Đang tải danh sách bài tập" className="exercise-library-page exercise-library-loading">
      <div aria-hidden="true" className="exercise-library-loading__back" />
      <section aria-hidden="true" className="exercise-library-results">
        <div className="exercise-library-loading__title" />
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
      <p className="exercise-library-loading__status" role="status">Đang tải bài tập…</p>
    </main>
  );
}
