import { useState } from 'react';
import { Plus, Trash2, Edit2, Camera, BrainCircuit, Loader2 } from 'lucide-react';
import { parseNutritionLog } from '../../services/geminiService';
import { getUserProfile, getUserPreferences } from '../../services/dbService';
import { useAuth } from '../../contexts/AuthContext';

export default function FoodTracker({ logs, onUpdate }: { logs: any[], onUpdate: (data: any) => void }) {
  const { user } = useAuth();
  const [food, setFood] = useState('');
  const [calories, setCalories] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [mode, setMode] = useState<'manual' | 'ai' | 'photo'>('manual');
  const [loading, setLoading] = useState(false);

  const addFood = (entry: any) => {
    const newEntry = { id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, ...entry };
    onUpdate([...(logs || []), newEntry]);
  };

  const handleManualAdd = () => {
    if (!food || !calories) return;
    addFood({ name: food, calories: parseInt(calories) });
    setFood('');
    setCalories('');
  };

  const handleAIAnalysis = async () => {
    if (!aiInput || !user) return;
    setLoading(true);
    try {
      const profile = await getUserProfile(user.uid);
      const prefs = await getUserPreferences(user.uid);
      const result = await parseNutritionLog(aiInput, null, profile, prefs);
      addFood({ name: result.food_name, calories: result.calories });
      setAiInput('');
      setMode('manual');
    } catch (error) {
      console.error(error);
      alert('Failed to analyze food. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const profile = await getUserProfile(user.uid);
        const prefs = await getUserPreferences(user.uid);
        const result = await parseNutritionLog('Analyze this food image', base64, profile, prefs);
        addFood({ name: result.food_name, calories: result.calories });
        setMode('manual');
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      alert('Failed to analyze photo. Please try again.');
      setLoading(false);
    }
  };

  const deleteEntry = (id: number) => {
    onUpdate(logs.filter(item => item.id !== id));
  };

  return (
    <div className="glass-card p-4 sm:p-6 rounded-3xl w-full">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <h3 className="text-lg font-bold text-white">Food Intake</h3>
        <div className="flex gap-2">
          <button onClick={() => setMode('manual')} className={`p-2 rounded-xl ${mode === 'manual' ? 'bg-emerald-500' : 'bg-slate-800'}`}><Plus size={16} /></button>
          <button onClick={() => setMode('ai')} className={`p-2 rounded-xl ${mode === 'ai' ? 'bg-emerald-500' : 'bg-slate-800'}`}><BrainCircuit size={16} /></button>
          <button onClick={() => setMode('photo')} className={`p-2 rounded-xl ${mode === 'photo' ? 'bg-emerald-500' : 'bg-slate-800'}`}><Camera size={16} /></button>
        </div>
      </div>
      
      {mode === 'manual' && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input type="text" placeholder="Food name" value={food} onChange={(e) => setFood(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-sm flex-1 min-w-0" />
          <div className="flex gap-2">
            <input type="number" placeholder="Cal" value={calories} onChange={(e) => setCalories(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-sm w-20" />
            <button onClick={handleManualAdd} className="bg-emerald-500 p-2 rounded-xl text-white"><Plus size={20} /></button>
          </div>
        </div>
      )}
      
      {mode === 'ai' && (
        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="Describe your meal" value={aiInput} onChange={(e) => setAiInput(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-sm flex-1 min-w-0" />
          <button onClick={handleAIAnalysis} disabled={loading} className="bg-emerald-500 p-2 rounded-xl text-white shrink-0">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
          </button>
        </div>
      )}

      {mode === 'photo' && (
        <div className="mb-4">
          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
          <label htmlFor="photo-upload" className="flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm cursor-pointer hover:bg-slate-700">
            {loading ? <Loader2 className="animate-spin" /> : <Camera />}
            <span className="truncate">Upload Food Photo</span>
          </label>
        </div>
      )}
      
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
