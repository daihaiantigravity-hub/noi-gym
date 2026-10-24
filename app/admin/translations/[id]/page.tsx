import Link from "next/link";
import { notFound } from "next/navigation";
import ExerciseTranslationForm from "@/components/admin/ExerciseTranslationForm";
import { getAppLanguage } from "@/lib/i18n/server";
import { getWorkspaceMessages } from "@/lib/i18n/workspace-messages";
import { getAdminTranslationEditor } from "@/lib/exercises/translation-admin";

export default async function TranslationEditorPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const locale = query.locale === "en" ? "en" : "vi";
  const editor = await getAdminTranslationEditor(id, locale);
  if (!editor) notFound();
  const text = getWorkspaceMessages(await getAppLanguage());
  return (
    <main className="admin-page">
      <header className="admin-page-header"><div>
        <Link className="admin-back-link" href={`/admin/translations?locale=${locale}`}>← {text.backToTranslations}</Link>
        <h1>{text.translationEditor}</h1><p className="admin-muted">{editor.source.name}</p>
      </div><nav className="translation-language-tabs" aria-label={text.contentLanguage}>
        <Link aria-current={locale === "en" ? "page" : undefined} href={`?locale=en`}>{text.english}</Link>
        <Link aria-current={locale === "vi" ? "page" : undefined} href={`?locale=vi`}>{text.vietnamese}</Link>
      </nav></header>
      <ExerciseTranslationForm editor={editor} key={`${id}:${locale}`} />
    </main>
  );
}
