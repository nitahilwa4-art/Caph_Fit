interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
  showLabel?: boolean;
}

export default function MacroBar({
  label,
  current,
  target,
  color,
  unit = 'g',
  showLabel = true,
}: MacroBarProps) {
  const percent = Math.min((current / target) * 100, 100);
  const isOver = current > target;
  const displayColor = isOver ? '#ef4444' : color;

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-slate-400">{label}</span>
          <span className={`text-xs font-mono ${isOver ? 'text-red-400' : 'text-slate-300'}`}>
            {Math.round(current)}{unit} / {target}{unit}
          </span>
        </div>
      )}
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${percent}%`, backgroundColor: displayColor }}
        />
      </div>
    </div>
  );
}
