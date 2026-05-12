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
  allowed_groups: string | null;
  grade_scale: string;
  passing_threshold: string;
}

interface ExamFormProps {
  initialData?: Partial<ExamFormData & { allowed_groups?: string[] | null; grade_scale?: number | null; passing_threshold?: number | null }>;
  initialDrawConfig?: { n_mcq: number; n_coding: number } | null;
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

export default function ExamForm({ initialData, initialDrawConfig, examId, onSuccess, onCancel }: ExamFormProps) {
  const { t } = useTranslation("admin");
  const isEdit = !!examId;

  const [form, setForm] = useState<ExamFormData>({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    duration_minutes: initialData?.duration_minutes ?? 60,
    start_time: initialData?.start_time ?? "",
    end_time: initialData?.end_time ?? "",
    status: initialData?.status ?? "draft",
    allowed_groups: initialData?.allowed_groups ? initialData.allowed_groups.join(", ") : null,
    grade_scale: initialData?.grade_scale != null ? String(initialData.grade_scale) : "",
    passing_threshold: initialData?.passing_threshold != null ? String(initialData.passing_threshold) : "",
  });

  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [bankImports, setBankImports] = useState<BankQuestionPreview[]>([]);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Type d'examen ──
  const [examType, setExamType] = useState<"standard" | "session">(
    initialDrawConfig ? "session" : "standard"
  );
  const [drawNMcq, setDrawNMcq] = useState(initialDrawConfig?.n_mcq ?? 5);
  const [drawNCoding, setDrawNCoding] = useState(initialDrawConfig?.n_coding ?? 1);
  const [autoPopulateTags, setAutoPopulateTags] = useState("");
  const [autoPopulateDiff, setAutoPopulateDiff] = useState("");
  const [autoPopulating, setAutoPopulating] = useState(false);
  const [autoPopulateResult, setAutoPopulateResult] = useState<string | null>(null);

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

  const handleAutoPopulate = async (id: string) => {
    setAutoPopulating(true);
    setAutoPopulateResult(null);
    try {
      const tags = autoPopulateTags.split(",").map((s) => s.trim()).filter(Boolean);
      const { data } = await api.post<{ added: number; total: number }>(`/admin/exams/${id}/auto-populate`, {
        tags,
        difficulty: autoPopulateDiff || null,
      });
      setAutoPopulateResult(t("draw.auto_populate_success", { added: data.added, total: data.total }));
    } finally {
      setAutoPopulating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    // Client-side date validation
    if (form.start_time && form.end_time && form.start_time >= form.end_time) {
      setSaveError(t("exam_form.error_dates"));
      return;
    }

    setSaving(true);
    try {
      const allowedGroups = form.allowed_groups
        ? form.allowed_groups.split(",").map((s) => s.trim()).filter(Boolean)
        : null;
      const payload = {
        ...form,
        allowed_groups: allowedGroups?.length ? allowedGroups : null,
        grade_scale: form.grade_scale ? parseFloat(form.grade_scale) : null,
        passing_threshold: form.passing_threshold ? parseFloat(form.passing_threshold) : null,
      };

      let id = examId;
      if (isEdit) {
        await api.put(`/admin/exams/${id}`, payload);
      } else {
        const { data } = await api.post<{ id: string }>("/admin/exams", payload);
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

      // Save draw config if session mode
      if (examType === "session") {
        await api.put(`/admin/exams/${id}/draw-config`, {
          n_mcq: drawNMcq,
          n_coding: drawNCoding,
        });
      }

      onSuccess();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setSaveError(detail.map((d: { msg?: string }) => d.msg).join(" · "));
      } else if (typeof detail === "string") {
        setSaveError(detail);
      } else {
        setSaveError(t("exam_form.error_generic"));
      }
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

        {/* ── Type d'examen ─────────────────────────────────────────────────── */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {t("exam_form.type_label")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Carte Examen standard */}
            <button
              type="button"
              onClick={() => setExamType("standard")}
              className={`relative text-left rounded-xl border-2 p-4 transition-all ${
                examType === "standard"
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                  : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
              }`}
            >
              {examType === "standard" && (
                <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </span>
              )}
              <div className="flex items-center gap-2 mb-1.5">
                <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("exam_form.type_standard")}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {t("exam_form.type_standard_desc")}
              </p>
            </button>

            {/* Carte Session */}
            <button
              type="button"
              onClick={() => setExamType("session")}
              className={`relative text-left rounded-xl border-2 p-4 transition-all ${
                examType === "session"
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-950/40"
                  : "border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700"
              }`}
            >
              {examType === "session" && (
                <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </span>
              )}
              <div className="flex items-center gap-2 mb-1.5">
                <svg className="w-4 h-4 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h8m-8 4h4" />
                </svg>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("exam_form.type_session")}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {t("exam_form.type_session_desc")}
              </p>
            </button>
          </div>
        </div>

        {/* ── Métadonnées ───────────────────────────────────────────────────── */}
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
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("exam_form.allowed_groups")}</label>
            <input
              type="text"
              className={inputCls}
              value={form.allowed_groups ?? ""}
              onChange={(e) => setForm({ ...form, allowed_groups: e.target.value || null })}
              placeholder={t("exam_form.allowed_groups_placeholder")}
            />
          </div>
        </div>

        {/* ── Notation ──────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("exam_form.grading_title")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("exam_form.grade_scale")}</label>
              <input
                type="number"
                min={1}
                step={1}
                className={inputCls}
                value={form.grade_scale}
                onChange={(e) => setForm({ ...form, grade_scale: e.target.value })}
                placeholder={t("exam_form.grade_scale_placeholder")}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("exam_form.passing_threshold")}</label>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                className={inputCls}
                value={form.passing_threshold}
                onChange={(e) => setForm({ ...form, passing_threshold: e.target.value })}
                placeholder={t("exam_form.passing_threshold_placeholder")}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">{t("exam_form.grading_hint")}</p>
        </div>

        {/* ── Config tirage (Session uniquement) ────────────────────────────── */}
        {examType === "session" && (
          <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/40 dark:bg-violet-950/20 p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300 mb-0.5">
                {t("draw.config_title")}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("draw.config_hint")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t("draw.n_mcq")}
                </label>
                <input
                  type="number"
                  min={0}
                  value={drawNMcq}
                  onChange={(e) => setDrawNMcq(Number(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t("draw.n_coding")}
                </label>
                <input
                  type="number"
                  min={0}
                  value={drawNCoding}
                  onChange={(e) => setDrawNCoding(Number(e.target.value))}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Auto-populate depuis la banque */}
            <div className="border-t border-violet-200 dark:border-violet-800 pt-4 space-y-3">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                {t("draw.auto_populate_title")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t("draw.auto_populate_tags")}
                  </label>
                  <input
                    type="text"
                    value={autoPopulateTags}
                    onChange={(e) => setAutoPopulateTags(e.target.value)}
                    placeholder="python, algorithme..."
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {t("draw.auto_populate_difficulty")}
                  </label>
                  <select
                    value={autoPopulateDiff}
                    onChange={(e) => setAutoPopulateDiff(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">{t("draw.auto_populate_any_difficulty")}</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                    <option value="culture">Culture</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={autoPopulating || !isEdit}
                  onClick={() => examId && handleAutoPopulate(examId)}
                  className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                  title={!isEdit ? t("draw.auto_populate_save_first") : undefined}
                >
                  {autoPopulating ? "…" : t("draw.auto_populate_run")}
                </button>
                {!isEdit && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                    {t("draw.auto_populate_save_first")}
                  </span>
                )}
                {autoPopulateResult && (
                  <span className="text-xs text-green-600 dark:text-green-400">{autoPopulateResult}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Questions manuelles ───────────────────────────────────────────── */}
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
                      <p className="text-xs text-amber-600 dark:text-amber-400">{t("exam_form.stdin_hint")}</p>
                      {q.test_cases.map((tc, ti) => (
                        <div key={ti} className="grid grid-cols-3 gap-2 items-start">
                          <textarea rows={2} className={`${inputCls} font-mono text-xs resize-y`} placeholder={t("exam_form.input")} value={tc.input} onChange={(e) => updateTC(qi, ti, { input: e.target.value })} />
                          <textarea rows={2} className={`${inputCls} font-mono text-xs resize-y`} placeholder={t("exam_form.expected_output")} value={tc.expected_output} onChange={(e) => updateTC(qi, ti, { expected_output: e.target.value })} />
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

        {/* ── Questions banque ──────────────────────────────────────────────── */}
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

        {/* ── Boutons d'ajout ───────────────────────────────────────────────── */}
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

        {/* ── Error banner ──────────────────────────────────────────────────── */}
        {saveError && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {saveError}
          </div>
        )}

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button type="button" onClick={onCancel} className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            {t("exam_form.cancel")}
          </button>
          <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium transition-colors">
            {saving ? "…" : t("exam_form.save")}
          </button>
        </div>
      </form>

      {showBankPicker && (
        <BankPicker onAdd={handleBankAdd} onClose={() => setShowBankPicker(false)} />
      )}
    </>
  );
}
