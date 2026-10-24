import Link from "next/link";
import { getAppLanguage } from "@/lib/i18n/server";
import { getWorkspaceMessages, workspaceText } from "@/lib/i18n/workspace-messages";
import { formatDate, formatNumber } from "@/lib/i18n/messages";
import { getExerciseLabel } from "@/lib/i18n/labels";
import { getAdminTranslationOverview } from "@/lib/exercises/translation-admin";
import { TRANSLATION_FILTERS } from "@/lib/exercises/translation-overview";

export default async function TranslationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const locale = first(params.locale) === "en" ? "en" : "vi";
  const query = (first(params.q) ?? "").slice(0, 200);
  const requestedStatus = first(params.status) ?? "";
  const status = TRANSLATION_FILTERS.find((value) => value === requestedStatus) ?? "";
  const language = await getAppLanguage();
  const text = getWorkspaceMessages(language);
  const result = await getAdminTranslationOverview({ locale, query, status, page: Number(first(params.page)) });
  const pageHref = (page: number) => `?${new URLSearchParams({ locale, q: query, status, page: String(page) })}`;
  return (
    <main className="admin-page">
      <header className="admin-page-header"><div><span className="admin-eyebrow">{text.adminBrand}</span><h1>{text.translations}</h1><p className="admin-muted">{text.translationsDescription}</p></div></header>
      <section className="admin-stats translation-stats" aria-label={text.translations}>
        {(["total", ...TRANSLATION_FILTERS] as const).map((key) => <div className="admin-stat-card" key={key}><span>{text[key]}</span><strong>{formatNumber(language, result.stats[key])}</strong></div>)}
      </section>
      <section className="admin-list-panel">
        <form className="translation-filters" method="get">
          <label className="admin-field"><span>{text.contentLanguage}</span><select defaultValue={locale} key={locale} name="locale"><option value="vi">{text.vietnamese}</option><option value="en">{text.english}</option></select></label>
          <label className="admin-field"><span>{text.status}</span><select defaultValue={status} key={status} name="status"><option value="">{text.allStatuses}</option>{TRANSLATION_FILTERS.map((key) => <option key={key} value={key}>{text[key]}</option>)}</select></label>
          <label className="admin-field translation-filters__search"><span>{text.search}</span><input defaultValue={query} key={query} maxLength={200} name="q" placeholder={text.searchTranslations} type="search" /></label>
          <button className="admin-button" type="submit">{text.filter}</button>
        </form>
        {result.items.length ? <div className="admin-table-wrap"><table className="admin-table">
          <thead><tr><th>{text.source}</th><th>{text.translatedName}</th><th>{text.status}</th><th>{text.updated}</th><th><span className="sr-only">{text.editTranslation}</span></th></tr></thead>
          <tbody>{result.items.map((item) => <tr key={item.id}>
            <td><div className="admin-exercise-name"><strong>{item.name}</strong><small>{getExerciseLabel(language, item.category) || "—"}</small></div></td>
            <td lang={locale}>{item.translatedName || "—"}</td>
            <td><span className={`translation-status translation-status--${item.status}`}>{text[item.status]}</span></td>
            <td>{item.updatedAt ? formatDate(language, item.updatedAt) : "—"}</td>
            <td><Link className="admin-row-action" href={`/admin/translations/${item.id}?locale=${locale}`}>{text.editTranslation}</Link></td>
          </tr>)}</tbody>
        </table></div> : <div className="admin-empty-state"><p>{text.noTranslations}</p></div>}
        <nav aria-label={text.translations} className="admin-pagination">
          {result.page > 1 ? <Link className="admin-button admin-button--small" href={pageHref(result.page - 1)}>← {text.previous}</Link> : <span />}
          <span>{workspaceText(language, "page", { number: result.page, total: result.totalPages })}</span>
          {result.page < result.totalPages ? <Link className="admin-button admin-button--small" href={pageHref(result.page + 1)}>{text.next} →</Link> : <span />}
        </nav>
      </section>
    </main>
  );
}
