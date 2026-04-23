import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function OfflineBanner() {
  const { t } = useTranslation("exam");
  const [online, setOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 4000);
    };
    const handleOffline = () => {
      setOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online && !showReconnected) return null;

  return (
    <div
      className={`fixed top-14 left-0 right-0 z-40 text-center text-sm py-2 px-4 font-medium transition-colors ${
        online
          ? "bg-green-500 text-white"
          : "bg-amber-500 text-white"
      }`}
    >
      {online
        ? t("interface.reconnected_banner")
        : t("interface.offline_banner")}
    </div>
  );
}
