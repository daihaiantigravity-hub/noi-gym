"use client";

import Link from "next/link";
import { getPageHref, getPaginationItems } from "@/lib/exercises/pagination";
import { useAppLanguage } from "@/components/LanguageProvider";
import { getMessages, translate } from "@/lib/i18n/messages";

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
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  if (totalPages <= 1) return null;

  return (
    <nav aria-label={messages.pagination} className="exercise-library-pagination">
      <div className="exercise-library-pagination__pages">
        {page > 1 ? (
          <Link aria-label={messages.previousPage} className="exercise-library-pagination__link" href={getPageHref(routePath, page - 1)} rel="prev" title={messages.previousPage}><Chevron direction="previous" /></Link>
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
              <Link aria-label={translate(language, "pageNumber", { number: item })} className="exercise-library-pagination__page" href={getPageHref(routePath, item)} key={item}>{item}</Link>
            ))}
          </div>
        ))}
        {page < totalPages ? (
          <Link aria-label={messages.nextPage} className="exercise-library-pagination__link" href={getPageHref(routePath, page + 1)} rel="next" title={messages.nextPage}><Chevron direction="next" /></Link>
        ) : (
          <button aria-label={messages.nextPage} className="exercise-library-pagination__link" disabled type="button"><Chevron direction="next" /></button>
        )}
      </div>
    </nav>
  );
}
