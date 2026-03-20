import { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function ExerciseTracker({ logs, onUpdate }: { logs: any[], onUpdate: (data: any) => void }) {
  const [exercise, setExercise] = useState('');
  const [calories, setCalories] = useState('');

  const addExercise = () => {
    if (!exercise || !calories) return;
    const newEntry = { id: Date.now(), name: exercise, calories: parseInt(calories) };
    onUpdate([...(logs || []), newEntry]);
    setExercise('');
    setCalories('');
  };

  const deleteEntry = (id: number) => {
    onUpdate(logs.filter(item => item.id !== id));
  };

  return (
    <div className="glass-card p-4 sm:p-6 rounded-3xl w-full">
      <h3 className="text-lg font-bold text-white mb-4">Exercise</h3>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input type="text" placeholder="Exercise name" value={exercise} onChange={(e) => setExercise(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-sm flex-1 min-w-0" />
        <div className="flex gap-2">
          <input type="number" placeholder="Cal" value={calories} onChange={(e) => setCalories(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-sm w-20" />
          <button onClick={addExercise} className="bg-blue-500 p-2 rounded-xl text-white shrink-0"><Plus size={20} /></button>
        </div>
      </div>
      <ul className="space-y-2">
        {logs?.map((item: any) => (
          <li key={item.id} className="flex justify-between items-center text-sm text-slate-300 bg-slate-800/50 p-2 rounded-lg gap-2">
            <span className="truncate">{item.name} ({item.calories} kcal)</span>
            <div className="flex gap-1 shrink-0">
              <button className="text-blue-400 p-1"><Edit2 size={16} /></button>
              <button onClick={() => deleteEntry(item.id)} className="text-red-400 p-1"><Trash2 size={16} /></button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
