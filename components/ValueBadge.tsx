import { getValueColor, getValueLabel } from "@/lib/valueScore";

interface Props {
  score: number;
}

export default function ValueBadge({ score }: Props) {
  const safeScore = Number.isFinite(score) ? score : 0;
  const color = getValueColor(safeScore);
  const label = getValueLabel(safeScore);

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-slate-700 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-brand to-accent-green transition-all"
          style={{ width: `${safeScore}%` }}
        />
      </div>
      <div className={`text-sm font-semibold ${color}`}>
        {safeScore} <span className="text-xs font-normal text-slate-500">/ {label}</span>
      </div>
    </div>
  );
}
