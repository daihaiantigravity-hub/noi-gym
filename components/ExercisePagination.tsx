"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPageHref, getPaginationItems } from "@/lib/exercises/pagination";

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
  const router = useRouter();
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Phân trang bài tập" className="exercise-library-pagination">
      {/* <div className="exercise-library-pagination__summary">
        <span className="exercise-library-pagination__status">
          <strong>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}</strong> trong {total} bài tập
        </span>
        <label className="exercise-library-pagination__jump">
          <span aria-hidden="true">Trang <strong>{page}</strong> / {totalPages}</span>
          <svg aria-hidden="true" fill="none" height="12" viewBox="0 0 16 16" width="12"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></svg>
          <select aria-label="Chuyển đến trang" onChange={(event) => {
            const nextPage = Number(event.target.value);
            if (nextPage !== page) router.push(getPageHref(routePath, nextPage));
          }} value={page}>
            {Array.from({ length: totalPages }, (_, index) => <option key={index + 1} value={index + 1}>Trang {index + 1} / {totalPages}</option>)}
          </select>
        </label>
      </div> */}
      <div className="exercise-library-pagination__pages">
        {page > 1 ? (
          <Link aria-label="Trang trước" className="exercise-library-pagination__link" href={getPageHref(routePath, page - 1)} rel="prev" title="Trang trước"><Chevron direction="previous" /></Link>
        ) : (
          <button aria-label="Trang trước" className="exercise-library-pagination__link" disabled type="button"><Chevron direction="previous" /></button>
        )}
        {([7, 5] as const).map((slots) => (
          <div className={`exercise-library-pagination__numbers exercise-library-pagination__numbers--${slots === 5 ? "compact" : "wide"}`} key={slots}>
            {getPaginationItems(page, totalPages, slots).map((item, index) => item === "ellipsis" ? (
              <span aria-hidden="true" className="exercise-library-pagination__ellipsis" key={`ellipsis-${index}`}>…</span>
            ) : item === page ? (
              <span aria-current="page" aria-label={`Trang ${item}`} className="exercise-library-pagination__page exercise-library-pagination__page--active" key={item}>{item}</span>
            ) : (
              <Link aria-label={`Trang ${item}`} className="exercise-library-pagination__page" href={getPageHref(routePath, item)} key={item}>{item}</Link>
            ))}
          </div>
        ))}
        {page < totalPages ? (
          <Link aria-label="Trang sau" className="exercise-library-pagination__link" href={getPageHref(routePath, page + 1)} rel="next" title="Trang sau"><Chevron direction="next" /></Link>
        ) : (
          <button aria-label="Trang sau" className="exercise-library-pagination__link" disabled type="button"><Chevron direction="next" /></button>
        )}
      </div>
    </nav>
  );
}
