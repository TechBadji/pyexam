import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/ui/Navbar";
import { TRACKS, TRACK_IDS, type TrackId } from "../lib/tracks";

interface Banner {
  id: string;
  text: string;
  link_url: string | null;
  image_url: string | null;
  module: TrackId | null;
  is_active: boolean;
  order_index: number;
  starts_at: string | null;
  ends_at: string | null;
}

interface Draft {
  text: string;
  link_url: string;
  image_url: string;
  module: string;
  is_active: boolean;
  order_index: number;
  starts_at: string;
  ends_at: string;
}

const emptyDraft = (): Draft => ({
  text: "",
  link_url: "",
  image_url: "",
  module: "",
  is_active: true,
  order_index: 0,
  starts_at: "",
  ends_at: "",
});

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api
      .get<Banner[]>("/admin/banners")
      .then(({ data }) => setBanners(data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startEdit = (b: Banner) => {
    setEditingId(b.id);
    setDraft({
      text: b.text,
      link_url: b.link_url ?? "",
      image_url: b.image_url ?? "",
      module: b.module ?? "",
      is_active: b.is_active,
      order_index: b.order_index,
      starts_at: b.starts_at ? b.starts_at.slice(0, 16) : "",
      ends_at: b.ends_at ? b.ends_at.slice(0, 16) : "",
    });
  };

  const cancel = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        text: draft.text.trim(),
        link_url: draft.link_url.trim() || null,
        image_url: draft.image_url.trim() || null,
        module: draft.module || null,
        is_active: draft.is_active,
        order_index: Number(draft.order_index) || 0,
        starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
        ends_at: draft.ends_at ? new Date(draft.ends_at).toISOString() : null,
      };
      if (editingId) await api.put(`/admin/banners/${editingId}`, payload);
      else await api.post("/admin/banners", payload);
      cancel();
      load();
    } catch {
      setError("Échec de l'enregistrement du bandeau.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (b: Banner) => {
    setBanners((rows) => rows.map((r) => (r.id === b.id ? { ...r, is_active: !r.is_active } : r)));
    await api
      .put(`/admin/banners/${b.id}`, {
        text: b.text,
        link_url: b.link_url,
        image_url: b.image_url,
        module: b.module,
        is_active: !b.is_active,
        order_index: b.order_index,
        starts_at: b.starts_at,
        ends_at: b.ends_at,
      })
      .catch(load);
  };

  const remove = async (b: Banner) => {
    if (!window.confirm(`Supprimer le bandeau « ${b.text} » ?`)) return;
    await api.delete(`/admin/banners/${b.id}`);
    load();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/admin" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
          ← Administration
        </Link>

        <h1 className="mt-3 font-display text-2xl font-semibold text-gray-900 dark:text-white">
          Bandeaux publicitaires
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Affichés en haut de l'écran des étudiants. Plusieurs bandeaux actifs défilent
          l'un après l'autre.
        </p>

        <form
          onSubmit={save}
          className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4"
        >
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {editingId ? "Modifier le bandeau" : "Nouveau bandeau"}
          </p>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Texte <span className="text-gray-400">— court, il doit tenir sur une ligne</span>
            </label>
            <input
              className={inputCls}
              maxLength={200}
              value={draft.text}
              onChange={(e) => setDraft({ ...draft, text: e.target.value })}
              placeholder="Ex. Session PSM I du 15 octobre — inscriptions ouvertes"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Lien (optionnel)
              </label>
              <input
                className={inputCls}
                value={draft.link_url}
                onChange={(e) => setDraft({ ...draft, link_url: e.target.value })}
                placeholder="https://…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Image (optionnel)
              </label>
              <input
                className={inputCls}
                value={draft.image_url}
                onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                placeholder="https://…/logo.png"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Module ciblé
              </label>
              <select
                className={inputCls}
                value={draft.module}
                onChange={(e) => setDraft({ ...draft, module: e.target.value })}
              >
                <option value="">Tous les étudiants</option>
                {TRACK_IDS.map((id) => (
                  <option key={id} value={id}>
                    {TRACKS[id].short}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Début (optionnel)
              </label>
              <input
                type="datetime-local"
                className={inputCls}
                value={draft.starts_at}
                onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Fin (optionnel)
              </label>
              <input
                type="datetime-local"
                className={inputCls}
                value={draft.ends_at}
                onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                className="accent-brand-600"
                checked={draft.is_active}
                onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
              />
              Actif
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              Ordre
              <input
                type="number"
                className="w-20 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                value={draft.order_index}
                onChange={(e) => setDraft({ ...draft, order_index: Number(e.target.value) })}
              />
            </label>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold"
            >
              {saving ? "…" : editingId ? "Enregistrer" : "Ajouter"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancel}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Annuler
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 space-y-2">
          {loading ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : banners.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucun bandeau. La barre du haut reste vide côté étudiant.
            </p>
          ) : (
            banners.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
              >
                <span className="text-xs text-gray-400 w-6 shrink-0">{b.order_index}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{b.text}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {b.module ? TRACKS[b.module].short : "Tous"}
                    {b.link_url ? ` · ${b.link_url}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => toggle(b)}
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${
                    b.is_active
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {b.is_active ? "Actif" : "Inactif"}
                </button>
                <button
                  onClick={() => startEdit(b)}
                  className="text-xs text-brand-600 dark:text-brand-400 hover:underline shrink-0"
                >
                  Modifier
                </button>
                <button
                  onClick={() => remove(b)}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline shrink-0"
                >
                  Supprimer
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
