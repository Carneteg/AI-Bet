import type { Recommendation } from "@/data/matches";
import clsx from "clsx";

const config: Record<
  Recommendation,
  { label: string; icon: string; className: string }
> = {
  spik: {
    label: "Spik",
    icon: "🔒",
    className: "bg-accent-green/10 text-accent-green border-accent-green/30",
  },
  gardering: {
    label: "Gardering",
    icon: "🛡️",
    className: "bg-brand/10 text-brand border-brand/30",
  },
  "skräll": {
    label: "Skräll",
    icon: "⚡",
    className: "bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30",
  },
  normal: {
    label: "Normal",
    icon: "📊",
    className: "bg-slate-700/50 text-slate-400 border-slate-600",
  },
};

export default function RecommendationTag({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  const entry = config[recommendation] ?? config.normal;
  const { label, icon, className } = entry;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold whitespace-nowrap",
        className
      )}
    >
      {icon} {label}
    </span>
  );
}
