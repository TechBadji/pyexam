import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore, type AuthUser } from "../../store/authStore";
import DarkModeToggle from "./DarkModeToggle";
import LanguageSwitcher from "./LanguageSwitcher";

function UserAvatar({ user, size = 32 }: { user: AuthUser; size?: number }) {
  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.full_name}
        className="rounded-full object-cover ring-2 ring-brand-200 dark:ring-brand-700"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const palette = ["bg-indigo-500", "bg-violet-500", "bg-pink-500", "bg-teal-500", "bg-amber-500"];
  const color = palette[user.full_name.charCodeAt(0) % palette.length];
  return (
    <div
      className={`${color} rounded-full flex items-center justify-center text-white font-semibold select-none`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

export default function Navbar() {
  const { t } = useTranslation("common");
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-brand-600 dark:text-brand-400 text-lg"
          >
            PyExam
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
              {user.role === "admin" ? (
                <Link to="/admin" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  {t("nav.admin")}
                </Link>
              ) : (
                <Link to="/dashboard" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  {t("nav.dashboard")}
                </Link>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <DarkModeToggle />

            {user && (
              <div ref={menuRef} className="relative ml-2 pl-3 border-l border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
                >
                  <UserAvatar user={user} size={32} />
                  <span className="hidden sm:block text-sm text-gray-700 dark:text-gray-300 max-w-[120px] truncate">
                    {user.full_name}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {t("nav.profile")}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      {t("buttons.logout")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
