import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import ReportTable from "../components/admin/ReportTable";
import StatsPanel from "../components/admin/StatsPanel";
import Navbar from "../components/ui/Navbar";

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
            ← {t("report.back")}
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {tab === "report" ? t("report.title") : t("stats.title")}
          </h1>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          {(["report", "stats"] as Tab[]).map((tabName) => (
            <button
              key={tabName}
              onClick={() => setTab(tabName)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === tabName
                  ? "border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tabName === "report" ? t("report.title") : t("stats.title")}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
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
