import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api/axios";

export interface BankQuestionPreview {
  id: string;
  type: "mcq" | "coding";
  difficulty: "beginner" | "intermediate" | "expert" | "culture";
  tags: string[];
  statement: string;
  points: number;
  options?: { label: string; text: string; is_correct: boolean }[];
}

interface Props {
  onAdd: (questions: BankQuestionPreview[]) => void;
  onClose: () => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200",
  intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  expert: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
  culture: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200",
};

export default function BankPicker({ onAdd, onClose }: Props) {
  const { t } = useTranslation("admin");

  const [questions, setQuestions] = useState<BankQuestionPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [randomCount, setRandomCount] = useState(5);

  const [filterType, setFilterType] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.append("type", filterType);
    if (filterDifficulty) params.append("difficulty", filterDifficulty);
    if (filterTag.trim()) params.append("tag", filterTag.trim());
    if (filterSearch.trim()) params.append("search", filterSearch.trim());

    api
      .get<BankQuestionPreview[]>(`/admin/bank/questions?${params}`)
      .then(({ data }) => setQuestions(data))
      .finally(() => setLoading(false));
  }, [filterType, filterDifficulty, filterTag, filterSearch]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const pickRandom = () => {
    const ids = questions.map((q) => q.id);
    const shuffled = [...ids].sort(() => Math.random() - 0.5);
    setSelected(new Set(shuffled.slice(0, randomCount)));
  };

  const handleAdd = () => {
    const toAdd = questions.filter((q) => selected.has(q.id));
    onAdd(toAdd);
    onClose();
  };

  const difficultyLabel = (d: string) => t(`bank.difficulty_${d}`);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t("bank.picker_title")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">✕</button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{t("bank.all_types")}</option>
            <option value="mcq">{t("bank.type_mcq")}</option>
            <option value="coding">{t("bank.type_coding")}</option>
          </select>

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{t("bank.all_difficulties")}</option>
            <option value="beginner">{t("bank.difficulty_beginner")}</option>
            <option value="intermediate">{t("bank.difficulty_intermediate")}</option>
            <option value="expert">{t("bank.difficulty_expert")}</option>
            <option value="culture">{t("bank.difficulty_culture")}</option>
          </select>

          <input
            type="text"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            placeholder={t("bank.filter_tag")}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <input
            type="text"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            placeholder={t("bank.search_placeholder")}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Question list */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
          {loading && (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && questions.length === 0 && (
            <p className="text-center py-10 text-sm text-gray-400">{t("bank.no_results")}</p>
          )}
          {!loading && questions.map((q) => (
            <label
              key={q.id}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                selected.has(q.id)
                  ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-500"
                  : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(q.id)}
                onChange={() => toggle(q.id)}
                className="mt-0.5 accent-indigo-600 w-4 h-4 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                    {q.type === "mcq" ? t("bank.type_mcq") : t("bank.type_coding")}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[q.difficulty]}`}>
                    {difficultyLabel(q.difficulty)}
                  </span>
                  <span className="text-xs text-gray-400">{q.points} pt{q.points > 1 ? "s" : ""}</span>
                  {q.tags.map((tag) => (
                    <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">{q.statement}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-3">
          {/* Random picker */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={questions.length || 1}
              value={randomCount}
              onChange={(e) => setRandomCount(Number(e.target.value))}
              className="w-16 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={pickRandom}
              className="px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
            >
              🎲 {t("bank.picker_random")}
            </button>
          </div>

          <div className="flex-1" />

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t("bank.picker_close")}
          </button>
          <button
            type="button"
            disabled={selected.size === 0}
            onClick={handleAdd}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium transition-colors"
          >
            {t("bank.picker_add", { count: selected.size })}
          </button>
        </div>
      </div>
    </div>
  );
}
