import BodyProfileMap from "@/components/BodyProfileMap";

type IconName =
  | "grid"
  | "activity"
  | "moon"
  | "heart"
  | "meditation"
  | "food"
  | "walk"
  | "run"
  | "bike"
  | "list"
  | "watch"
  | "more"
  | "steps"
  | "clock"
  | "flame"
  | "scan"
  | "home"
  | "together"
  | "fitness";

function Icon({ name, size = 28 }: { name: IconName; size?: number }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  return (
    <svg aria-hidden="true" className="health-icon" height={size} viewBox="0 0 24 24" width={size}>
      {name === "grid" && (
        <>
          <rect {...common} height="6.2" rx="1.4" width="6.2" x="2.6" y="2.6" />
          <rect {...common} height="6.2" rx="1.4" width="6.2" x="2.6" y="15.2" />
          <rect {...common} height="6.2" rx="1.4" width="6.2" x="15.2" y="15.2" />
          <path {...common} d="M17.4 10.2c-2.2-1.3-4.8.5-4.8 2.7 0-2.2-2.6-4-4.8-2.7" />
          <path {...common} d="M12.6 12.9c0 2.1 2.6 3.4 4.8 4.7 2.2-1.3 4.8-2.6 4.8-4.7 0-2.2-2.6-4-4.8-2.7" />
        </>
      )}
      {name === "activity" && (
        <>
          <circle cx="16.4" cy="4.8" fill="currentColor" r="2.2" />
          <path {...common} d="m13.5 8.2-2.8 3.6 3.1 2.4-4.5 5.4" />
          <path {...common} d="m13.5 8.2 3.5 2.2 2.6-.9" />
          <path {...common} d="m10.8 11.8-4.1 1.5-3.1 3.6" />
          <path {...common} d="m9.3 19.6 4.1-4.9 3.9 2.9" />
        </>
      )}
      {name === "moon" && (
        <>
          <path {...common} d="M18.8 14.2A7.7 7.7 0 0 1 9.6 5a7.8 7.8 0 1 0 9.2 9.2Z" />
          <path {...common} d="m18.2 4.2.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
        </>
      )}
      {name === "heart" && (
        <>
          <path {...common} d="M20.5 8.7c0 5-8.5 9.4-8.5 9.4S3.5 13.7 3.5 8.7A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 8.5 1.6Z" />
          <path {...common} d="M5.7 11.3h3l1.2-2.2 2.1 4.1 1.4-2.4h4.7" />
        </>
      )}
      {name === "meditation" && (
        <>
          <circle {...common} cx="12" cy="5" r="2.1" />
          <path {...common} d="M8.8 10.3c.8-1.2 2-1.9 3.2-1.9s2.4.7 3.2 1.9" />
          <path {...common} d="m12 8.5-2 5.5-5.3 2.1a2 2 0 0 0 .6 3.8c2.9.2 5.2-1 6.7-2.8 1.5 1.8 3.8 3 6.7 2.8a2 2 0 0 0 .6-3.8L14 14Z" />
        </>
      )}
      {name === "food" && (
        <>
          <path {...common} d="M4.5 3v7.2M7.2 3v7.2M9.9 3v7.2M4.5 7.4h5.4M7.2 10.2v10.4" />
          <path {...common} d="M17.2 3c2 1.5 2.6 4.2 1.3 6.2-.7 1-1.6 1.5-2.4 1.5v9.9M16.1 3v7.7M19.5 3v7.7" />
        </>
      )}
      {name === "walk" && (
        <>
          <circle cx="12" cy="4.3" fill="currentColor" r="1.8" />
          <path {...common} d="m11.5 7.2 1.1 5.1-2.5 3.1M12.6 12.3l3.4 2.1M10.1 15.4l-2.2 4.5M10.1 15.4l2.6 4.6" />
        </>
      )}
      {name === "run" && (
        <>
          <circle cx="15.6" cy="4.4" fill="currentColor" r="1.8" />
          <path {...common} d="m13.6 7.1-3.3 3.2 3.7 2.6-2 3.9M13.9 7.5l3.1 2.4 2.8-.7M11.9 16.8l-3.9 3.1M11.9 16.8l3.6 2.5" />
        </>
      )}
      {name === "bike" && (
        <>
          <circle {...common} cx="6.2" cy="17.2" r="3.2" />
          <circle {...common} cx="17.9" cy="17.2" r="3.2" />
          <circle cx="12.5" cy="4.6" fill="currentColor" r="1.8" />
          <path {...common} d="m12.5 7.2-2.2 4.4 4.4.1 3.2 5.5M10.3 11.6l-3.2 5.6M10.3 11.6l-2.6-2.5M12.5 7.2l3.6.6" />
        </>
      )}
      {name === "list" && (
        <>
          <circle cx="5" cy="6.3" fill="currentColor" r="1.1" />
          <circle cx="5" cy="12" fill="currentColor" r="1.1" />
          <circle cx="5" cy="17.7" fill="currentColor" r="1.1" />
          <path {...common} d="M9 6.3h10M9 12h10M9 17.7h10" />
        </>
      )}
      {name === "watch" && (
        <>
          <rect {...common} height="12" rx="4" width="9" x="7.5" y="6" />
          <path {...common} d="M9.5 6 10 2.5h4l.5 3.5M9.5 18l.5 3.5h4l.5-3.5" />
          <path {...common} d="M10.5 9.5h3M12 9.5v3l1.8 1" />
        </>
      )}
      {name === "more" && (
        <>
          <circle cx="12" cy="4" fill="currentColor" r="1.7" />
          <circle cx="12" cy="12" fill="currentColor" r="1.7" />
          <circle cx="12" cy="20" fill="currentColor" r="1.7" />
        </>
      )}
      {name === "steps" && (
        <>
          <path {...common} d="M14.2 4.1c1.5.3 2.6 1.4 2.4 2.7-.2 1.1-1.4 1.6-2.6 1.2l-2.2-.8c-.9-.4-1.3-1.4-.8-2.2.5-.8 1.7-1.2 3.2-.9Z" />
          <path {...common} d="M8 12.2c1.4.3 2.4 1.4 2.2 2.6-.2 1-1.3 1.5-2.4 1.1l-2-.8c-.9-.3-1.2-1.3-.8-2.1.5-.8 1.6-1.1 3-.8Z" />
          <path {...common} d="M15 8.3c1.1 1.6 1.3 3.2.4 4.1-.8.8-2.1.4-2.8-.6l-1.2-1.8" />
          <path {...common} d="m10.8 16.1-2.5 4.3" />
        </>
      )}
      {name === "clock" && (
        <>
          <circle {...common} cx="12" cy="12" r="8.5" />
          <path {...common} d="M12 7.6v4.8l3 1.7" />
        </>
      )}
      {name === "flame" && (
        <path {...common} d="M13.4 2.8c.8 3-1.8 4.3-1.8 6.2 0 1.1.8 1.8 1.7 2.2-.1-1.4.6-2.7 2-3.7 1.7 2 3.1 4.1 3.1 6.6a6.4 6.4 0 1 1-12.8 0c0-2.7 1.4-5.3 4.3-7.8.2 2.1 1 3.1 2 3.8.6-1.8.2-3.9 1.5-7.3Z" />
      )}
      {name === "scan" && (
        <>
          <path {...common} d="M8.5 3.5H5.8a2.3 2.3 0 0 0-2.3 2.3v2.7M15.5 3.5h2.7a2.3 2.3 0 0 1 2.3 2.3v2.7M8.5 20.5H5.8a2.3 2.3 0 0 1-2.3-2.3v-2.7M15.5 20.5h2.7a2.3 2.3 0 0 0 2.3-2.3v-2.7" />
          <path {...common} d="M12 8.3v7.4M8.3 12h7.4" />
        </>
      )}
      {name === "home" && (
        <>
          <path {...common} d="m4.3 10.7 7.7-6 7.7 6v8.1a1.7 1.7 0 0 1-1.7 1.7H6a1.7 1.7 0 0 1-1.7-1.7Z" />
          <path {...common} d="M8.6 13.6c0-1.7 2-2.5 3.4-1.2 1.4-1.3 3.4-.5 3.4 1.2 0 1.5-1.5 2.4-3.4 3.4-1.9-1-3.4-1.9-3.4-3.4Z" />
        </>
      )}
      {name === "together" && <path {...common} d="M4.2 5.2v13.6c3.2-2 5.4-2 8.6 0 3.2-2 5.4-2 7 0V5.2c-1.6-1-3.8-1-7 1-3.2-2-5.4-2-8.6-1Z" />}
      {name === "fitness" && (
        <>
          <rect {...common} height="14" rx="2.3" width="15.8" x="4.1" y="5.2" />
          <path {...common} d="M8 3.5v3M16 3.5v3M8 15.2l2.1 2 4.2-4.4" />
        </>
      )}
    </svg>
  );
}

function HeartRings() {
  const heartPath = "M110 182C92 164 25 128 25 68c0-29 22-47 49-47 17 0 30 8 36 22 6-14 19-22 36-22 27 0 49 18 49 47 0 60-67 96-85 114Z";

  return (
    <div aria-label="Mức độ hoàn thành hoạt động" className="heart-rings" role="img">
      <svg aria-hidden="true" viewBox="0 0 220 205">
        <path className="heart-rings__track heart-rings__track--outer" d={heartPath} pathLength="100" />
        <path className="heart-rings__progress heart-rings__progress--outer" d={heartPath} pathLength="100" />
        <path className="heart-rings__track heart-rings__track--middle" d={heartPath} pathLength="100" transform="translate(11 10) scale(.9)" />
        <path className="heart-rings__progress heart-rings__progress--middle" d={heartPath} pathLength="100" transform="translate(11 10) scale(.9)" />
        <path className="heart-rings__track heart-rings__track--inner" d={heartPath} pathLength="100" transform="translate(23 21) scale(.78)" />
        <path className="heart-rings__progress heart-rings__progress--inner" d={heartPath} pathLength="100" transform="translate(23 21) scale(.78)" />
      </svg>
    </div>
  );
}

function Metric({ icon, value, label, className }: { icon: IconName; value: string; label: string; className: string }) {
  return (
    <div className="activity-metric">
      <span className={`activity-metric__icon ${className}`}><Icon name={icon} size={21} /></span>
      <span className="activity-metric__value">{value}</span>
      <span className="activity-metric__label">{label}</span>
    </div>
  );
}

const categoryItems: { icon: IconName; label: string; active?: boolean }[] = [
  { icon: "grid", label: "Dashboard" },
  { icon: "activity", label: "Activity", active: true },
  { icon: "moon", label: "Sleep" },
  { icon: "heart", label: "Health" },
  { icon: "meditation", label: "Mindfulness" },
  { icon: "food", label: "Food" },
];

const weekBars = [
  { day: "M", height: "88%" },
  { day: "T", height: "88%" },
  { day: "W", height: "39%" },
  { day: "T", height: "58%" },
  { day: "F", height: "0%" },
  { day: "S", height: "0%" },
  { day: "S", height: "0%", current: true },
];

type WorkoutCard = {
  title: string;
  meta: string;
  variant: "full-body" | "muscle" | "home-yoga" | "outdoor" | "zumba" | "dance";
  kicker: string;
  hero: string;
  sub: string;
};

const workoutRows: { title: string; cards: WorkoutCard[] }[] = [
  {
    title: "Học động tác khó từ vận động viên chuyên nghiệp",
    cards: [
      { title: "Bài tập toàn thân 10 phút", meta: "10:36 LILLIUS", variant: "full-body", kicker: "10 MINUTE MIRACLE", hero: "FULL BODY", sub: "WORKOUT" },
      { title: "Bài tập cơ bắp chuyên sâu", meta: "13:29 LILLIUS", variant: "muscle", kicker: "10 MINUTE MIRACLE", hero: "MUSCLE", sub: "WORKOUT" },
    ],
  },
  {
    title: "Thưởng cho việc tập tại nhà của bạn",
    cards: [
      { title: "6 mức độ gánh đùi", meta: "10:24 Pocket Gym", variant: "home-yoga", kicker: "AT HOME", hero: "FLOW", sub: "YOGA" },
      { title: "Tạo hình cơ thể", meta: "08:22 Pocket Gym", variant: "outdoor", kicker: "MOVE EVERY DAY", hero: "MOVE", sub: "OUTDOOR" },
    ],
  },
  {
    title: "Zumba® – Tập luyện thật vui",
    cards: [
      { title: "Zumba® – Tập luyện thật vui", meta: "12:10 Zumba", variant: "zumba", kicker: "DANCE FITNESS", hero: "ZUMBA®", sub: "LET'S MOVE" },
      { title: "Nhịp điệu đầy năng lượng", meta: "09:40 Zumba", variant: "dance", kicker: "DANCE FITNESS", hero: "DANCE", sub: "TOGETHER" },
    ],
  },
];

function WorkoutShowcase({ title, cards }: { title: string; cards: WorkoutCard[] }) {
  const headingId = `workout-row-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <section aria-labelledby={headingId} className="health-card workout-showcase">
      <div className="workout-showcase__header">
        <h2 id={headingId}>{title}</h2>
        <button aria-label={`Xem thêm: ${title}`} className="workout-showcase__arrow" type="button">›</button>
      </div>
      <div className="workout-showcase__track">
        {cards.map((card) => (
          <article className="workout-showcase__card" key={card.title}>
            <div className={`workout-thumbnail workout-thumbnail--${card.variant}`}>
              <span className="workout-thumbnail__kicker">{card.kicker}</span>
              <strong className="workout-thumbnail__hero">{card.hero}</strong>
              <span className="workout-thumbnail__sub">{card.sub}</span>
              <span aria-hidden="true" className="workout-thumbnail__person" />
              <span aria-hidden="true" className="workout-thumbnail__play" />
            </div>
            <h3>{card.title}</h3>
            <p>{card.meta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="health-page">
      <header className="health-topbar">
        <div className="health-topbar__row">
          <span className="health-brand">Samsung Health</span>
          <div className="health-topbar__actions">
            <button aria-label="Đồng hồ" className="health-icon-button" type="button"><Icon name="watch" size={33} /></button>
            <button aria-label="Hồ sơ cá nhân" className="health-avatar" type="button"><span>🧔🏻</span></button>
            <button aria-label="Thêm tùy chọn" className="health-icon-button health-icon-button--more" type="button"><Icon name="more" size={26} /></button>
          </div>
        </div>

        <nav aria-label="Các nhóm sức khỏe" className="health-category-nav">
          {categoryItems.map((item) => (
            <button aria-label={item.label} className={`health-category-button${item.active ? " health-category-button--active" : ""}`} key={item.label} type="button">
              <Icon name={item.icon} size={38} />
            </button>
          ))}
        </nav>
      </header>

      <main className="health-content">
        <section className="health-intro">
          <h1>Activity</h1>
          <p>The day is slowly coming to an end. It&apos;s time to<br className="health-intro__break" /> reflect on today&apos;s activities.</p>
        </section>

        <section aria-labelledby="daily-activity-title" className="health-card daily-activity-card">
          <h2 id="daily-activity-title">Daily activity</h2>
          <div className="daily-activity-card__body">
            <div className="activity-metrics">
              <Metric className="activity-metric__icon--steps" icon="steps" label="steps" value="1,362" />
              <Metric className="activity-metric__icon--minutes" icon="clock" label="mins" value="8" />
              <Metric className="activity-metric__icon--calories" icon="flame" label="kcal" value="157" />
            </div>
            <HeartRings />
          </div>
        </section>

        <section aria-labelledby="weekly-workouts-title" className="health-card weekly-workouts-card">
          <span aria-hidden="true" className="weekly-workouts-card__dot" />
          <h2 id="weekly-workouts-title">Workouts this week</h2>
          <div className="weekly-workouts-card__body">
            <div className="weekly-workouts-card__stats">
              <strong>1:15:30</strong>
              <span>12 sessions</span>
              <span>626 kcal</span>
            </div>
            <div aria-label="Hoạt động theo từng ngày trong tuần" className="week-chart" role="img">
              <div className="week-chart__bars">
                {weekBars.map((bar, index) => (
                  <div className={`week-chart__column${bar.current ? " week-chart__column--current" : ""}`} key={`${bar.day}-${index}`}>
                    <span className="week-chart__bar" style={{ height: bar.height }} />
                    <span className="week-chart__day">{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <BodyProfileMap />

        <div className="workout-showcase-list">
          {workoutRows.map((row) => (
            <WorkoutShowcase cards={row.cards} key={row.title} title={row.title} />
          ))}
        </div>

        <section aria-labelledby="cardio-load-title" className="health-card cardio-card">
          <div className="cardio-card__copy">
            <h2 id="cardio-load-title">Daily cardio load</h2>
            <p>Track your daily activity to see when you&apos;ve reached your cardio load goal.</p>
          </div>
          <div aria-hidden="true" className="cardio-gauge"><span /><i /></div>
        </section>

        <section className="health-card fitness-index-card">
          <h2>Fitness index</h2>
        </section>
      </main>

      <nav aria-label="Điều hướng chính" className="health-bottom-nav">
        <div className="health-bottom-nav__pill">
          <button className="health-bottom-nav__item health-bottom-nav__item--active" type="button">
            <Icon name="home" size={33} />
            <span>Home</span>
          </button>
          <button className="health-bottom-nav__item" type="button">
            <Icon name="together" size={34} />
            <span>Together</span>
          </button>
          <button className="health-bottom-nav__item" type="button">
            <Icon name="fitness" size={34} />
            <span>Fitness</span>
          </button>
        </div>
        <button aria-label="Quét" className="health-scan-button" type="button"><Icon name="scan" size={33} /></button>
      </nav>
    </div>
  );
}
