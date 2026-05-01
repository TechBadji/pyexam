import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/ui/Navbar";
import PyExamLogo from "../components/ui/PyExamLogo";

// ── Types ─────────────────────────────────────────────────────────────────────

type QuestionType = "mcq" | "coding";
type Difficulty = "beginner" | "intermediate" | "expert" | "culture";

interface OptionDraft { label: string; text: string; is_correct: boolean }
interface TestCase { input: string; expected_output: string; weight: number }
interface BankOption { id: string; label: string; text: string; is_correct: boolean }

interface BankQuestion {
  id: string;
  type: QuestionType;
  difficulty: Difficulty;
  tags: string[];
  statement: string;
  points: number;
  version: number;
  test_cases: TestCase[] | null;
  options: BankOption[];
  created_at: string;
}

interface QuestionFormState {
  type: QuestionType;
  difficulty: Difficulty;
  tags: string;
  statement: string;
  points: number;
  options: OptionDraft[];
  test_cases: TestCase[];
}

interface QuestionStat {
  bank_question_id: string;
  statement: string;
  attempt_count: number;
  success_rate: number | null;
  flag: "too_hard" | "too_easy" | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  beginner: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
  intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  expert: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
  culture: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
};

const OPTION_LABELS = ["A", "B", "C", "D"];

const emptyForm = (): QuestionFormState => ({
  type: "mcq",
  difficulty: "beginner",
  tags: "",
  statement: "",
  points: 1,
  options: OPTION_LABELS.map((l) => ({ label: l, text: "", is_correct: false })),
  test_cases: [],
});

// ── Main component ─────────────────────────────────────────────────────────────

export default function QuestionBankPage() {
  const { t } = useTranslation("admin");

  // ── Data ──
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<QuestionStat[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  // ── Tabs ──
  const [activeTab, setActiveTab] = useState<"list" | "stats">("list");

  // ── Filters ──
  const [filterType, setFilterType] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  // ── Selection ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Bulk tag modal ──
  const [showBulkTag, setShowBulkTag] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [bulkTagging, setBulkTagging] = useState(false);

  // ── Question form ──
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuestionFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // ── Load questions ──
  const loadQuestions = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.append("type", filterType);
    if (filterDifficulty) params.append("difficulty", filterDifficulty);
    if (filterTag.trim()) params.append("tag", filterTag.trim());
    if (filterSearch.trim()) params.append("search", filterSearch.trim());
    api
      .get<BankQuestion[]>(`/admin/bank/questions?${params}`)
      .then(({ data }) => { setQuestions(data); setSelectedIds(new Set()); })
      .finally(() => setLoading(false));
  };

  const loadStats = () => {
    setStatsLoading(true);
    api
      .get<QuestionStat[]>("/admin/bank/questions/stats")
      .then(({ data }) => setStats(data))
      .finally(() => setStatsLoading(false));
  };

  useEffect(() => { loadQuestions(); }, [filterType, filterDifficulty, filterTag, filterSearch]);
  useEffect(() => { if (activeTab === "stats") loadStats(); }, [activeTab]);

  // ── Selection helpers ──
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)));
    }
  };

  // ── Bulk tag ──
  const handleBulkTag = async () => {
    const tags = bulkTagInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (!tags.length) return;
    setBulkTagging(true);
    try {
      const { data } = await api.post<{ updated: number }>("/admin/bank/questions/bulk-tag", {
        question_ids: [...selectedIds],
        tags_to_add: tags,
      });
      toast.success(t("bank.bulk_tag_success", { count: data.updated }));
      setShowBulkTag(false);
      setBulkTagInput("");
      setSelectedIds(new Set());
      loadQuestions();
    } catch {
      toast.error(t("bank.bulk_tag_error"));
    } finally {
      setBulkTagging(false);
    }
  };

  // ── CRUD ──
  const openCreate = () => { setForm(emptyForm()); setEditingId(null); setShowForm(true); };

  const openEdit = (q: BankQuestion) => {
    setForm({
      type: q.type,
      difficulty: q.difficulty,
      tags: q.tags.join(", "),
      statement: q.statement,
      points: q.points,
      options: q.options.length > 0
        ? q.options.map((o) => ({ label: o.label, text: o.text, is_correct: o.is_correct }))
        : OPTION_LABELS.map((l) => ({ label: l, text: "", is_correct: false })),
      test_cases: q.test_cases ?? [],
    });
    setEditingId(q.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("bank.delete_confirm"))) return;
    await api.delete(`/admin/bank/questions/${id}`);
    setQuestions((qs) => qs.filter((q) => q.id !== id));
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    toast.success(t("bank.delete_success"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        difficulty: form.difficulty,
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
        statement: form.statement,
        points: form.points,
        test_cases: form.type === "coding" ? form.test_cases : null,
      };
      if (editingId) {
        await api.put(`/admin/bank/questions/${editingId}`, payload);
        if (form.type === "mcq") {
          const existing = questions.find((q) => q.id === editingId)?.options ?? [];
          for (const opt of existing) await api.delete(`/admin/bank/options/${opt.id}`);
          for (const opt of form.options) await api.post(`/admin/bank/questions/${editingId}/options`, opt);
        }
      } else {
        const { data: created } = await api.post<{ id: string }>("/admin/bank/questions", payload);
        if (form.type === "mcq") {
          for (const opt of form.options) await api.post(`/admin/bank/questions/${created.id}/options`, opt);
        }
      }
      setShowForm(false);
      loadQuestions();
      toast.success(editingId ? t("bank.edit_success") : t("bank.create_success"));
    } finally {
      setSaving(false);
    }
  };

  const updateOption = (i: number, patch: Partial<OptionDraft>) =>
    setForm((f) => ({ ...f, options: f.options.map((o, j) => (j === i ? { ...o, ...patch } : o)) }));
  const setCorrect = (i: number) =>
    setForm((f) => ({ ...f, options: f.options.map((o, j) => ({ ...o, is_correct: j === i })) }));
  const updateTC = (i: number, patch: Partial<TestCase>) =>
    setForm((f) => ({ ...f, test_cases: f.test_cases.map((tc, j) => (j === i ? { ...tc, ...patch } : tc)) }));

  const inputCls =
    "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  // ── Stats lookup map ──
  const statsMap = new Map(stats.map((s) => [s.bank_question_id, s]));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      {/* ── Hero header ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800">
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/admin" className="opacity-80 hover:opacity-100 transition-opacity">
                <PyExamLogo size={44} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">{t("bank.page_title")}</h1>
                <p className="text-sm text-indigo-200 mt-0.5">{t("bank.page_subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Link
                to="/admin"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors flex items-center gap-2 border border-white/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Administration
              </Link>
              <button
                onClick={openCreate}
                className="px-4 py-2 rounded-xl bg-white text-indigo-700 text-sm font-semibold hover:bg-indigo-50 transition-colors shadow-sm"
              >
                + {t("bank.add_question")}
              </button>
            </div>
          </div>

          {/* Tabs anchored to bottom of gradient */}
          <div className="flex gap-0 mt-5">
            {(["list", "stats"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium transition-all rounded-t-xl border-b-2 ${
                  activeTab === tab
                    ? "bg-white/10 text-white border-white"
                    : "text-indigo-200 border-transparent hover:text-white hover:bg-white/5"
                }`}
              >
                {t(`bank.tab_${tab}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* ── LIST TAB ── */}
        {activeTab === "list" && (
          <>
            {/* Filters + bulk actions */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={inputCls}>
                  <option value="">{t("bank.all_types")}</option>
                  <option value="mcq">{t("bank.type_mcq")}</option>
                  <option value="coding">{t("bank.type_coding")}</option>
                </select>
                <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} className={inputCls}>
                  <option value="">{t("bank.all_difficulties")}</option>
                  <option value="beginner">{t("bank.difficulty_beginner")}</option>
                  <option value="intermediate">{t("bank.difficulty_intermediate")}</option>
                  <option value="expert">{t("bank.difficulty_expert")}</option>
                  <option value="culture">{t("bank.difficulty_culture")}</option>
                </select>
                <input type="text" value={filterTag} onChange={(e) => setFilterTag(e.target.value)} placeholder={t("bank.filter_tag")} className={inputCls} />
                <input type="text" value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} placeholder={t("bank.search_placeholder")} className={inputCls} />
              </div>
            </div>

            {/* Selection toolbar */}
            {questions.length > 0 && (
              <div className="flex items-center gap-3 mb-3 text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === questions.length && questions.length > 0}
                    onChange={toggleAll}
                    className="rounded accent-indigo-600"
                  />
                  {selectedIds.size === questions.length
                    ? t("bank.deselect_all")
                    : t("bank.select_all")}
                  {selectedIds.size > 0 && (
                    <span className="ml-1 text-indigo-600 dark:text-indigo-400 font-medium">
                      ({selectedIds.size})
                    </span>
                  )}
                </label>

                {selectedIds.size > 0 && (
                  <button
                    onClick={() => setShowBulkTag(true)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    🏷 {t("bank.bulk_tag_button", { count: selectedIds.size })}
                  </button>
                )}
              </div>
            )}

            {/* Question list */}
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-20 text-gray-400 dark:text-gray-500 text-sm">
                {filterType || filterDifficulty || filterTag || filterSearch ? t("bank.no_results") : t("bank.empty")}
              </div>
            ) : (
              <div className="space-y-2">
                {questions.map((q) => {
                  const qStat = statsMap.get(q.id);
                  return (
                    <div key={q.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                      <div
                        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                      >
                        {/* Checkbox */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(q.id)}
                            onChange={() => toggleSelect(q.id)}
                            className="rounded accent-indigo-600 w-4 h-4"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                              {q.type === "mcq" ? t("bank.type_mcq") : t("bank.type_coding")}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[q.difficulty]}`}>
                              {t(`bank.difficulty_${q.difficulty}`)}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {q.points} pt{q.points > 1 ? "s" : ""}
                            </span>
                            {/* Version badge */}
                            {q.version > 1 && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-mono">
                                v{q.version}
                              </span>
                            )}
                            {q.tags.map((tag) => (
                              <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                #{tag}
                              </span>
                            ))}
                            {/* Performance badge */}
                            {qStat && qStat.success_rate !== null && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                qStat.flag === "too_hard"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                  : qStat.flag === "too_easy"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                  : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                              }`}>
                                {qStat.flag === "too_hard" && "⚠ "}
                                {qStat.flag === "too_easy" && "⚠ "}
                                {qStat.success_rate.toFixed(0)}% {t("bank.stats_success")}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">{q.statement}</p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openEdit(q); }}
                            className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            {t("bank.edit_question")}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }}
                            className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                          >
                            ✕
                          </button>
                          <span className={`text-gray-400 transition-transform duration-200 ${expanded === q.id ? "rotate-180" : ""}`}>▾</span>
                        </div>
                      </div>

                      {expanded === q.id && (
                        <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4 pt-3 bg-gray-50 dark:bg-gray-800/50">
                          <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap mb-3">{q.statement}</p>
                          {q.type === "mcq" && q.options.length > 0 && (
                            <div className="space-y-1.5">
                              {q.options.map((opt) => (
                                <div key={opt.id} className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg ${opt.is_correct ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 font-medium" : "text-gray-600 dark:text-gray-300"}`}>
                                  <span className="font-bold w-5">{opt.label}</span>
                                  <span>{opt.text}</span>
                                  {opt.is_correct && <span className="ml-auto text-xs">✓ correct</span>}
                                </div>
                              ))}
                            </div>
                          )}
                          {q.type === "coding" && q.test_cases && q.test_cases.length > 0 && (
                            <div className="space-y-1.5 mt-1">
                              {q.test_cases.map((tc, i) => (
                                <div key={i} className="text-xs font-mono bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 grid grid-cols-3 gap-2">
                                  <span><span className="text-gray-400">in:</span> {tc.input}</span>
                                  <span><span className="text-gray-400">out:</span> {tc.expected_output}</span>
                                  <span><span className="text-gray-400">w:</span> {tc.weight}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── STATS TAB ── */}
        {activeTab === "stats" && (
          <div>
            {statsLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : stats.length === 0 ? (
              <div className="text-center py-20 text-gray-400 dark:text-gray-500 text-sm">
                {t("bank.stats_empty")}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">{t("bank.stats_statement")}</th>
                      <th className="px-4 py-3 text-right">{t("bank.stats_attempts")}</th>
                      <th className="px-4 py-3 text-right">{t("bank.stats_success_rate")}</th>
                      <th className="px-4 py-3 text-center">{t("bank.stats_flag")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {stats.map((s) => (
                      <tr key={s.bank_question_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-200 max-w-xs">
                          <p className="line-clamp-2 text-xs">{s.statement}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{s.attempt_count}</td>
                        <td className="px-4 py-3 text-right">
                          {s.success_rate !== null ? (
                            <span className={`font-semibold ${
                              s.flag === "too_hard" ? "text-red-600 dark:text-red-400" :
                              s.flag === "too_easy" ? "text-amber-600 dark:text-amber-400" :
                              "text-green-600 dark:text-green-400"
                            }`}>
                              {s.success_rate.toFixed(1)}%
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {s.flag === "too_hard" && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-medium">
                              {t("bank.flag_too_hard")}
                            </span>
                          )}
                          {s.flag === "too_easy" && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-medium">
                              {t("bank.flag_too_easy")}
                            </span>
                          )}
                          {!s.flag && <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Bulk Tag Modal ── */}
      {showBulkTag && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {t("bank.bulk_tag_title")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t("bank.bulk_tag_subtitle", { count: selectedIds.size })}
            </p>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("bank.bulk_tag_label")}
            </label>
            <input
              type="text"
              autoFocus
              value={bulkTagInput}
              onChange={(e) => setBulkTagInput(e.target.value)}
              placeholder={t("bank.bulk_tag_placeholder")}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleBulkTag(); } }}
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowBulkTag(false); setBulkTagInput(""); }}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t("bank.form_cancel")}
              </button>
              <button
                type="button"
                disabled={bulkTagging || !bulkTagInput.trim()}
                onClick={handleBulkTag}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                {bulkTagging ? "…" : t("bank.bulk_tag_apply")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Question Form Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl mx-auto my-8 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? t("bank.form_title_edit") : t("bank.form_title_create")}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("bank.form_type")}</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as QuestionType }))} className={inputCls} disabled={!!editingId}>
                    <option value="mcq">{t("bank.type_mcq")}</option>
                    <option value="coding">{t("bank.type_coding")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("bank.form_difficulty")}</label>
                  <select value={form.difficulty} onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value as Difficulty }))} className={inputCls}>
                    <option value="beginner">{t("bank.difficulty_beginner")}</option>
                    <option value="intermediate">{t("bank.difficulty_intermediate")}</option>
                    <option value="expert">{t("bank.difficulty_expert")}</option>
                    <option value="culture">{t("bank.difficulty_culture")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("bank.tags_label")} <span className="ml-1.5 text-xs font-normal text-gray-400">{t("bank.tags_hint")}</span>
                </label>
                <input type="text" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder={t("bank.tags_placeholder")} className={inputCls} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("bank.form_statement")}</label>
                <textarea required rows={4} value={form.statement} onChange={(e) => setForm((f) => ({ ...f, statement: e.target.value }))} className={inputCls} />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("bank.form_points")}</label>
                <input type="number" min={0.5} step={0.5} value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))} className={inputCls} />
              </div>

              {form.type === "mcq" && (
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="font-bold text-gray-400 w-5 text-sm">{opt.label}</span>
                      <input type="text" required value={opt.text} onChange={(e) => updateOption(i, { text: e.target.value })} placeholder={`Option ${opt.label}`} className={inputCls} />
                      <label className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400 whitespace-nowrap cursor-pointer">
                        <input type="radio" name="bank_correct" checked={opt.is_correct} onChange={() => setCorrect(i)} className="accent-green-600" />
                        {t("bank.form_mark_correct")}
                      </label>
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm((f) => ({ ...f, options: [...f.options, { label: String.fromCharCode(65 + f.options.length), text: "", is_correct: false }] }))} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                    + {t("bank.form_add_option")}
                  </button>
                </div>
              )}

              {form.type === "coding" && (
                <div className="space-y-2">
                  {form.test_cases.map((tc, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2">
                      <input value={tc.input} onChange={(e) => updateTC(i, { input: e.target.value })} placeholder={t("bank.form_input")} className={inputCls} />
                      <input value={tc.expected_output} onChange={(e) => updateTC(i, { expected_output: e.target.value })} placeholder={t("bank.form_expected")} className={inputCls} />
                      <input type="number" min={0.1} step={0.1} value={tc.weight} onChange={(e) => updateTC(i, { weight: Number(e.target.value) })} placeholder={t("bank.form_weight")} className={inputCls} />
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm((f) => ({ ...f, test_cases: [...f.test_cases, { input: "", expected_output: "", weight: 1 }] }))} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                    + {t("bank.form_add_test_case")}
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  {t("bank.form_cancel")}
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium transition-colors">
                  {saving ? t("bank.form_saving") : t("bank.form_save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
