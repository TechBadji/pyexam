import api from "../../api/axios";

interface QueuedRequest {
  url: string;
  method: "put" | "post";
  data: unknown;
  timestamp: number;
}

const QUEUE_KEY = "pyexam_offline_queue";

function load(): QueuedRequest[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]") as QueuedRequest[];
  } catch {
    return [];
  }
}

function save(queue: QueuedRequest[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueue(url: string, method: "put" | "post", data: unknown) {
  const queue = load();
  const existing = queue.findIndex((r) => r.url === url && r.method === method);
  const entry: QueuedRequest = { url, method, data, timestamp: Date.now() };
  if (existing >= 0) {
    queue[existing] = entry;
  } else {
    queue.push(entry);
  }
  save(queue);
}

export async function flushQueue(): Promise<void> {
  const queue = load();
  if (queue.length === 0) return;

  const failed: QueuedRequest[] = [];
  for (const req of queue) {
    try {
      if (req.method === "put") {
        await api.put(req.url, req.data);
      } else {
        await api.post(req.url, req.data);
      }
    } catch {
      failed.push(req);
    }
  }
  save(failed);
}

export function initOfflineSync() {
  window.addEventListener("online", () => {
    flushQueue().catch(() => undefined);
  });
}
