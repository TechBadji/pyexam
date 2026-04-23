import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import api from "../api/axios";
import ExamForm from "../components/admin/ExamForm";
import Navbar from "../components/ui/Navbar";

interface ExamItem {
  id: string;
  title: string;
  status: string;
  duration_minutes: number;
  start_time: string;
  end_time: string;
}

export default function AdminDashboard() {
  const { t } = useTranslation("admin");
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [correcting, setCorrecting] = useState<Record<string, boolean>>({});

  const loadExams = () => {
    api
      .get<ExamItem[]>("/admin/exams")
      .then(({ data }) => setExams(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadExams(); }, []);

  const launchCorrection = async (examId: string) => {
    setCorrecting((c) => ({ ...c, [examId]: true }));
    try {
      await api.post(`/admin/exams/${examId}/correct`);
      toast.success(t("dashboard.correction_in_progress"));
    } catch {
      toast.error("Erreur lors du lancement de la correction.");
    } finally {
      setCorrecting((c) => ({ ...c, [examId]: false }));
    }
  };

  const deleteExam = async (id: string) => {
    if (!confirm("Supprimer cet examen ?")) return;
    await api.delete(`/admin/exams/${id}`);
    setExams((e) => e.filter((x) => x.id !== id));
  };

  const statusColor: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
    closed: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
    corrected: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("dashboard.title")}</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + {t("dashboard.create_exam")}
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-3xl mx-auto my-8 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("dashboard.create_exam")}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
              </div>
              <ExamForm onSuccess={() => { setShowForm(false); loadExams(); }} onCancel={() => setShowForm(false)} />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {exams.map((exam) => (
              <div key={exam.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="font-semibold text-gray-900 dark:text-white truncate">{exam.title}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[exam.status] ?? ""}`}>
                      {exam.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{exam.duration_minutes} min</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <Link to={`/admin/exams/${exam.id}/report`} className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    {t("dashboard.view_report")}
                  </Link>
                  <Link to={`/admin/exams/${exam.id}/stats`} className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    {t("dashboard.view_stats")}
                  </Link>
                  <button
                    onClick={() => launchCorrection(exam.id)}
                    disabled={correcting[exam.id]}
                    className="px-3 py-1.5 text-xs bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg transition-colors"
                  >
                    {correcting[exam.id] ? t("dashboard.correction_in_progress") : t("dashboard.launch_correction")}
                  </button>
                  <button onClick={() => deleteExam(exam.id)} className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {exams.length === 0 && (
              <div className="text-center py-20 text-gray-400 dark:text-gray-500">Aucun examen.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
