import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, getUserPreferences, saveFoodEntry, getFoodEntries } from '../services/dbService';
import { parseNutritionLog, NutritionResult } from '../services/geminiService';
import { Camera, ArrowLeft, Loader2, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle, Send, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MacroBar from '../components/ui/MacroBar';
import EmptyState from '../components/ui/EmptyState';

interface FoodEntry {
  id?: string;
  food_name: string;
  portion_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  created_at?: string;
  date?: string;
}

export default function NutritionLog() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [textInput, setTextInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<NutritionResult | null>(null);
  const [adjustedResult, setAdjustedResult] = useState<NutritionResult | null>(null);
  const [history, setHistory] = useState<FoodEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [dailyTarget, setDailyTarget] = useState({ calories: 2000, protein: 150, carbs: 250, fat: 65 });
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const [entries, profile] = await Promise.all([
        getFoodEntries(user.id.toString()),
        getUserProfile(user.id.toString()),
      ]);
      setHistory(entries);
      if (profile?.target_calories) {
        const tdee = profile.target_calories;
        setDailyTarget({
          calories: tdee,
          protein: Math.round(tdee * 0.3 / 4),
          carbs: Math.round(tdee * 0.4 / 4),
          fat: Math.round(tdee * 0.3 / 9),
        });
      }
      setLoadingHistory(false);
    };
    fetchData();
  }, [user]);

  const handleAnalyze = async () => {
    if (!user || (!textInput.trim() && !imagePreview)) return;
    setLoading(true);
    setAiResult(null);
    setAdjustedResult(null);

    try {
      const profile = await getUserProfile(user.id.toString());
      const prefs = await getUserPreferences(user.id.toString());
      const result = await parseNutritionLog(textInput.trim(), imagePreview, profile, prefs);
      setAiResult(result);
      setAdjustedResult(result);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustPortion = (newGrams: number) => {
    if (!aiResult) return;
    const ratio = newGrams / aiResult.portion_grams;
    setAdjustedResult({
      ...aiResult,
      portion_grams: newGrams,
      calories: Math.round(aiResult.calories * ratio),
      protein: Math.round(aiResult.protein * ratio * 10) / 10,
      carbs: Math.round(aiResult.carbs * ratio * 10) / 10,
      fat: Math.round(aiResult.fat * ratio * 10) / 10,
    });
  };

  const handleConfirm = async () => {
    if (!user || !adjustedResult) return;
    try {
      await saveFoodEntry({
        userId: user.id.toString(),
        date: new Date().toISOString().split('T')[0],
        input_type: imagePreview ? 'photo' : 'text',
        raw_prompt: textInput,
        food_name: adjustedResult.food_name,
        portion_grams: adjustedResult.portion_grams,
        portion_description: adjustedResult.portion_description,
        calories: adjustedResult.calories,
        protein: adjustedResult.protein,
        carbs: adjustedResult.carbs,
        fat: adjustedResult.fat,
        confidence: adjustedResult.confidence,
        hidden_calories_warning: adjustedResult.hidden_calories_warning,
      });
      const entries = await getFoodEntries(user.id.toString());
      setHistory(entries);
      setAiResult(null);
      setAdjustedResult(null);
      setTextInput('');
      setImagePreview(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save. Please try again.');
    }
  };

  // === CONFIRMATION PAGE ===
  if (aiResult && adjustedResult) {
    const confidenceColor = {
      HIGH: 'text-emerald-400',
      MEDIUM: 'text-amber-400',
      LOW: 'text-red-400',
    }[adjustedResult.confidence || 'MEDIUM'];

    return (
      <div className="page">
        <div className="section">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => { setAiResult(null); setAdjustedResult(null); }} className="btn btn-ghost p-2">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Confirm Portion</h1>
              <p className="text-xs text-slate-500">Adjust if needed</p>
            </div>
          </div>

          {/* Food name */}
          <div className="card p-5 mb-4">
            <h2 className="text-lg font-bold text-white">{adjustedResult.food_name}</h2>
            <p className="text-sm text-slate-500 mt-1">{adjustedResult.portion_description}</p>
            {adjustedResult.confidence && (
              <span className={`badge badge-slate mt-2 text-xs ${confidenceColor.replace('text-', '')}`}>
                Confidence: {adjustedResult.confidence}
              </span>
            )}
          </div>

          {/* Portion slider */}
          <div className="card p-5 mb-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Adjust Portion</p>
            <input
              type="range"
              min={50}
              max={1000}
              step={10}
              value={adjustedResult.portion_grams}
              onChange={(e) => handleAdjustPortion(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-3"
            />
            <div className="text-center">
              <span className="text-4xl font-bold text-white font-mono">{adjustedResult.portion_grams}</span>
              <span className="text-slate-400 ml-1">g</span>
            </div>
          </div>

          {/* Macros */}
          <div className="card p-5 mb-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Nutrition Facts</p>
            <div className="space-y-3">
              <MacroBar label="Calories" current={adjustedResult.calories} target={dailyTarget.calories} color="#3b82f6" unit=" kcal" />
              <MacroBar label="Protein" current={adjustedResult.protein} target={dailyTarget.protein} color="#10b981" />
              <MacroBar label="Carbs" current={adjustedResult.carbs} target={dailyTarget.carbs} color="#f59e0b" />
              <MacroBar label="Fat" current={adjustedResult.fat} target={dailyTarget.fat} color="#ef4444" />
            </div>
          </div>

          {/* Warning */}
          <AnimatePresence>
            {adjustedResult.hidden_calories_warning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="card p-4 mb-4 border border-amber-500/20"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-300">{adjustedResult.hidden_calories_warning}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => { setAiResult(null); setAdjustedResult(null); }} className="btn btn-outline flex-1">
              Cancel
            </button>
            <button onClick={handleConfirm} className="btn btn-primary flex-1">
              <CheckCircle2 size={16} /> Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === MAIN INPUT PAGE ===
  return (
    <div className="page">
      <div className="section">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Log Food</h1>
          <p className="text-sm text-slate-500 mt-1">Describe what you ate or snap a photo</p>
        </div>

        {/* Quick input */}
        <div className="card p-4 mb-4">
          <textarea
            ref={inputRef}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="e.g., 2 eggs, toast, half an avocado..."
            className="input-lg resize-none h-20 mb-3"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAnalyze();
              }
            }}
          />

          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-outline px-4"
            >
              <Camera size={16} />
              Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setImagePreview(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />

            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-xl object-cover" />
                <button
                  onClick={() => setImagePreview(null)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                >
                  x
                </button>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading || (!textInput.trim() && !imagePreview)}
              className="btn btn-primary flex-1"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> Analyze</>}
            </button>
          </div>
        </div>

        {/* History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Today</h2>
          </div>

          {loadingHistory ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="text-slate-500 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <EmptyState
              icon={Utensils}
              title="No food logged yet"
              description="Start by describing what you ate above"
            />
          ) : (
            <div className="space-y-2">
              {history.map((entry) => (
                <FoodEntryRow
                  key={entry.id}
                  entry={entry}
                  dailyTarget={dailyTarget}
                  isExpanded={expandedCard === entry.id}
                  onToggle={() => setExpandedCard(expandedCard === entry.id ? null : entry.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FoodEntryRow({
  entry,
  dailyTarget,
  isExpanded,
  onToggle,
}: {
  entry: FoodEntry;
  dailyTarget: { calories: number; protein: number; carbs: number; fat: number };
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const calPct = Math.round((entry.calories / dailyTarget.calories) * 100);

  return (
    <div className="card overflow-hidden">
      <button onClick={onToggle} className="w-full p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
            <Utensils size={14} className="text-slate-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">{entry.food_name}</p>
            <p className="text-xs text-slate-500">{entry.portion_grams}g</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-mono font-semibold text-white">{entry.calories}</p>
            <p className="text-xs text-slate-500">{calPct}%</p>
          </div>
          {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4 pb-4"
          >
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <MacroBar label="Protein" current={entry.protein} target={dailyTarget.protein} color="#10b981" />
              <MacroBar label="Carbs" current={entry.carbs} target={dailyTarget.carbs} color="#f59e0b" />
              <MacroBar label="Fat" current={entry.fat} target={dailyTarget.fat} color="#ef4444" />
            </div>
            <p className="text-xs text-slate-600 mt-3">
              {entry.created_at ? new Date(entry.created_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
              }) : entry.date}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
