export default function CalorieSummary({ consumed, burned, target }: { consumed: number, burned: number, target: number }) {
  const net = consumed - burned;
  return (
    <div className="glass-card p-6 rounded-3xl grid grid-cols-3 gap-4 text-center">
      <div>
        <p className="text-slate-400 text-xs uppercase">Consumed</p>
        <p className="text-2xl font-bold text-emerald-400">{consumed}</p>
      </div>
      <div>
        <p className="text-slate-400 text-xs uppercase">Burned</p>
        <p className="text-2xl font-bold text-blue-400">{burned}</p>
      </div>
      <div>
        <p className="text-slate-400 text-xs uppercase">Net</p>
        <p className={`text-2xl font-bold ${net <= target ? 'text-white' : 'text-red-400'}`}>{net}</p>
      </div>
    </div>
  );
}
