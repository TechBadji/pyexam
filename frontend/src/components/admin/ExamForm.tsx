import { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api/axios";
import BankPicker, { type BankQuestionPreview } from "./BankPicker";

interface TestCase {
  input: string;
  expected_output: string;
  weight: number;
}

interface OptionDraft {
  label: string;
  text: string;
  is_correct: boolean;
}

interface QuestionDraft {
  type: "mcq" | "coding";
  statement: string;
  points: number;
  options: OptionDraft[];
  test_cases: TestCase[];
}

interface ExamFormData {
  title: string;
  description: string;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  status: string;
}

interface ExamFormProps {
  initialData?: Partial<ExamFormData>;
  examId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const LABELS = ["A", "B", "C", "D"];

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
  intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  expert: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
  culture: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
};

export default function ExamForm({ initialData, examId, onSuccess, onCancel }: ExamFormProps) {
  const { t } = useTranslation("admin");
  const isEdit = !!examId;

  const [form, setForm] = useState<ExamFormData>({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    duration_minutes: initialData?.duration_minutes ?? 60,
    start_time: initialData?.start_time ?? "",
    end_time: initialData?.end_time ?? "",
    status: initialData?.status ?? "draft",
  });

  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [bankImports, setBankImports] = useState<BankQuestionPreview[]>([]);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Draw config (session mode) ──
  const [drawEnabled, setDrawEnabled] = useState(false);
  const [drawNMcq, setDrawNMcq] = useState(5);
  const [drawNCoding, setDrawNCoding] = useState(1);
  const [drawSaving, setDrawSaving] = useState(false);
  const [drawSaved, setDrawSaved] = useState(false);
  const [autoPopulateTags, setAutoPopulateTags] = useState("");
  const [autoPopulateDiff, setAutoPopulateDiff] = useState("");
  const [autoPopulating, setAutoPopulating] = useState(false);

  const addMCQ = () =>
    setQuestions((q) => [
      ...q,
      { type: "mcq", statement: "", points: 1, options: LABELS.map((l) => ({ label: l, text: "", is_correct: false })), test_cases: [] },
    ]);

  const addCoding = () =>
    setQuestions((q) => [
      ...q,
      { type: "coding", statement: "", points: 3, options: [], test_cases: [] },
    ]);

  const updateQ = (i: number, patch: Partial<QuestionDraft>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const updateOption = (qi: number, oi: number, patch: Partial<OptionDraft>) =>
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx !== qi ? q : { ...q, options: q.options.map((o, oidx) => (oidx === oi ? { ...o, ...patch } : o)) }
      )
    );

  const addTestCase = (qi: number) =>
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx !== qi ? q : { ...q, test_cases: [...q.test_cases, { input: "", expected_output: "", weight: 1 }] }
      )
    );

  const updateTC = (qi: number, ti: number, patch: Partial<TestCase>) =>
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx !== qi ? q : { ...q, test_cases: q.test_cases.map((tc, tidx) => (tidx === ti ? { ...tc, ...patch } : tc)) }
      )
    );

  const handleBankAdd = (selected: BankQuestionPreview[]) => {
    setBankImports((prev) => {
      const existingIds = new Set(prev.map((q) => q.id));
      return [...prev, ...selected.filter((q) => !existingIds.has(q.id))];
    });
  };

  const handleSaveDrawConfig = async () => {
    if (!examId) return;
    setDrawSaving(true);
    setDrawSaved(false);
    try {
      await api.put(`/admin/exams/${examId}/draw-config`, {
        n_mcq: drawNMcq,
        n_coding: drawNCoding,
      });
      setDrawSaved(true);
    } finally {
      setDrawSaving(false);
    }
  };

  const handleAutoPopulate = async () => {
    if (!examId) return;
    setAutoPopulating(true);
    try {
      const tags = autoPopulateTags.split(",").map((s) => s.trim()).filter(Boolean);
      await api.post(`/admin/exams/${examId}/auto-populate`, {
        tags,
        difficulty: autoPopulateDiff || null,
      });
    } finally {
      setAutoPopulating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let id = examId;
      if (isEdit) {
        await api.put(`/admin/exams/${id}`, form);
      } else {
        const { data } = await api.post<{ id: string }>("/admin/exams", form);
        id = data.id;
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const { data: created } = await api.post<{ id: string }>(`/admin/exams/${id}/questions`, {
          type: q.type,
          order_index: i + 1,
          points: q.points,
          statement: q.statement,
          test_cases: q.type === "coding" ? q.test_cases : undefined,
        });
        if (q.type === "mcq") {
          for (const opt of q.options) {
            await api.post(`/admin/questions/${created.id}/options`, opt);
          }
        }
      }

      if (bankImports.length > 0) {
        await api.post(`/admin/exams/${id}/from-bank`, {
          question_ids: bankImports.map((q) => q.id),
          start_order_index: questions.length + 1,
        });
      }

      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  const totalQuestions = questions.length + bankImports.length;

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Exam metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("exam_form.exam_title")}</label>
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("exam_form.description")}</label>
            <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("exam_form.duration")}</label>
            <input type="number" min={1} className={inputCls} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("exam_form.start_time")}</label>
            <input type="datetime-local" className={inputCls} value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("exam_form.end_time")}</label>
            <input type="datetime-local" className={inputCls} value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
          </div>
        </div>

        {/* Manual questions */}
        {questions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              {t("exam_form.section_manual")} ({questions.length})
            </p>
            <div className="space-y-3">
              {questions.map((q, qi) => (
                <div key={qi} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                      {q.type === "mcq" ? "QCM" : "Code"} — Q{qi + 1}
                    </span>
                    <button type="button" onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qi))} className="text-red-500 text-xs hover:underline">✕</button>
                  </div>
                  <textarea className={inputCls} placeholder={t("exam_form.statement")} rows={3} value={q.statement} onChange={(e) => updateQ(qi, { statement: e.target.value })} />
                  <input type="number" min={0.5} step={0.5} className={`${inputCls} w-28`} placeholder={t("exam_form.points")} value={q.points} onChange={(e) => updateQ(qi, { points: Number(e.target.value) })} />

                  {q.type === "mcq" && q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <span className="font-bold text-gray-400 w-5 text-sm">{opt.label}</span>
                      <input className={inputCls} value={opt.text} placeholder={`Option ${opt.label}`} onChange={(e) => updateOption(qi, oi, { text: e.target.value })} />
                      <label className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400 whitespace-nowrap cursor-pointer">
                        <input type="radio" name={`correct-${qi}`} checked={opt.is_correct} onChange={() =>
                          setQuestions((qs) => qs.map((q2, i) => i !== qi ? q2 : { ...q2, options: q2.options.map((o, j) => ({ ...o, is_correct: j === oi })) }))
                        } />
                        {t("exam_form.mark_correct")}
                      </label>
                    </div>
                  ))}

                  {q.type === "coding" && (
                    <div className="space-y-2">
                      {q.test_cases.map((tc, ti) => (
                        <div key={ti} className="grid grid-cols-3 gap-2">
                          <input className={inputCls} placeholder={t("exam_form.input")} value={tc.input} onChange={(e) => updateTC(qi, ti, { input: e.target.value })} />
                          <input className={inputCls} placeholder={t("exam_form.expected_output")} value={tc.expected_output} onChange={(e) => updateTC(qi, ti, { expected_output: e.target.value })} />
                          <input type="number" step={0.1} min={0.1} className={inputCls} placeholder={t("exam_form.weight")} value={tc.weight} onChange={(e) => updateTC(qi, ti, { weight: Number(e.target.value) })} />
                        </div>
                      ))}
                      <button type="button" onClick={() => addTestCase(qi)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                        + {t("exam_form.add_test_case")}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bank imports */}
        {bankImports.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              {t("exam_form.section_bank")} ({bankImports.length})
            </p>
            <div className="space-y-2">
              {bankImports.map((q, i) => (
                <div key={q.id} className="flex items-start gap-3 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3 bg-indigo-50 dark:bg-indigo-950">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-xs font-bold text-indigo-500">Q{questions.length + i + 1}</span>
                      <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                        {q.type === "mcq" ? "QCM" : "Code"}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[q.difficulty]}`}>
                        {t(`bank.difficulty_${q.difficulty}`)}
                      </span>
                      <span className="text-xs text-gray-400">{q.points} pt{q.points > 1 ? "s" : ""}</span>
                      {q.tags.map((tag) => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">{tag}</span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">{q.statement}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBankImports((prev) => prev.filter((_, j) => j !== i))}
                    className="text-gray-400 hover:text-red-500 text-sm flex-shrink-0 transition-colors"
                    title={t("exam_form.bank_remove")}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add buttons */}
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={addMCQ} className="px-4 py-2 border-2 border-dashed border-indigo-300 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
            + {t("exam_form.add_mcq")}
          </button>
          <button type="button" onClick={addCoding} className="px-4 py-2 border-2 border-dashed border-green-400 text-green-600 dark:text-green-400 rounded-lg text-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
            + {t("exam_form.add_coding")}
          </button>
          <button
            type="button"
            onClick={() => setShowBankPicker(true)}
            className="px-4 py-2 border-2 border-dashed border-purple-400 text-purple-600 dark:text-purple-400 rounded-lg text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {t("exam_form.section_bank")}
          </button>
        </div>

        {totalQuestions > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {totalQuestions} question{totalQuestions > 1 ? "s" : ""} — {questions.length} manuelle{questions.length > 1 ? "s" : ""}, {bankImports.length} banque
          </p>
        )}

        {/* ── Random draw (session mode) — only available when editing a saved exam ── */}
        {isEdit && (
          <div className="border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 bg-indigo-50/40 dark:bg-indigo-950/20">
            <div className="flex items-center gap-3 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={drawEnabled}
                  onChange={(e) => setDrawEnabled(e.target.checked)}
                  className="rounded accent-indigo-600 w-4 h-4"
                />
                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  {t("draw.section_title")}
                </span>
              </label>
            </div>
            {drawEnabled && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("draw.section_hint")}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("draw.n_mcq")}</label>
                    <input
                      type="number"
                      min={0}
                      value={drawNMcq}
                      onChange={(e) => { setDrawNMcq(Number(e.target.value)); setDrawSaved(false); }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("draw.n_coding")}</label>
                    <input
                      type="number"
                      min={0}
                      value={drawNCoding}
                      onChange={(e) => { setDrawNCoding(Number(e.target.value)); setDrawSaved(false); }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={drawSaving}
                    onClick={handleSaveDrawConfig}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-medium transition-colors"
                  >
                    {drawSaving ? t("draw.saving") : t("draw.save_config")}
                  </button>
                  {drawSaved && <span className="text-xs text-green-600 dark:text-green-400">{t("draw.saved")}</span>}
                </div>

                {/* Auto-populate pool */}
                <div className="border-t border-indigo-200 dark:border-indigo-800 pt-3">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">{t("draw.auto_populate_title")}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t("draw.auto_populate_hint")}</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("draw.auto_populate_tags")}</label>
                      <input
                        type="text"
                        value={autoPopulateTags}
                        onChange={(e) => setAutoPopulateTags(e.target.value)}
                        placeholder="python, algorithm..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("draw.auto_populate_difficulty")}</label>
                      <select
                        value={autoPopulateDiff}
                        onChange={(e) => setAutoPopulateDiff(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">{t("draw.auto_populate_any_difficulty")}</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="expert">Expert</option>
                        <option value="culture">Culture</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={autoPopulating}
                    onClick={handleAutoPopulate}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-xs font-medium transition-colors"
                  >
                    {autoPopulating ? "…" : t("draw.auto_populate_run")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button type="button" onClick={onCancel} className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            {t("exam_form.cancel")}
          </button>
          <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium transition-colors">
            {saving ? "..." : t("exam_form.save")}
          </button>
        </div>
      </form>

      {showBankPicker && (
        <BankPicker onAdd={handleBankAdd} onClose={() => setShowBankPicker(false)} />
      )}
    </>
  );
}
