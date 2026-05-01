import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import ReportTable from "../components/admin/ReportTable";
import StatsPanel from "../components/admin/StatsPanel";
import Navbar from "../components/ui/Navbar";
import PyExamLogo from "../components/ui/PyExamLogo";

interface ReportRow {
  student_id: string;
  student_name: string;
  student_number: string | null;
  email: string;
  submission_id: string;
  status: string;
  total_score: number | null;
  submitted_at: string | null;
  tab_switch_count: number;
}

interface Stats {
  mean: number | null;
  median: number | null;
  pass_rate: number | null;
  score_distribution: Array<{ range: string; count: number }>;
  questions: Array<{ question_id: string; statement: string; avg_score: number; fail_rate: number }>;
}

type Tab = "report" | "stats";

export default function AdminExamReport() {
  const { examId } = useParams<{ examId: string }>();
  const { t } = useTranslation("admin");
  const [report, setReport] = useState<ReportRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<Tab>("report");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!examId) return;
    Promise.all([
      api.get<ReportRow[]>(`/admin/exams/${examId}/report`),
      api.get<Stats>(`/admin/exams/${examId}/stats`),
    ])
      .then(([r, s]) => {
        setReport(r.data);
        setStats(s.data);
      })
      .finally(() => setLoading(false));
  }, [examId]);

  const submittedCount = report.length;
  const correctedCount = report.filter((r) => r.status === "corrected").length;
  const passedCount = stats?.pass_rate !== null && stats?.pass_rate !== undefined
    ? Math.round((stats.pass_rate / 100) * correctedCount)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      {/* ── Hero header ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-sm text-indigo-200 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              {t("report.back")}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <PyExamLogo size={44} />
            <div>
              <h1 className="text-xl font-bold text-white">
                {tab === "report" ? t("report.title") : t("stats.title")}
              </h1>
              <p className="text-sm text-indigo-200 mt-0.5">PyExam · Administration</p>
            </div>
          </div>

          {/* Quick summary pills */}
          {!loading && (
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10 flex-wrap">
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white">{submittedCount}</span>
                <span className="text-xs text-indigo-200">Soumissions</span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-blue-300">{correctedCount}</span>
                <span className="text-xs text-indigo-200">Corrigés</span>
              </div>
              {passedCount !== null && (
                <>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-emerald-300">{passedCount}</span>
                    <span className="text-xs text-indigo-200">Reçus</span>
                  </div>
                </>
              )}
              {stats?.pass_rate !== null && stats?.pass_rate !== undefined && (
                <>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-amber-300">{stats.pass_rate.toFixed(1)}%</span>
                    <span className="text-xs text-indigo-200">{t("stats.pass_rate")}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1">
            {(["report", "stats"] as Tab[]).map((tabName) => (
              <button
                key={tabName}
                onClick={() => setTab(tabName)}
                className={`px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === tabName
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {tabName === "report" ? t("report.title") : t("stats.title")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-9 h-9 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === "report" ? (
          <ReportTable rows={report} examId={examId!} />
        ) : stats ? (
          <StatsPanel
            mean={stats.mean}
            median={stats.median}
            pass_rate={stats.pass_rate}
            score_distribution={stats.score_distribution}
            questions={stats.questions}
          />
        ) : null}
      </main>
    </div>
  );
}
