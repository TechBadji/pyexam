import { useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api/axios";

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
  const [saving, setSaving] = useState(false);

  const addMCQ = () =>
    setQuestions((q) => [
      ...q,
      {
        type: "mcq",
        statement: "",
        points: 1,
        options: LABELS.map((l) => ({ label: l, text: "", is_correct: false })),
        test_cases: [],
      },
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
        idx !== qi
          ? q
          : {
              ...q,
              options: q.options.map((o, oidx) =>
                oidx === oi ? { ...o, ...patch } : o
              ),
            }
      )
    );

  const addTestCase = (qi: number) =>
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx !== qi
          ? q
          : { ...q, test_cases: [...q.test_cases, { input: "", expected_output: "", weight: 1 }] }
      )
    );

  const updateTC = (qi: number, ti: number, patch: Partial<TestCase>) =>
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx !== qi
          ? q
          : {
              ...q,
              test_cases: q.test_cases.map((tc, tidx) =>
                tidx === ti ? { ...tc, ...patch } : tc
              ),
            }
      )
    );

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
        const { data: created } = await api.post<{ id: string }>(
          `/admin/exams/${id}/questions`,
          {
            type: q.type,
            order_index: i + 1,
            points: q.points,
            statement: q.statement,
            test_cases: q.type === "coding" ? q.test_cases : undefined,
          }
        );
        if (q.type === "mcq") {
          for (const opt of q.options) {
            await api.post(`/admin/questions/${created.id}/options`, opt);
          }
        }
      }
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("exam_form.exam_title")}
          </label>
          <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("exam_form.description")}
          </label>
          <textarea className={inputCls} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("exam_form.duration")}
          </label>
          <input type="number" min={1} className={inputCls} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("exam_form.start_time")}
          </label>
          <input type="datetime-local" className={inputCls} value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("exam_form.end_time")}
          </label>
          <input type="datetime-local" className={inputCls} value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={qi} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">
                {q.type === "mcq" ? "QCM" : "Code"} — Q{qi + 1}
              </span>
              <button type="button" onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qi))} className="text-red-500 text-xs hover:underline">✕</button>
            </div>
            <textarea
              className={inputCls}
              placeholder={t("exam_form.statement")}
              rows={3}
              value={q.statement}
              onChange={(e) => updateQ(qi, { statement: e.target.value })}
            />
            <input
              type="number" min={0.5} step={0.5}
              className={`${inputCls} w-32`}
              placeholder={t("exam_form.points")}
              value={q.points}
              onChange={(e) => updateQ(qi, { points: Number(e.target.value) })}
            />
            {q.type === "mcq" && q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <span className="font-bold text-gray-500 w-5">{opt.label}</span>
                <input className={inputCls} value={opt.text} placeholder={`Option ${opt.label}`} onChange={(e) => updateOption(qi, oi, { text: e.target.value })} />
                <label className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400 whitespace-nowrap cursor-pointer">
                  <input type="radio" name={`correct-${qi}`} checked={opt.is_correct} onChange={() =>
                    setQuestions((qs) =>
                      qs.map((q2, i) => i !== qi ? q2 : {
                        ...q2,
                        options: q2.options.map((o, j) => ({ ...o, is_correct: j === oi })),
                      })
                    )
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
                <button type="button" onClick={() => addTestCase(qi)} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                  + {t("exam_form.add_test_case")}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <button type="button" onClick={addMCQ} className="px-4 py-2 border-2 border-dashed border-brand-400 text-brand-600 dark:text-brand-400 rounded-lg text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
          + {t("exam_form.add_mcq")}
        </button>
        <button type="button" onClick={addCoding} className="px-4 py-2 border-2 border-dashed border-green-400 text-green-600 dark:text-green-400 rounded-lg text-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
          + {t("exam_form.add_coding")}
        </button>
      </div>

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button type="button" onClick={onCancel} className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          Annuler
        </button>
        <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-sm font-medium transition-colors">
          {saving ? "..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
