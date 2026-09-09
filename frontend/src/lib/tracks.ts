export type TrackId = "python" | "c" | "algo" | "psm1";

export const TRACK_IDS: TrackId[] = ["python", "c", "algo", "psm1"];

interface TrackStyle {
  short: string;
  hex: string;
  hexDark: string;
  chip: string;
  coding: boolean;
  format: "mcq" | "coding" | "mixed";
}

export const TRACKS: Record<TrackId, TrackStyle> = {
  python: {
    short: "Python",
    hex: "#0f6e5c",
    hexDark: "#34c6a8",
    chip: "bg-track-python/10 text-track-python ring-1 ring-track-python/25 dark:bg-track-python-lite/10 dark:text-track-python-lite dark:ring-track-python-lite/25",
    coding: true,
    format: "mixed",
  },
  c: {
    short: "C",
    hex: "#2b4c9b",
    hexDark: "#7fa3e8",
    chip: "bg-track-c/10 text-track-c ring-1 ring-track-c/25 dark:bg-track-c-lite/10 dark:text-track-c-lite dark:ring-track-c-lite/25",
    coding: true,
    format: "mixed",
  },
  algo: {
    short: "Algo",
    hex: "#b4531a",
    hexDark: "#f0954f",
    chip: "bg-track-algo/10 text-track-algo ring-1 ring-track-algo/25 dark:bg-track-algo-lite/10 dark:text-track-algo-lite dark:ring-track-algo-lite/25",
    coding: true,
    format: "coding",
  },
  psm1: {
    short: "PSM I",
    hex: "#6a3fa0",
    hexDark: "#b48ce8",
    chip: "bg-track-psm1/10 text-track-psm1 ring-1 ring-track-psm1/25 dark:bg-track-psm1-lite/10 dark:text-track-psm1-lite dark:ring-track-psm1-lite/25",
    coding: false,
    format: "mcq",
  },
};

export function isTrack(value: string | null | undefined): value is TrackId {
  return !!value && TRACK_IDS.includes(value as TrackId);
}

export function trackOf(value: string | null | undefined): TrackId {
  return isTrack(value) ? value : "python";
}
