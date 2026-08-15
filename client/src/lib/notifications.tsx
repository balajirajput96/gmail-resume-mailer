import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";

type NoticeKind = "success" | "error" | "info";
type Notice = { id: number; kind: NoticeKind; message: string };

let sequence = 0;
let notices: Notice[] = [];
const listeners = new Set<(next: Notice[]) => void>();

function publish() {
  const snapshot = [...notices];
  listeners.forEach(listener => listener(snapshot));
}

function addNotice(kind: NoticeKind, message: string) {
  const notice = { id: ++sequence, kind, message };
  notices = [...notices, notice].slice(-4);
  publish();
  window.setTimeout(() => removeNotice(notice.id), 5_500);
  return notice.id;
}

function removeNotice(id: number) {
  const next = notices.filter(notice => notice.id !== id);
  if (next.length === notices.length) return;
  notices = next;
  publish();
}

export const toast = {
  success: (message: string) => addNotice("success", message),
  error: (message: string) => addNotice("error", message),
  info: (message: string) => addNotice("info", message),
};

export function formatErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (!message) return fallback;
  try {
    const parsed = JSON.parse(message);
    if (Array.isArray(parsed) && typeof parsed[0]?.message === "string") return parsed[0].message;
    if (typeof parsed?.message === "string") return parsed.message;
  } catch {
    // This is already a human-readable error message.
  }
  return message;
}

export function subscribeToNotifications(listener: (next: Notice[]) => void) {
  listeners.add(listener);
  listener([...notices]);
  return () => {
    listeners.delete(listener);
  };
}

export function clearNotificationsForTest() {
  notices = [];
  publish();
}

const appearance: Record<NoticeKind, { icon: typeof CheckCircle2; className: string }> = {
  success: { icon: CheckCircle2, className: "border-emerald-200 bg-emerald-50 text-emerald-950" },
  error: { icon: TriangleAlert, className: "border-rose-200 bg-rose-50 text-rose-950" },
  info: { icon: Info, className: "border-indigo-200 bg-indigo-50 text-indigo-950" },
};

export function NotificationViewport() {
  const [items, setItems] = useState<Notice[]>([]);

  useEffect(() => subscribeToNotifications(setItems), []);

  return (
    <section aria-label="Notifications" aria-live="polite" aria-relevant="additions text" className="fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
      {items.map(item => {
        const style = appearance[item.kind];
        const Icon = style.icon;
        return <div key={item.id} role="status" className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg ${style.className}`}>
          <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-sm font-medium leading-5">{item.message}</p>
          <button type="button" className="rounded-md p-0.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current" onClick={() => removeNotice(item.id)} aria-label="Dismiss notification"><X className="h-4 w-4" /></button>
        </div>;
      })}
    </section>
  );
}
