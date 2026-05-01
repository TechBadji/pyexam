import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api/axios";
import type { Question } from "../../store/examStore";

interface CodingQuestionProps {
  question: Question;
  initialCode: string | undefined;
  readOnly: boolean;
  onCodeChange: (code: string) => void;
}

interface RunResult {
  stdout: string;
  stderr: string;
  exit_code: number;
}

const DEBOUNCE_MS = 800;
const AUTO_SAVE_MS = 30_000;
const DARK_KEY = "pyexam_theme";

export default function CodingQuestion({
  question,
  initialCode,
  readOnly,
  onCodeChange,
}: CodingQuestionProps) {
  const { t } = useTranslation("exam");
  const draftKey = `draft_${question.id}`;

  const [code, setCode] = useState<string>(() => {
    if (initialCode) return initialCode;
    return localStorage.getItem(draftKey) ?? "";
  });
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dark = localStorage.getItem(DARK_KEY) !== "light";

  useEffect(() => {
    if (!readOnly) {
      autoSaveRef.current = setInterval(() => {
        localStorage.setItem(draftKey, code);
        triggerSave(code);
      }, AUTO_SAVE_MS);
    }
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [code, readOnly]);

  const triggerSave = (value: string) => {
    setSaveStatus("saving");
    onCodeChange(value);
    setTimeout(() => setSaveStatus("saved"), 800);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (readOnly) return;
    const v = value ?? "";
    setCode(v);
    localStorage.setItem(draftKey, v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => triggerSave(v), DEBOUNCE_MS);
  };

  const runCode = async () => {
    setRunning(true);
    setOutput(null);
    try {
      const { data } = await api.post<RunResult>("/code/run", {
        code,
        stdin,
      });
      setOutput(data);
    } catch {
      setOutput({ stdout: "", stderr: "Erreur d'exécution.", exit_code: -1 });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-base font-medium text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
        {question.statement}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {question.points} pt{question.points > 1 ? "s" : ""}
      </p>

      <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
        <Editor
          height="320px"
          language="python"
          value={code}
          onChange={handleEditorChange}
          theme={dark ? "vs-dark" : "light"}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            readOnly,
            wordWrap: "on",
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>

      {!readOnly && (
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            {t("interface.stdin_label")}
            <span className="ml-1 font-normal text-gray-400 dark:text-gray-500">{t("interface.stdin_hint")}</span>
          </label>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder={t("interface.stdin_placeholder")}
            rows={3}
            className="w-full font-mono text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
            spellCheck={false}
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        {!readOnly && (
          <button
            onClick={runCode}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {running ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {t("interface.run_code")}
              </>
            ) : (
              <>▶ {t("interface.run_code")}</>
            )}
          </button>
        )}
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
          {saveStatus === "saving" && t("interface.saving")}
          {saveStatus === "saved" && (
            <span className="text-green-500">✓ {t("interface.saved")}</span>
          )}
        </span>
      </div>

      {output && (
        <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 text-sm font-mono">
          <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">
            {t("interface.output")} (exit: {output.exit_code})
          </p>
          {output.stdout && (
            <pre className="text-green-400 whitespace-pre-wrap break-all">{output.stdout}</pre>
          )}
          {output.stderr && (
            <pre className="text-red-400 whitespace-pre-wrap break-all">{output.stderr}</pre>
          )}
          {!output.stdout && !output.stderr && (
            <span className="text-gray-500">(no output)</span>
          )}
        </div>
      )}
    </div>
  );
}
