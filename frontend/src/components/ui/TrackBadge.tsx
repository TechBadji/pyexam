import { TRACKS, trackOf } from "../../lib/tracks";

export default function TrackBadge({
  track,
  size = "sm",
}: {
  track: string | null | undefined;
  size?: "sm" | "md";
}) {
  const id = trackOf(track);
  const meta = TRACKS[id];
  const scale = size === "md" ? "text-xs px-2.5 py-1" : "text-[11px] px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${scale} ${meta.chip}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {meta.short}
    </span>
  );
}
