"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { EXERCISE_MUSCLES, EXERCISE_STATUSES, VISIBLE_EXERCISE_CATEGORIES } from "@/lib/exercises/constants";

type Props = {
  query: string;
  category: string;
  muscle: string;
  status: string;
  gender: string;
  source: string;
  pageSize: number;
};

export default function AdminExerciseFilters({ query, category, muscle, status, gender, source, pageSize }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchRef.current && document.activeElement !== searchRef.current) searchRef.current.value = query;
  }, [query]);

  useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
  }, []);

  function applyFilters() {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const params = new URLSearchParams();
    for (const name of ["q", "category", "muscle", "status", "gender", "source", "pageSize"]) {
      const value = String(formData.get(name) ?? "").trim();
      if (value) params.set(name, value);
    }
    params.set("page", "1");
    router.replace(`/admin/exercises?${params.toString()}`, { scroll: false });
  }

  function applyImmediately() {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = null;
    applyFilters();
  }

  return (
    <form className="admin-filter-bar" method="get" onChange={(event) => {
      if (event.target instanceof HTMLSelectElement) applyImmediately();
    }} onSubmit={(event) => {
      event.preventDefault();
      applyImmediately();
    }} ref={formRef}>
      <label className="admin-search-field"><span aria-hidden="true">⌕</span><input defaultValue={query} name="q" onInput={() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(applyFilters, 350);
      }} placeholder="Tìm theo tên bài tập…" ref={searchRef} type="search" /></label>
      <select aria-label="Equipment" defaultValue={category} name="category"><option value="">Tất cả equipment</option>{category && !VISIBLE_EXERCISE_CATEGORIES.some((item) => item === category) ? <option hidden value={category}>{category}</option> : null}{VISIBLE_EXERCISE_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
      <select aria-label="Nhóm cơ" defaultValue={muscle} name="muscle"><option value="">Tất cả nhóm cơ</option>{EXERCISE_MUSCLES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
      <select aria-label="Trạng thái" defaultValue={status} name="status"><option value="">Tất cả status</option>{EXERCISE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
      <select aria-label="Giới tính video" defaultValue={gender} name="gender"><option value="">Cả nam và nữ</option><option value="male">Có video nam</option><option value="female">Có video nữ</option></select>
      <input name="source" type="hidden" value={source} />
      <input name="pageSize" type="hidden" value={pageSize} />
    </form>
  );
}
