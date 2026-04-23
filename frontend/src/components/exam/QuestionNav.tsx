import { useTranslation } from "react-i18next";
import type { Question } from "../../store/examStore";

interface QuestionNavProps {
  questions: Question[];
  currentIndex: number;
  answeredIds: Set<string>;
  onSelect: (index: number) => void;
}

export default function QuestionNav({
  questions,
  currentIndex,
  answeredIds,
  onSelect,
}: QuestionNavProps) {
  const { t } = useTranslation("exam");

  return (
    <aside className="w-full md:w-48 shrink-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
        {t("interface.question_nav_title")}
      </p>
      <div className="flex flex-row md:flex-col gap-2 flex-wrap">
        {questions.map((q, i) => {
          const answered = answeredIds.has(q.id);
          const current = i === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => onSelect(i)}
              className={`w-9 h-9 rounded-lg text-sm font-semibold border-2 transition-all ${
                current
                  ? "border-brand-600 bg-brand-600 text-white scale-110"
                  : answered
                  ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200"
                  : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-brand-400"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 space-y-1 hidden md:block">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border-2 border-green-500 bg-green-50 inline-block" />
          <span>{answeredIds.size} répondues</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border-2 border-gray-200 dark:border-gray-600 inline-block" />
          <span>{questions.length - answeredIds.size} restantes</span>
        </div>
      </div>
    </aside>
  );
}
