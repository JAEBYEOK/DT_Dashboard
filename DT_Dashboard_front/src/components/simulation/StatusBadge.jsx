import React from "react";

const STATUS_STYLES = {
  queued: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  running: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  idle: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  offline: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

const STATUS_LABELS = {
  queued: "Queued",
  running: "Running",
  done: "Done",
  failed: "Failed",
  idle: "Idle",
  offline: "Offline",
};

export default function StatusBadge({ status }) {
  const key = status || "offline";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        STATUS_STYLES[key] || STATUS_STYLES.offline
      }`}
    >
      {STATUS_LABELS[key] || STATUS_LABELS.offline}
    </span>
  );
}
