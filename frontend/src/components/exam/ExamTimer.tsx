import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface ExamTimerProps {
  durationMinutes: number;
  startedAt: Date;
  onExpire: () => void;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function ExamTimer({ durationMinutes, startedAt, onExpire }: ExamTimerProps) {
  const { t } = useTranslation("exam");
  const totalSeconds = durationMinutes * 60;
  const warned30 = useRef(false);
  const warned15 = useRef(false);
  const warned5 = useRef(false);
  const expired = useRef(false);

  const getRemaining = () => {
    const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    return Math.max(0, totalSeconds - elapsed);
  };

  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      const rem = getRemaining();
      setRemaining(rem);

      if (!warned30.current && rem <= 30 * 60 && rem > 29 * 60) {
        warned30.current = true;
        toast(t("timer.warning_30"), { icon: "⏰" });
      }
      if (!warned15.current && rem <= 15 * 60 && rem > 14 * 60) {
        warned15.current = true;
        toast(t("timer.warning_15"), { icon: "⚠️" });
      }
      if (!warned5.current && rem <= 5 * 60 && rem > 4 * 60) {
        warned5.current = true;
        toast(t("timer.warning_5"), { icon: "🔴", duration: 6000 });
      }
      if (!expired.current && rem === 0) {
        expired.current = true;
        toast(t("timer.expired"), { icon: "🛑", duration: 8000 });
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, totalSeconds]);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const urgency =
    remaining <= 5 * 60
      ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700"
      : remaining <= 10 * 60
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700"
      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600";

  return (
    <div className={`flex items-center gap-2 border rounded-lg px-4 py-2 font-mono text-lg font-bold ${urgency}`}>
      <span className="text-xs font-normal mr-1 hidden sm:inline">
        {t("interface.time_remaining")}
      </span>
      <span>
        {hours > 0 && `${pad(hours)}:`}
        {pad(minutes)}:{pad(seconds)}
      </span>
    </div>
  );
}
