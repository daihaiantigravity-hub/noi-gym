"use client";

import Link, { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import { getPageHref, getPaginationItems } from "@/lib/exercises/pagination";
import { useAppLanguage } from "@/components/LanguageProvider";
import { getMessages, translate } from "@/lib/i18n/messages";
import { useExerciseRoutePrefetch } from "./use-exercise-route-prefetch";

function PageLinkContent({ children, loadingLabel }: { children: ReactNode; loadingLabel: string }) {
  const { pending } = useLinkStatus();
  return (
    <span aria-busy={pending} className={`exercise-library-pagination__content${pending ? " exercise-library-pagination__content--pending" : ""}`}>
      <span className="exercise-library-pagination__label">{children}</span>
      {pending && <span aria-label={loadingLabel} className="exercise-library-pagination__spinner" role="status" />}
    </span>
  );
}

function Chevron({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
      <path d={direction === "previous" ? "m14 6-6 6 6 6" : "m10 6 6 6-6 6"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export default function ExercisePagination({ page, pageSize, routePath, total }: {
  page: number; pageSize: number; routePath: string; total: number;
}) {
  const { language } = useAppLanguage();
  const messages = getMessages(language);
  const { prefetchRoute, cancelPrefetch } = useExerciseRoutePrefetch();
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  if (totalPages <= 1) return null;

  function intentProps(targetPage: number) {
    const href = getPageHref(routePath, targetPage);
    return {
      href,
      prefetch: false as const,
      onPointerEnter: () => prefetchRoute(href),
      onPointerLeave: cancelPrefetch,
      onPointerDown: () => prefetchRoute(href, true),
      onFocus: () => prefetchRoute(href),
      onBlur: cancelPrefetch,
    };
  }

  return (
    <nav aria-label={messages.pagination} className="exercise-library-pagination">
      <div className="exercise-library-pagination__pages">
        {page > 1 ? (
          <Link {...intentProps(page - 1)} aria-label={messages.previousPage} className="exercise-library-pagination__link" rel="prev" title={messages.previousPage}><PageLinkContent loadingLabel={messages.loadingExercises}><Chevron direction="previous" /></PageLinkContent></Link>
        ) : (
          <button aria-label={messages.previousPage} className="exercise-library-pagination__link" disabled type="button"><Chevron direction="previous" /></button>
        )}
        {([9, 7] as const).map((slots) => (
          <div className={`exercise-library-pagination__numbers exercise-library-pagination__numbers--${slots === 7 ? "compact" : "wide"}`} key={slots}>
            {getPaginationItems(page, totalPages, slots).map((item, index) => item === "ellipsis" ? (
              <span aria-hidden="true" className="exercise-library-pagination__ellipsis" key={`ellipsis-${index}`}>…</span>
            ) : item === page ? (
              <span aria-current="page" aria-label={translate(language, "pageNumber", { number: item })} className="exercise-library-pagination__page exercise-library-pagination__page--active" key={item}>{item}</span>
            ) : (
              <Link {...intentProps(item)} aria-label={translate(language, "pageNumber", { number: item })} className="exercise-library-pagination__page" key={item}><PageLinkContent loadingLabel={messages.loadingExercises}>{item}</PageLinkContent></Link>
            ))}
          </div>
        ))}
        {page < totalPages ? (
          <Link {...intentProps(page + 1)} aria-label={messages.nextPage} className="exercise-library-pagination__link" rel="next" title={messages.nextPage}><PageLinkContent loadingLabel={messages.loadingExercises}><Chevron direction="next" /></PageLinkContent></Link>
        ) : (
          <button aria-label={messages.nextPage} className="exercise-library-pagination__link" disabled type="button"><Chevron direction="next" /></button>
        )}
      </div>
    </nav>
  );
}
