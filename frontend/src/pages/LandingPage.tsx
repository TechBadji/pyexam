import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import api from "../api/axios";
import CertifCampLogo from "../components/ui/CertifCampLogo";
import DarkModeToggle from "../components/ui/DarkModeToggle";
import LanguageSwitcher from "../components/ui/LanguageSwitcher";
import { TRACKS, TRACK_IDS, type TrackId } from "../lib/tracks";
import { useAuthStore } from "../store/authStore";

type Counts = Record<TrackId, { mcq: number; coding: number; total: number }>;

const FALLBACK_COUNTS: Counts = {
  python: { mcq: 76, coding: 65, total: 141 },
  c: { mcq: 80, coding: 10, total: 90 },
  algo: { mcq: 0, coding: 20, total: 20 },
  psm1: { mcq: 115, coding: 0, total: 115 },
};

/* ── Demo papers, one per certification ───────────────────────────────────── */

interface McqDemo {
  kind: "mcq";
  index: number;
  total: number;
  prompt: string;
  options: string[];
  picked: number;
}

interface CodeDemo {
  kind: "code";
  index: number;
  total: number;
  prompt: string;
  code: string[];
  passed: number;
  tests: number;
}

type Demo = McqDemo | CodeDemo;

const DEMOS: Record<"fr" | "en", Record<TrackId, Demo>> = {
  fr: {
    python: {
      kind: "mcq", index: 12, total: 20,
      prompt: "Que renvoie len({'a': 1, 'b': 2, 'a': 3}) ?",
      options: ["3", "2", "1", "Une erreur"], picked: 1,
    },
    c: {
      kind: "mcq", index: 4, total: 20,
      prompt: "Après int t[5]; que vaut sizeof(t) / sizeof(t[0]) ?",
      options: ["4", "5", "20", "Indéfini"], picked: 1,
    },
    algo: {
      kind: "code", index: 7, total: 12,
      prompt: "Lisez un entier N et affichez la somme de ses chiffres.",
      code: ["n = input().strip()", "total = 0", "for c in n:", "    total += int(c)", "print(total)"],
      passed: 3, tests: 3,
    },
    psm1: {
      kind: "mcq", index: 9, total: 30,
      prompt: "Qui a l'autorité d'annuler un Sprint ?",
      options: ["Le Scrum Master", "Le Product Owner", "Les Developers", "Le sponsor"], picked: 1,
    },
  },
  en: {
    python: {
      kind: "mcq", index: 12, total: 20,
      prompt: "What does len({'a': 1, 'b': 2, 'a': 3}) return?",
      options: ["3", "2", "1", "An error"], picked: 1,
    },
    c: {
      kind: "mcq", index: 4, total: 20,
      prompt: "Given int t[5]; what is sizeof(t) / sizeof(t[0])?",
      options: ["4", "5", "20", "Undefined"], picked: 1,
    },
    algo: {
      kind: "code", index: 7, total: 12,
      prompt: "Read an integer N and print the sum of its digits.",
      code: ["n = input().strip()", "total = 0", "for c in n:", "    total += int(c)", "print(total)"],
      passed: 3, tests: 3,
    },
    psm1: {
      kind: "mcq", index: 9, total: 30,
      prompt: "Who has the authority to cancel a Sprint?",
      options: ["The Scrum Master", "The Product Owner", "The Developers", "The sponsor"], picked: 1,
    },
  },
};

function clock(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/* Counts up once the element is on screen, and re-runs if the total arrives late. */
function useCountUp(target: number) {
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || started) return;
    if (typeof IntersectionObserver === "undefined") {
      setStarted(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setStarted(true);
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const from = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - from) / 900);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    // Starved of frames (hidden tab, throttled renderer) the tween would leave a
    // wrong number on screen, so land on the real total either way.
    const settle = window.setTimeout(() => setValue(target), 1100);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
    };
  }, [started, target]);

  return { ref, value };
}

/* ── The paper the candidate is sitting, live ─────────────────────────────── */

function ExamCard({ track }: { track: TrackId }) {
  const { t, i18n } = useTranslation("landing");
  const lang = i18n.language.startsWith("en") ? "en" : "fr";
  const demo = DEMOS[lang][track];
  const meta = TRACKS[track];

  const [left, setLeft] = useState(2538);
  useEffect(() => {
    const id = window.setInterval(() => setLeft((s) => (s <= 1 ? 2700 : s - 1)), 1000);
    return () => window.clearInterval(id);
  }, []);

  const elapsed = 1 - left / 2700;

  return (
    <figure className="m-0">
      <div className="relative overflow-hidden rounded-2xl bg-[#241a29] text-ink-100 shadow-lift ring-1 ring-white/10">
        <div className="h-1 w-full bg-white/10">
          <div
            className="h-full transition-[width,background] duration-700 ease-linear"
            style={{ width: `${Math.min(100, elapsed * 100)}%`, background: meta.hexDark }}
          />
        </div>

        <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-3">
          <span
            className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors duration-300"
            style={{ color: meta.hexDark }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: meta.hexDark }} />
            {meta.short}
          </span>
          <span className="text-right">
            <span className="block text-[10px] text-ink-400">{t("demo.remaining")}</span>
            <span className="font-mono text-lg tabular-nums text-white">{clock(left)}</span>
          </span>
        </div>

        <div key={track} className="relative animate-rise px-5 pb-5">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex -rotate-[18deg] select-none items-center justify-center text-[13px] font-semibold uppercase tracking-[0.3em] text-white/[0.06]"
          >
            {t("demo.watermark")}
          </span>

          <p className="text-[11px] text-ink-400">
            {t("demo.question", { n: demo.index, total: demo.total })}
          </p>
          <p className="mt-1.5 min-h-[44px] text-[15px] font-medium leading-snug text-white">
            {demo.prompt}
          </p>

          {demo.kind === "mcq" ? (
            <ul className="mt-4 list-none space-y-1.5 p-0">
              {demo.options.map((opt, i) => {
                const on = i === demo.picked;
                return (
                  <li
                    key={opt}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                      on ? "bg-white/[0.09] text-white" : "text-ink-300"
                    }`}
                  >
                    <span
                      className="grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[9px] font-semibold"
                      style={{
                        borderColor: on ? meta.hexDark : "rgba(255,255,255,.22)",
                        background: on ? meta.hexDark : "transparent",
                        color: on ? "#1c1520" : "inherit",
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-4">
              <pre className="overflow-x-auto rounded-lg bg-black/30 p-3 font-mono text-[12px] leading-relaxed text-ink-200">
                {demo.code.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </pre>
              <div className="mt-3 flex items-center gap-2">
                {Array.from({ length: demo.tests }, (_, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded px-2 py-1 text-center text-[10px] font-semibold"
                    style={{
                      background: i < demo.passed ? `${meta.hexDark}22` : "rgba(255,255,255,.06)",
                      color: i < demo.passed ? meta.hexDark : "#918697",
                    }}
                  >
                    {t("demo.test", { n: i + 1 })}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-1" aria-hidden>
            {Array.from({ length: demo.total }, (_, i) => (
              <span
                key={i}
                className="h-1 flex-1 rounded-full transition-colors duration-500"
                style={{
                  background:
                    i < demo.index - 1
                      ? meta.hexDark
                      : i === demo.index - 1
                        ? "#ffffff"
                        : "rgba(255,255,255,.14)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-white/50">{t("demo.hint")}</figcaption>
    </figure>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const { t } = useTranslation("landing");
  const { user, isAuthenticated } = useAuthStore();
  const signedIn = isAuthenticated();

  const [counts, setCounts] = useState<Counts>(FALLBACK_COUNTS);
  const [track, setTrack] = useState<TrackId>("psm1");
  const [pinned, setPinned] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .get<{ tracks: Counts }>("/public/tracks")
      .then(({ data }) => {
        if (!alive) return;
        if (TRACK_IDS.some((id) => (data.tracks?.[id]?.total ?? 0) > 0)) setCounts(data.tracks);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (pinned) return;
    const id = window.setInterval(
      () => setTrack((cur) => TRACK_IDS[(TRACK_IDS.indexOf(cur) + 1) % TRACK_IDS.length]),
      6000
    );
    return () => window.clearInterval(id);
  }, [pinned]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pick = useCallback((id: TrackId) => {
    setPinned(true);
    setTrack(id);
  }, []);

  const home = user?.role === "admin" ? "/admin" : "/dashboard";
  const hall = useMemo(
    () => ["draw", "fullscreen", "watermark", "heartbeat", "offline", "audit"] as const,
    []
  );
  const orgs = useMemo(() => ["bank", "generate", "reports", "students"] as const, []);
  const steps = useMemo(() => ["one", "two", "three"] as const, []);

  const navLink = scrolled
    ? "text-ink-600 hover:text-brand-600 dark:text-ink-300 dark:hover:text-brand-300"
    : "text-white/70 hover:text-white";

  return (
    <div className="min-h-screen bg-ink-50 text-ink-900 dark:bg-ink-950 dark:text-ink-100">
      <a
        href="#tracks"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
      >
        {t("nav.tracks")}
      </a>

      {/* ── Header — transparent over the hero, solid once you scroll ────── */}
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "border-b border-ink-200/70 bg-ink-50/90 backdrop-blur-md dark:border-white/10 dark:bg-ink-950/90"
            : "border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-5 md:gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <CertifCampLogo size={28} tone={scrolled ? "seal" : "light"} />
            <span
              className={`font-display text-base font-semibold tracking-tight transition-colors sm:text-[19px] ${
                scrolled ? "" : "text-white"
              }`}
            >
              CertifCamp
            </span>
          </Link>

          <nav className={`ml-auto hidden items-center gap-7 text-sm transition-colors md:flex ${navLink}`}>
            <a href="#tracks" className="hover:opacity-100">{t("nav.tracks")}</a>
            <a href="#hall">{t("nav.hall")}</a>
            <a href="#orgs">{t("nav.orgs")}</a>
            <Link to="/aide">{t("nav.help")}</Link>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 md:ml-0">
            <LanguageSwitcher tone={scrolled ? "default" : "light"} />
            <DarkModeToggle tone={scrolled ? "default" : "light"} />
            {signedIn ? (
              <Link
                to={home}
                className="whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-brand-800 transition-transform hover:scale-[1.03] sm:px-4 sm:text-sm"
              >
                {t("nav.dashboard")}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`hidden rounded-full px-3 py-2 text-sm font-medium transition-colors sm:block ${navLink}`}
                >
                  {t("nav.login")}
                </Link>
                <Link
                  to="/register"
                  className={`whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold transition-transform hover:scale-[1.03] sm:px-4 sm:text-sm ${
                    scrolled ? "bg-brand-600 text-white" : "bg-white text-brand-800"
                  }`}
                >
                  <span className="sm:hidden">{t("nav.register_short")}</span>
                  <span className="hidden sm:inline">{t("nav.register")}</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink-950 pt-16">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-brand-800 via-[#3d1029] to-ink-950"
        />
        <div
          aria-hidden
          className="animate-drift absolute -left-24 top-0 h-[38rem] w-[38rem] rounded-full bg-brand-500/25 blur-3xl"
        />
        <div
          aria-hidden
          className="animate-drift-slow absolute -right-32 bottom-[-14rem] h-[34rem] w-[34rem] rounded-full blur-3xl transition-colors duration-1000"
          style={{ background: `${TRACKS[track].hexDark}2e` }}
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-5 md:pb-28 md:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
            <div>
              <h1 className="animate-rise font-display text-[2.1rem] font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.1rem]">
                {t("hero.title_line1")}
                <br />
                {t("hero.title_line2")}
              </h1>
              <p className="animate-rise mt-6 max-w-[54ch] text-[17px] leading-relaxed text-white/70 [animation-delay:90ms]">
                {t("hero.lede")}
              </p>

              {/* Pick a certification — the card follows */}
              <div
                className="animate-rise mt-8 flex flex-wrap gap-2 [animation-delay:160ms]"
                role="tablist"
                aria-label={t("hero.switch_label")}
              >
                {TRACK_IDS.map((id) => {
                  const on = id === track;
                  return (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={on}
                      onClick={() => pick(id)}
                      className={`min-w-[5.5rem] rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-300 ${
                        on
                          ? "text-ink-950"
                          : "bg-white/10 text-white/75 hover:bg-white/20 hover:text-white"
                      }`}
                      style={on ? { background: TRACKS[id].hexDark } : undefined}
                    >
                      {t(`tracks.${id}.name`)}
                    </button>
                  );
                })}
              </div>

              <div className="animate-rise mt-8 flex flex-wrap items-center gap-3 [animation-delay:240ms]">
                {signedIn ? (
                  <Link
                    to={home}
                    className="rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-brand-800 shadow-lift transition-transform hover:scale-[1.03]"
                  >
                    {t("hero.cta_dashboard")}
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-brand-800 shadow-lift transition-transform hover:scale-[1.03]"
                    >
                      {t("hero.cta_primary")}
                    </Link>
                    <Link
                      to="/login"
                      className="rounded-full border border-white/30 px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
                    >
                      {t("hero.cta_secondary")}
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="animate-rise [animation-delay:200ms] lg:pl-4">
              <ExamCard track={track} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Tracks ───────────────────────────────────────────────────────── */}
      <section
        id="tracks"
        className="scroll-mt-20 border-b border-ink-200 bg-white py-16 dark:border-white/10 dark:bg-ink-900/40 md:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("tracks.title")}
          </h2>
          <p className="mt-3 max-w-[62ch] text-ink-600 dark:text-ink-300">{t("tracks.lede")}</p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TRACK_IDS.map((id) => (
              <TrackCard key={id} id={id} total={(counts[id] ?? FALLBACK_COUNTS[id]).total} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Steps ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-5 md:py-24">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("steps.title")}
        </h2>
        <ol className="mt-12 grid list-none gap-x-10 gap-y-10 p-0 md:grid-cols-3">
          {steps.map((key, i) => (
            <li key={key} className="relative">
              <span
                aria-hidden
                className="absolute -top-3 right-0 hidden h-0.5 w-full bg-gradient-to-r from-brand-500 to-transparent md:block"
              />
              <span className="font-display text-5xl font-semibold leading-none text-brand-600 dark:text-brand-300">
                {i + 1}
              </span>
              <h3 className="mt-3 text-lg font-semibold">{t(`steps.${key}.title`)}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-600 dark:text-ink-300">
                {t(`steps.${key}.body`)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── The exam room ────────────────────────────────────────────────── */}
      <section
        id="hall"
        className="scroll-mt-20 bg-ink-950 py-16 text-ink-100 dark:bg-[#120c15] dark:border-y dark:border-white/10 md:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <div className="max-w-[62ch]">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {t("hall.title")}
            </h2>
            <p className="mt-3 text-ink-300">{t("hall.lede")}</p>
          </div>

          <dl className="mt-12 grid gap-x-12 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
            {hall.map((key) => (
              <div
                key={key}
                className="group relative border-t border-white/[.12] py-5 transition-colors hover:border-brand-400"
              >
                <dt className="font-semibold text-white transition-colors group-hover:text-brand-300">
                  {t(`hall.${key}.title`)}
                </dt>
                <dd className="ml-0 mt-1.5 text-sm leading-relaxed text-ink-300">
                  {t(`hall.${key}.body`)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── For training bodies ──────────────────────────────────────────── */}
      <section id="orgs" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-5 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("orgs.title")}
            </h2>
            <p className="mt-3 text-ink-600 dark:text-ink-300">{t("orgs.lede")}</p>
            <Link
              to="/aide"
              className="mt-6 inline-block rounded-full border border-ink-300 px-6 py-3 text-sm font-semibold transition-colors hover:border-brand-600 hover:bg-brand-50 hover:text-brand-700 dark:border-ink-700 dark:hover:border-brand-400 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
            >
              {t("orgs.cta")}
            </Link>
          </div>

          <dl className="grid gap-x-10 sm:grid-cols-2">
            {orgs.map((key) => (
              <div
                key={key}
                className="group border-t border-ink-200 py-5 transition-colors hover:border-brand-500 dark:border-white/10"
              >
                <dt className="font-semibold transition-colors group-hover:text-brand-700 dark:group-hover:text-brand-300">
                  {t(`orgs.${key}.title`)}
                </dt>
                <dd className="ml-0 mt-1.5 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                  {t(`orgs.${key}.body`)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Final call ───────────────────────────────────────────────────── */}
      {!signedIn && (
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-ink-950 py-16 md:py-20">
          <div
            aria-hidden
            className="animate-drift absolute -right-20 -top-24 h-80 w-80 rounded-full bg-brand-400/20 blur-3xl"
          />
          <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-5">
            <CertifCampLogo size={44} tone="light" />
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {t("final.title")}
            </h2>
            <p className="mt-3 text-white/70">{t("final.body")}</p>
            <Link
              to="/register"
              className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-[15px] font-semibold text-brand-800 shadow-lift transition-transform hover:scale-[1.03]"
            >
              {t("final.cta")}
            </Link>
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-ink-200 py-10 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-ink-500 dark:text-ink-400 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="m-0">
            <span className="font-display font-semibold text-ink-800 dark:text-ink-100">
              CertifCamp
            </span>{" "}
            — {t("footer.tagline")}
          </p>
          <nav className="flex flex-wrap gap-5">
            <Link to="/aide" className="hover:text-brand-600 dark:hover:text-brand-300">
              {t("footer.help")}
            </Link>
            <Link to="/cours-python" className="hover:text-brand-600 dark:hover:text-brand-300">
              {t("footer.course")}
            </Link>
            <Link to="/login" className="hover:text-brand-600 dark:hover:text-brand-300">
              {t("footer.login")}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function TrackCard({ id, total }: { id: TrackId; total: number }) {
  const { t } = useTranslation("landing");
  const meta = TRACKS[id];
  const { ref, value } = useCountUp(total);

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-xl bg-ink-50 p-5 ring-1 ring-ink-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift dark:bg-ink-950/60 dark:ring-white/10"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 origin-left scale-x-[.18] transition-transform duration-500 group-hover:scale-x-100"
        style={{ background: meta.hex }}
      />
      <h3 className="mt-2 font-display text-xl font-semibold">{t(`tracks.${id}.name`)}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
        {t(`tracks.${id}.blurb`)}
      </p>
      <p className="mt-5 border-t border-ink-200 pt-4 text-sm text-ink-500 dark:border-white/10 dark:text-ink-400">
        <span
          ref={ref}
          className="font-display text-2xl font-semibold tabular-nums"
          style={{ color: meta.hex }}
        >
          {value}
        </span>{" "}
        {t("tracks.questions_label")}
        <br />
        {t(`tracks.format_${meta.format}`)}
      </p>
    </article>
  );
}
