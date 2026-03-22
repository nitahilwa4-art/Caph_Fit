import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserProfile,
  getUserPreferences,
  saveFoodEntry,
  getFoodEntries,
} from '../services/dbService';
import { parseNutritionLog, NutritionResult } from '../services/geminiService';
import { Camera, ArrowLeft, Loader2, CheckCircle2, Clock, ChevronDown, ChevronUp, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (user) {
        const [entries, profile] = await Promise.all([
          getFoodEntries(user.id.toString()),
          getUserProfile(user.id.toString()),
        ]);
        setHistory(entries);

        if (profile?.target_calories) {
          // Calculate macro targets based on calorie target
          const tdee = profile.target_calories;
          setDailyTarget({
            calories: tdee,
            protein: Math.round(tdee * 0.3 / 4), // 30% protein, 4 cal/g
            carbs: Math.round(tdee * 0.4 / 4),    // 40% carbs, 4 cal/g
            fat: Math.round(tdee * 0.3 / 9),     // 30% fat, 9 cal/g
          });
        }
        setLoadingHistory(false);
      }
    };
    fetchData();
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
      console.error('Error analyzing food:', error);
      alert('Gagal menganalisis makanan. Coba lagi ya.');
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

      // Refresh history
      const entries = await getFoodEntries(user.id.toString());
      setHistory(entries);

      // Reset state
      setAiResult(null);
      setAdjustedResult(null);
      setTextInput('');
      setImagePreview(null);

    } catch (error) {
      console.error('Error saving food entry:', error);
      alert('Gagal menyimpan. Coba lagi ya.');
    }
  };

  const handleCancel = () => {
    setAiResult(null);
    setAdjustedResult(null);
  };

  const ProgressBar = ({ label, current, target, color, unit = 'g' }: {
    label: string;
    current: number;
    target: number;
    color: string;
    unit?: string;
  }) => {
    const percent = Math.min((current / target) * 100, 100);
    const isOver = current > target;

    return (
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-slate-300 font-medium">{label}</span>
          <span className={isOver ? 'text-red-400' : 'text-slate-400'}>
            {current}{unit} / {target}{unit}
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isOver ? 'bg-red-500' : ''}`}
            style={{ backgroundColor: isOver ? undefined : color }}
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    );
  };

  const ConfidenceBadge = ({ confidence }: { confidence: 'HIGH' | 'MEDIUM' | 'LOW' }) => {
    const config = {
      HIGH: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Tinggi', desc: 'Perkiraan cukup akurat' },
      MEDIUM: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Sedang', desc: 'Perkiraan +/- 20%' },
      LOW: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Rendah', desc: 'Perlu konfirmasi manual' },
    };
    const { color, bg, label, desc } = config[confidence];

    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg} border border-white/10`}>
        <span className={`text-xs font-semibold ${color}`}>{label}</span>
        <span className="text-xs text-slate-500">{desc}</span>
      </div>
    );
  };

  // === AI CONFIRMATION CARD ===
  if (aiResult && adjustedResult) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 relative overflow-hidden"
      >
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-900/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-lg mx-auto relative z-10">
          <header className="flex items-center gap-4 mb-6">
            <button onClick={handleCancel} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-slate-400" />
            </button>
            <h1 className="text-2xl font-bold text-white tracking-tight">Konfirmasi Porsi</h1>
          </header>

          {/* Food Name */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-card p-6 mb-4"
          >
            <h2 className="text-xl font-bold text-white mb-1">{adjustedResult.food_name}</h2>
            <p className="text-sm text-slate-400">{adjustedResult.portion_description}</p>
          </motion.div>

          {/* Portion Slider */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 mb-4"
          >
            <label className="block text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">
              Sesuaikan Porsi
            </label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-500 w-8">50g</span>
              <input
                type="range"
                min={50}
                max={1000}
                step={10}
                value={adjustedResult.portion_grams}
                onChange={(e) => handleAdjustPortion(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-xs text-slate-500 w-8 text-right">1kg</span>
            </div>
            <div className="text-center mt-3">
              <span className="text-3xl font-bold text-white font-mono">{adjustedResult.portion_grams}</span>
              <span className="text-slate-400 ml-1">gram</span>
            </div>
          </motion.div>

          {/* Macro Cards with Progress */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 mb-4"
          >
            <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">📊 Kontribusi Harian</h3>

            <div className="space-y-4 mb-4">
              <ProgressBar
                label="🔥 Kalori"
                current={adjustedResult.calories}
                target={dailyTarget.calories}
                color="#3b82f6"
                unit="kkal"
              />
              <ProgressBar
                label="💪 Protein"
                current={adjustedResult.protein}
                target={dailyTarget.protein}
                color="#10b981"
              />
              <ProgressBar
                label="🍞 Karbohidrat"
                current={adjustedResult.carbs}
                target={dailyTarget.carbs}
                color="#f59e0b"
              />
              <ProgressBar
                label="🧈 Lemak"
                current={adjustedResult.fat}
                target={dailyTarget.fat}
                color="#ef4444"
              />
            </div>

            {/* Macro Grid */}
            <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-700/50">
              <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-white font-mono">{adjustedResult.calories}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Kalori</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400 font-mono">{adjustedResult.protein}g</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Protein</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-amber-400 font-mono">{adjustedResult.carbs}g</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Karbo</p>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-red-400 font-mono">{adjustedResult.fat}g</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Lemak</p>
              </div>
            </div>
          </motion.div>

          {/* Hidden Calories Warning */}
          <AnimatePresence>
            {adjustedResult.hidden_calories_warning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card p-4 mb-4 border-amber-500/30 bg-amber-500/5"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-400 mb-1">⚠️ Hidden Calories Terdeteksi</p>
                    <p className="text-xs text-slate-400">{adjustedResult.hidden_calories_warning}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Reasoning */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-4 mb-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-emerald-500" />
              <p className="text-sm font-medium text-slate-300">AI Reasoning</p>
              <div className="ml-auto">
                <ConfidenceBadge confidence={adjustedResult.confidence || 'MEDIUM'} />
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{adjustedResult.reasoning}</p>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-3.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-semibold"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 btn-premium py-3.5 flex items-center justify-center gap-2 font-semibold"
            >
              <CheckCircle2 className="w-5 h-5" />
              Simpan
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // === MAIN INPUT PAGE ===
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-900/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <header className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Log Nutrisi</h1>
            <p className="text-sm text-slate-400">Tambahkan makanan dengan foto atau teks</p>
          </div>
        </header>

        {/* Input Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 md:p-8 mb-6"
        >
          {/* Text Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">
              Apa yang kamu makan?
            </label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Contoh: 2 butir telur orak-arik + 1 potong roti gandum + setengah alpukat..."
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none resize-none h-32 transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Photo Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">
              Atau foto makanan
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                imagePreview
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-700/50 hover:border-emerald-500/30 bg-slate-900/30 hover:bg-slate-900/50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />

              <AnimatePresence mode="wait">
                {imagePreview ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-sm mx-auto"
                  >
                    <img src={imagePreview} alt="Food preview" className="rounded-lg shadow-2xl object-cover max-h-64 w-full border border-slate-700/50" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
                      className="absolute -top-3 -right-3 bg-red-500/90 backdrop-blur-sm text-white rounded-full p-1.5 shadow-lg hover:bg-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 text-slate-400"
                  >
                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700/50 shadow-inner">
                      <Camera className="w-8 h-8 text-emerald-500/80" />
                    </div>
                    <p className="text-sm font-medium">Klik untuk foto makananmu</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading || (!textInput.trim() && !imagePreview)}
            className="btn-premium w-full flex items-center justify-center gap-2 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Menganalisis dengan AI...</>
            ) : (
              '🔍 Analisis & Hitung Nutrisi'
            )}
          </button>

          {!textInput.trim() && !imagePreview && (
            <p className="text-center text-xs text-slate-500 mt-3">
              Masukkan teks atau foto untuk menganalisis
            </p>
          )}
        </motion.div>

        {/* Food History */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-slate-400" />
            <h2 className="text-xl font-bold text-white">Riwayat Makanan</h2>
          </div>

          {loadingHistory ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : history.length === 0 ? (
            <div className="glass-card p-8 text-center rounded-2xl">
              <p className="text-slate-400">Belum ada makanan yang dicatat. Yuk mulai logging!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <FoodEntryCard
                  key={entry.id}
                  entry={entry}
                  dailyTarget={dailyTarget}
                  isExpanded={expandedCard === entry.id}
                  onToggle={() => setExpandedCard(expandedCard === entry.id ? null : entry.id)}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

// === EXPANDABLE FOOD ENTRY CARD ===
function FoodEntryCard({
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
  const calPercent = Math.round((entry.calories / dailyTarget.calories) * 100);

  return (
    <motion.div
      layout
      className="glass-card overflow-hidden rounded-2xl"
    >
      {/* Card Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-lg">🍽️</span>
          </div>
          <div className="text-left">
            <h3 className="text-white font-semibold">{entry.food_name}</h3>
            <p className="text-xs text-slate-500">
              {entry.portion_grams}g • {entry.calories} kkal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-400">{calPercent}%</p>
            <p className="text-xs text-emerald-400">daily</p>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Progress Bars */}
              <div className="space-y-2.5">
                <MacroProgress label="🔥 Kalori" current={entry.calories} target={dailyTarget.calories} color="#3b82f6" unit="kkal" />
                <MacroProgress label="💪 Protein" current={entry.protein} target={dailyTarget.protein} color="#10b981" />
                <MacroProgress label="🍞 Karbo" current={entry.carbs} target={dailyTarget.carbs} color="#f59e0b" />
                <MacroProgress label="🧈 Lemak" current={entry.fat} target={dailyTarget.fat} color="#ef4444" />
              </div>

              {/* Time */}
              <div className="pt-2 border-t border-slate-700/50">
                <p className="text-xs text-slate-500">
                  Dicatat: {entry.created_at ? new Date(entry.created_at).toLocaleString('id-ID', {
                    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
                  }) : entry.date}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MacroProgress({
  label,
  current,
  target,
  color,
  unit = 'g',
}: {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
}) {
  const percent = Math.min((current / target) * 100, 100);
  const isOver = current > target;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percent}%`,
            backgroundColor: isOver ? '#ef4444' : color,
          }}
        />
      </div>
      <span className={`text-xs font-mono w-20 text-right ${isOver ? 'text-red-400' : 'text-slate-300'}`}>
        {current}{unit} / {target}{unit}
      </span>
    </div>
  );
}
