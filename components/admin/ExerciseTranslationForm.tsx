"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { saveTranslationAction, type TranslationActionState } from "@/app/actions/translations";
import { useAppLanguage } from "@/components/LanguageProvider";
import { getWorkspaceMessages, workspaceText } from "@/lib/i18n/workspace-messages";
import type { getAdminTranslationEditor } from "@/lib/exercises/translation-admin";
import type { AppLanguage } from "@/lib/language";

type Editor = NonNullable<Awaited<ReturnType<typeof getAdminTranslationEditor>>>;

export default function ExerciseTranslationForm({ editor }: { editor: Editor }) {
  const { language } = useAppLanguage();
  const text = getWorkspaceMessages(language);
  const { source, translation, locale, sourceHash, sourceLocale } = editor;
  // A locale refresh must not silently rebase unsaved edits onto someone else's revision.
  const [openedRevision] = useState(translation?.updated_at ?? null);
  const [openedSourceHash] = useState(sourceHash);
  const initial = translation ?? (locale === sourceLocale ? source : null);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [confirmedSourceLocale, setSourceLocale] = useState<AppLanguage>(translation?.source_locale ?? sourceLocale);
  const [steps, setSteps] = useState(() => Array.from({ length: Math.max(initial?.steps.length ?? 0, source.steps.length) }, (_, key) => ({ value: initial?.steps[key] ?? "", key })));
  const nextStepKey = useRef(steps.length);
  const [state, formAction, pending] = useActionState(async (previous: TranslationActionState, formData: FormData): Promise<TranslationActionState> => {
    const result = await saveTranslationAction(previous, formData);
    return { ...result, updatedAt: result.updatedAt ?? previous.updatedAt };
  }, {});
  const payload = JSON.stringify({
    exerciseId: source.id, locale, sourceLocale: confirmedSourceLocale, sourceHash: openedSourceHash, name, description,
    steps: steps.map((step) => step.value), expectedUpdatedAt: state.updatedAt ?? openedRevision,
  });

  return (
    <div className="translation-editor">
      <section className="admin-panel translation-editor__source" aria-labelledby="translation-source-heading">
        <h2 id="translation-source-heading">{text.source}</h2>
        <div>
          <h3 lang={sourceLocale}>{source.name}</h3>
          <h4>{text.description}</h4><p lang={source.description ? sourceLocale : language}>{source.description || text.noDescription}</p>
          <h4>{text.instructions}</h4>
          {source.steps.length ? <ol lang={sourceLocale}>{source.steps.map((step, index) => <li key={index}>{step}</li>)}</ol> : <p>{text.noInstructions}</p>}
        </div>
      </section>
      <form action={formAction} className="admin-panel translation-editor__form">
        <input name="payload" type="hidden" value={payload} />
        <h2>{locale === "vi" ? text.vietnamese : text.english}</h2>
        <p className="admin-muted">{text.interfaceLanguageHelp}</p>
        {editor.status === "stale" && <p className="translation-editor__notice" role="status">{text.staleHelp}</p>}
        {openedSourceHash !== sourceHash && <p className="translation-editor__notice" role="alert">{text.translationSourceChanged}</p>}
        <fieldset disabled={pending}>
          <label className="admin-field"><span>{text.sourceLanguage}</span>
            <select onChange={(event) => setSourceLocale(event.target.value as AppLanguage)} value={confirmedSourceLocale}>
              <option value="en">{text.english}</option><option value="vi">{text.vietnamese}</option>
            </select>
            <small>{text.sourceLanguageHelp}</small>
          </label>
          <label className="admin-field"><span>{text.name}</span><input lang={locale} maxLength={200} onChange={(event) => setName(event.target.value)} required value={name} /></label>
          <label className="admin-field"><span>{text.description}</span><textarea lang={locale} maxLength={2000} onChange={(event) => setDescription(event.target.value)} rows={3} value={description} /></label>
          <div className="translation-editor__steps">
            <h3>{text.instructions}</h3>
            <p className="admin-muted">{workspaceText(language, "sourceStepCount", { count: source.steps.length })}</p>
            {steps.map((step, index) => <div className="translation-editor__step" key={step.key}>
              <label className="admin-field"><span>{workspaceText(language, "step", { number: index + 1 })}</span>
                <textarea lang={locale} maxLength={2000} onChange={(event) => setSteps((items) => items.map((item) => item.key === step.key ? { ...item, value: event.target.value } : item))} rows={3} value={step.value} />
              </label>
              <button aria-label={workspaceText(language, "removeStep", { number: index + 1 })} className="admin-button admin-button--small" onClick={() => setSteps((items) => items.filter((item) => item.key !== step.key))} type="button">×</button>
            </div>)}
            <button className="admin-button admin-button--small" disabled={steps.length >= 100} onClick={() => { const key = nextStepKey.current++; setSteps((items) => [...items, { key, value: "" }]); }} type="button">+ {text.addStep}</button>
          </div>
          <p className="admin-muted">{text.draftProgressHelp}</p>
          <p className="admin-muted">{text.draftHelp}</p>
          {state.error && <p className="admin-form-error" role="alert">{text[state.error]}</p>}
          {state.success && <p className="admin-form-success" role="status">{text[state.success]}</p>}
          <div className="admin-form-actions">
            <button className="admin-button" name="intent" type="submit" value="draft">{pending ? text.saving : text.saveDraft}</button>
            <button className="admin-button admin-button--primary" disabled={!source.steps.length} name="intent" type="submit" value="reviewed">{pending ? text.saving : text.approveTranslation}</button>
          </div>
        </fieldset>
        {(state.error === "translationConflict" || state.error === "translationSourceChanged") && <Link className="admin-text-link" href={`/admin/translations/${source.id}?locale=${locale}`} onClick={(event) => { event.preventDefault(); window.location.reload(); }}>{text.reload}</Link>}
      </form>
    </div>
  );
}
