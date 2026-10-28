import { getIntlLocale, getMessages } from "@/lib/i18n/messages";
import type { AppLanguage } from "@/lib/language";
import { getMondayFirstDayIndex, getMondayFirstWeekDates } from "@/lib/workout-schedule";

export default function WeeklyDateStrip({ today, language }: { today: Date | null; language: AppLanguage }) {
  const locale = getIntlLocale(language);
  const messages = getMessages(language);
  const days = today ? getMondayFirstWeekDates(today) : [];
  const todayIndex = today ? getMondayFirstDayIndex(today) : -1;
  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  const dayFormatter = new Intl.DateTimeFormat(locale, { day: "numeric" });
  const fullDateFormatter = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div aria-label={messages.workoutScheduleDateLabel} className="weekly-date-strip" role="group">
      {days.length ? days.map((date, index) => {
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        const status = index === todayIndex ? "today" : index < todayIndex ? "past" : "future";
        return (
          <time aria-current={status === "today" ? "date" : undefined} aria-label={fullDateFormatter.format(date)} className={`weekly-date-strip__day weekly-date-strip__day--${status}`} dateTime={dateKey} key={dateKey}>
            <span className="weekly-date-strip__weekday" aria-hidden="true">{weekdayFormatter.format(date)}</span>
            <span className="weekly-date-strip__number" aria-hidden="true">{dayFormatter.format(date)}</span>
          </time>
        );
      }) : Array.from({ length: 7 }, (_, index) => (
        <span aria-hidden="true" className="weekly-date-strip__day weekly-date-strip__day--placeholder" key={index}>
          <span className="weekly-date-strip__weekday">&nbsp;</span>
          <span className="weekly-date-strip__number" />
        </span>
      ))}
    </div>
  );
}
