import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/ui/Navbar";
import PyExamLogo from "../components/ui/PyExamLogo";
import { useAuthStore, type AuthUser } from "../store/authStore";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SessionCard {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  seconds_until_start: number;
  seconds_until_end: number;
  draw_config: { n_mcq: number; n_coding: number };
  enrolled: boolean;
}

interface ExamCard {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  status: string;
  seconds_until_start: number;
  seconds_until_end: number;
}

interface HistoryRow {
  id: string;
  exam_id: string;
  exam_title: string;
  duration_minutes: number;
  submitted_at: string | null;
  status: string;
  total_score: number | null;
  max_score: number | null;
  score_pct: number | null;
  tab_switch_count: number;
}

interface StatsData {
  total_exams: number;
  average_score_pct: number | null;
  best_score_pct: number | null;
  progression: { exam_title: string; submitted_at: string; score_pct: number }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCountdown(secs: number, t: (k: string) => string): string {
  if (secs <= 0) return t("dashboard.started");
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function ScoreBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-gray-400">—</span>;
  const color =
    pct >= 80
      ? "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30"
      : pct >= 50
      ? "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30"
      : "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {pct.toFixed(1)}%
    </span>
  );
}

function UserAvatar({ user, size = 52 }: { user: AuthUser; size?: number }) {
  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.full_name}
        className="rounded-full object-cover ring-2 ring-white/40"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const palette = ["bg-indigo-400", "bg-violet-400", "bg-pink-400", "bg-teal-400", "bg-amber-400"];
  const color = palette[user.full_name.charCodeAt(0) % palette.length];
  return (
    <div
      className={`${color} rounded-full flex items-center justify-center text-white font-bold select-none ring-2 ring-white/40`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

// ── Tab types ─────────────────────────────────────────────────────────────────

type Tab = "exams" | "sessions" | "history" | "stats";

// ── Sub-components ────────────────────────────────────────────────────────────

function SessionsTab() {
  const { t } = useTranslation("exam");
  const [sessions, setSessions] = useState<SessionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api
      .get<SessionCard[]>("/student/sessions")
      .then(({ data }) => setSessions(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleEnroll = async (sessionId: string) => {
    setEnrolling(sessionId);
    try {
      await api.post(`/student/exams/${sessionId}/enroll`);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, enrolled: true } : s))
      );
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) return <Spinner />;
  if (sessions.length === 0) return <EmptyState message={t("dashboard.sessions.no_sessions")} />;

  return (
    <div className="grid gap-4">
      {sessions.map((session) => {
        const hasStarted = session.seconds_until_start <= 0;
        const hasEnded = session.seconds_until_end <= 0;
        const isEnrolling = enrolling === session.id;
        return (
          <div
            key={session.id}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900 dark:text-white truncate">{session.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{session.description}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{session.duration_minutes} min</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium border border-indigo-100 dark:border-indigo-800">
                    {t("dashboard.sessions.draw_info", {
                      n_mcq: session.draw_config.n_mcq,
                      n_coding: session.draw_config.n_coding,
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {!hasStarted && (
                <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-full font-medium border border-amber-100 dark:border-amber-800">
                  {t("dashboard.sessions.starts_in")} {fmtCountdown(session.seconds_until_start, t)}
                </span>
              )}
              {hasEnded ? (
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                  {t("dashboard.sessions.closed")}
                </span>
              ) : session.enrolled ? (
                hasStarted ? (
                  <Link
                    to={`/exam/${session.id}`}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm"
                  >
                    {t("dashboard.sessions.enter")}
                  </Link>
                ) : (
                  <span className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full font-medium border border-emerald-100 dark:border-emerald-800">
                    ✓ {t("dashboard.sessions.enrolled")}
                  </span>
                )
              ) : (
                <button
                  onClick={() => handleEnroll(session.id)}
                  disabled={isEnrolling}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-sm"
                >
                  {isEnrolling ? t("dashboard.sessions.enrolling") : t("dashboard.sessions.enroll")}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExamsTab() {
  const { t } = useTranslation("exam");
  const [exams, setExams] = useState<ExamCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ExamCard[]>("/exams/available")
      .then(({ data }) => setExams(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (exams.length === 0) return <EmptyState message={t("dashboard.no_exams")} />;

  return (
    <div className="grid gap-4">
      {exams.map((exam) => {
        const hasStarted = exam.seconds_until_start <= 0;
        const hasEnded = exam.seconds_until_end <= 0;
        return (
          <div
            key={exam.id}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900 dark:text-white truncate">{exam.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{exam.description}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{exam.duration_minutes} min</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {!hasStarted && (
                <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-full font-medium border border-amber-100 dark:border-amber-800">
                  {t("dashboard.starts_in")} {fmtCountdown(exam.seconds_until_start, t)}
                </span>
              )}
              {hasEnded ? (
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                  {t("dashboard.closed")}
                </span>
              ) : hasStarted ? (
                <Link
                  to={`/exam/${exam.id}`}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm"
                >
                  {t("dashboard.enter_exam")}
                </Link>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HistoryTab() {
  const { t } = useTranslation("exam");
  const { t: tCommon } = useTranslation("common");
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<HistoryRow[]>("/student/history")
      .then(({ data }) => setRows(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (rows.length === 0) return <EmptyState message={t("dashboard.history.no_history")} />;

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left">{t("dashboard.history.exam")}</th>
            <th className="px-4 py-3 text-left">{t("dashboard.history.submitted_at")}</th>
            <th className="px-4 py-3 text-left">{t("dashboard.history.score")}</th>
            <th className="px-4 py-3 text-left">{t("dashboard.history.status")}</th>
            <th className="px-4 py-3 text-center">{t("dashboard.history.tab_switches")}</th>
            <th className="px-4 py-3 text-right" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <td className="px-4 py-3.5 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                {row.exam_title}
              </td>
              <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {fmtDate(row.submitted_at)}
              </td>
              <td className="px-4 py-3.5">
                {row.status === "corrected" ? (
                  <ScoreBadge pct={row.score_pct} />
                ) : (
                  <span className="text-xs text-gray-400">{t("dashboard.history.pending")}</span>
                )}
              </td>
              <td className="px-4 py-3.5">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    row.status === "corrected"
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {tCommon(`status.${row.status}`)}
                </span>
              </td>
              <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 text-center">
                {row.tab_switch_count > 0 ? (
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {row.tab_switch_count}
                  </span>
                ) : (
                  <span className="text-gray-300 dark:text-gray-600">0</span>
                )}
              </td>
              <td className="px-4 py-3.5 text-right">
                {row.status === "corrected" && (
                  <Link
                    to={`/results/${row.id}`}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    {t("dashboard.history.view_results")}
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatsTab() {
  const { t } = useTranslation("exam");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<StatsData>("/student/stats")
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!stats || stats.total_exams === 0)
    return <EmptyState message={t("dashboard.stats.no_stats")} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t("dashboard.stats.total_exams")} value={String(stats.total_exams)} />
        <StatCard
          label={t("dashboard.stats.average_score")}
          value={stats.average_score_pct !== null ? `${stats.average_score_pct}%` : "—"}
          pct={stats.average_score_pct}
        />
        <StatCard
          label={t("dashboard.stats.best_score")}
          value={stats.best_score_pct !== null ? `${stats.best_score_pct}%` : "—"}
          pct={stats.best_score_pct}
        />
      </div>

      {stats.progression.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-5">
            {t("dashboard.stats.progression")}
          </h3>
          <div className="space-y-4">
            {stats.progression.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-28 text-xs text-gray-500 dark:text-gray-400 truncate shrink-0">
                  {item.exam_title}
                </div>
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      item.score_pct >= 80 ? "bg-emerald-500" :
                      item.score_pct >= 50 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${item.score_pct}%` }}
                  />
                </div>
                <div className="w-12 text-right text-xs font-semibold text-gray-700 dark:text-gray-200 shrink-0">
                  {item.score_pct.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, pct }: { label: string; value: string; pct?: number | null }) {
  const valueColor =
    pct === undefined || pct === null
      ? "text-gray-900 dark:text-white"
      : pct >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : pct >= 50
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
        <svg className="w-7 h-7 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-sm text-gray-400 dark:text-gray-500">{message}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const { t } = useTranslation("exam");
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("exams");
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    api
      .get<StatsData>("/student/stats")
      .then(({ data }) => setStats(data))
      .catch(() => {});
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "exams", label: t("dashboard.tabs.exams") },
    { id: "sessions", label: t("dashboard.tabs.sessions") },
    { id: "history", label: t("dashboard.tabs.history") },
    { id: "stats", label: t("dashboard.tabs.stats") },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      {/* ── Hero header ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800">
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <PyExamLogo size={44} />
              <div>
                <h1 className="text-xl font-bold text-white">
                  {user ? t("dashboard.welcome", { name: user.full_name.split(" ")[0] }) : "PyExam"}
                </h1>
                <p className="text-sm text-indigo-200 mt-0.5">
                  {user?.student_number ? `N° ${user.student_number}` : "Espace étudiant"}
                </p>
              </div>
            </div>
            {user && <UserAvatar user={user} size={48} />}
          </div>

          {/* Quick stats row */}
          {stats && stats.total_exams > 0 && (
            <div className="flex items-center gap-1 mt-5 border-t border-white/10 divide-x divide-white/10">
              <div className="flex flex-col items-center px-5 py-3">
                <span className="text-xl font-bold text-white">{stats.total_exams}</span>
                <span className="text-xs text-indigo-200">{t("dashboard.stats.total_exams")}</span>
              </div>
              {stats.average_score_pct !== null && (
                <div className="flex flex-col items-center px-5 py-3">
                  <span className="text-xl font-bold text-amber-300">{stats.average_score_pct}%</span>
                  <span className="text-xs text-indigo-200">{t("dashboard.stats.average_score")}</span>
                </div>
              )}
              {stats.best_score_pct !== null && (
                <div className="flex flex-col items-center px-5 py-3">
                  <span className="text-xl font-bold text-emerald-300">{stats.best_score_pct}%</span>
                  <span className="text-xs text-indigo-200">{t("dashboard.stats.best_score")}</span>
                </div>
              )}
            </div>
          )}

          {/* Tab bar anchored to bottom of gradient */}
          <div className="flex gap-0 mt-4">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-5 py-3 text-sm font-medium transition-all rounded-t-xl border-b-2 ${
                  tab === id
                    ? "bg-white/10 text-white border-white"
                    : "text-indigo-200 border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {tab === "exams" && <ExamsTab />}
        {tab === "sessions" && <SessionsTab />}
        {tab === "history" && <HistoryTab />}
        {tab === "stats" && <StatsTab />}
      </main>
    </div>
  );
}
