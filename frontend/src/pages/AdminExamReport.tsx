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
  max_score: number | null;
  grade_scale: number | null;
  scaled_score: number | null;
  passed: boolean | null;
  submitted_at: string | null;
  tab_switch_count: number;
}

interface Stats {
  mean: number | null;
  median: number | null;
  pass_rate: number | null;
  passed_count: number | null;
  total_corrected: number | null;
  max_score: number | null;
  passing_threshold: number | null;
  score_distribution: Array<{ range: string; count: number }>;
  questions: Array<{ question_id: string; statement: string; avg_score: number; fail_rate: number }>;
}

type Tab = "report" | "stats";

export default function AdminExamReport() {
  const { examId } = useParams<{ examId: string }>();
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const [report, setReport] = useState<ReportRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<Tab>("report");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    if (!examId || exporting) return;
    setExporting(true);
    try {
      const base = import.meta.env.VITE_API_URL || "/api";
      const token = localStorage.getItem("pyexam_access_token");
      const res = await fetch(`${base}/admin/exams/${examId}/results/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `results_${examId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

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
  const correctedCount = stats?.total_corrected ?? report.filter((r) => r.status === "corrected").length;
  const passedCount = stats?.passed_count ?? null;

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
                <span className="text-xs text-indigo-200">{t("report.submissions_label")}</span>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-blue-300">{correctedCount}</span>
                <span className="text-xs text-indigo-200">{tCommon("status.corrected")}</span>
              </div>
              {passedCount !== null && (
                <>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-emerald-300">{passedCount}</span>
                    <span className="text-xs text-indigo-200">{t("report.passed_label")}</span>
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
          <div className="flex items-center justify-between">
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
            <button
              onClick={handleExportCsv}
              disabled={exporting || report.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {exporting ? "…" : t("report.export_csv")}
            </button>
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
