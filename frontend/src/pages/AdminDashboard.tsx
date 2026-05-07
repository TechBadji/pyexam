import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import api from "../api/axios";
import ExamForm from "../components/admin/ExamForm";
import Navbar from "../components/ui/Navbar";
import PyExamLogo from "../components/ui/PyExamLogo";

interface ExamItem {
  id: string;
  title: string;
  status: string;
  duration_minutes: number;
  start_time: string;
  end_time: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  closed: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  corrected: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

function StatPill({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="flex flex-col items-center px-5 py-2">
      <span className={`text-2xl font-bold ${accent ?? "text-white"}`}>{value}</span>
      <span className="text-xs text-indigo-200 mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation("admin");
  const { t: tCommon } = useTranslation("common");
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [correcting, setCorrecting] = useState<Record<string, boolean>>({});
  const [publishing, setPublishing] = useState<Record<string, boolean>>({});

  const loadExams = () => {
    api
      .get<ExamItem[]>("/admin/exams")
      .then(({ data }) => setExams(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadExams(); }, []);

  const setStatus = async (examId: string, newStatus: "active" | "closed") => {
    setPublishing((p) => ({ ...p, [examId]: true }));
    try {
      await api.put(`/admin/exams/${examId}`, { status: newStatus });
      setExams((prev) => prev.map((e) => e.id === examId ? { ...e, status: newStatus } : e));
      toast.success(newStatus === "active" ? t("dashboard.exam_published") : t("dashboard.exam_closed"));
    } catch {
      toast.error(t("dashboard.correction_error"));
    } finally {
      setPublishing((p) => ({ ...p, [examId]: false }));
    }
  };

  const launchCorrection = async (examId: string) => {
    setCorrecting((c) => ({ ...c, [examId]: true }));
    try {
      await api.post(`/admin/exams/${examId}/correct`);
      setExams((prev) => prev.map((e) => e.id === examId ? { ...e, status: "corrected" } : e));
      toast.success(t("dashboard.correction_done"));
    } catch {
      toast.error(t("dashboard.correction_error"));
    } finally {
      setCorrecting((c) => ({ ...c, [examId]: false }));
    }
  };

  const deleteExam = async (id: string) => {
    if (!confirm("Supprimer cet examen ?")) return;
    await api.delete(`/admin/exams/${id}`);
    setExams((e) => e.filter((x) => x.id !== id));
  };

  const total = exams.length;
  const active = exams.filter((e) => e.status === "active").length;
  const corrected = exams.filter((e) => e.status === "corrected").length;
  const drafts = exams.filter((e) => e.status === "draft").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      {/* ── Hero header ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800">
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <PyExamLogo size={48} />
              <div>
                <h1 className="text-2xl font-bold text-white">{t("dashboard.title")}</h1>
                <p className="text-sm text-indigo-200 mt-0.5">PyExam · Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pb-2 flex-wrap">
              <Link
                to="/admin/bank"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors flex items-center gap-2 border border-white/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {t("dashboard.question_bank")}
              </Link>
              <Link
                to="/admin/users"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors flex items-center gap-2 border border-white/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t("dashboard.users")}
              </Link>
              <Link
                to="/admin/audit"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors flex items-center gap-2 border border-white/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {t("dashboard.audit_log")}
              </Link>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 rounded-xl bg-white text-indigo-700 text-sm font-semibold hover:bg-indigo-50 transition-colors shadow-sm"
              >
                + {t("dashboard.create_exam")}
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-1 mt-4 border-t border-white/10 divide-x divide-white/10">
            <StatPill label={t("dashboard.exam_list")} value={total} />
            <StatPill label={tCommon("status.active")} value={active} accent="text-emerald-300" />
            <StatPill label={tCommon("status.corrected")} value={corrected} accent="text-blue-300" />
            <StatPill label={tCommon("status.draft")} value={drafts} accent="text-amber-300" />
          </div>
        </div>
      </div>

      {/* ── Create exam modal ─────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-3xl mx-auto my-8 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PyExamLogo size={32} />
                <h2 className="text-base font-semibold text-white">{t("dashboard.create_exam")}</h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-white/70 hover:text-white transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <ExamForm onSuccess={() => { setShowForm(false); loadExams(); }} onCancel={() => setShowForm(false)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Exam list ─────────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-9 h-9 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Aucun examen. Créez-en un pour commencer.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              + {t("dashboard.create_exam")}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-gray-900 dark:text-white truncate">{exam.title}</h2>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[exam.status] ?? ""}`}>
                        {exam.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{exam.duration_minutes} min</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {exam.status === "draft" && (
                    <button
                      onClick={() => setStatus(exam.id, "active")}
                      disabled={publishing[exam.id]}
                      className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg transition-colors font-medium"
                    >
                      {publishing[exam.id] ? "…" : t("dashboard.publish")}
                    </button>
                  )}
                  {exam.status === "active" && (
                    <button
                      onClick={() => setStatus(exam.id, "closed")}
                      disabled={publishing[exam.id]}
                      className="px-3 py-1.5 text-xs bg-gray-500 hover:bg-gray-600 disabled:opacity-60 text-white rounded-lg transition-colors font-medium"
                    >
                      {publishing[exam.id] ? "…" : t("dashboard.close_exam")}
                    </button>
                  )}
                  <Link
                    to={`/admin/exams/${exam.id}/report`}
                    className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                  >
                    {t("dashboard.view_report")}
                  </Link>
                  <Link
                    to={`/admin/exams/${exam.id}/stats`}
                    className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
                  >
                    {t("dashboard.view_stats")}
                  </Link>
                  {exam.status === "closed" && (
                    <button
                      onClick={() => launchCorrection(exam.id)}
                      disabled={correcting[exam.id]}
                      className="px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg transition-colors font-medium"
                    >
                      {correcting[exam.id] ? t("dashboard.correction_in_progress") : t("dashboard.launch_correction")}
                    </button>
                  )}
                  <button
                    onClick={() => deleteExam(exam.id)}
                    className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
