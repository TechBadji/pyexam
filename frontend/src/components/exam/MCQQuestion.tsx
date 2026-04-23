import { useEffect, useRef } from "react";
import type { MCQOption, Question } from "../../store/examStore";

interface MCQQuestionProps {
  question: Question;
  selectedOptionId: string | undefined;
  readOnly: boolean;
  onAnswer: (optionId: string) => void;
}

const DEBOUNCE_MS = 800;

export default function MCQQuestion({
  question,
  selectedOptionId,
  readOnly,
  onAnswer,
}: MCQQuestionProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (option: MCQOption) => {
    if (readOnly) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onAnswer(option.id), DEBOUNCE_MS);
  };

  return (
    <div className="space-y-3">
      <p className="text-base font-medium text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
        {question.statement}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {question.points} pt{question.points > 1 ? "s" : ""}
      </p>
      <div className="space-y-2 mt-4">
        {question.options.map((option) => {
          const checked = selectedOptionId === option.id;
          return (
            <label
              key={option.id}
              onPaste={(e) => e.preventDefault()}
              className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                readOnly ? "cursor-not-allowed opacity-80" : "cursor-pointer"
              } ${
                checked
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30 dark:border-brand-400"
                  : "border-gray-200 dark:border-gray-600 hover:border-brand-300 dark:hover:border-brand-600 bg-white dark:bg-gray-800"
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option.id}
                checked={checked}
                disabled={readOnly}
                onChange={() => handleChange(option)}
                className="mt-0.5 accent-brand-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-200">
                <span className="font-semibold mr-2">{option.label}.</span>
                {option.text}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
