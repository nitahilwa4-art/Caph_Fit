import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, getUserPreferences, saveFoodEntry, getFoodEntries } from '../services/dbService';
import { parseNutritionLog } from '../services/geminiService';
import { Camera, Upload, ArrowLeft, Loader2, Activity, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function NutritionLog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [textInput, setTextInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (user) {
        const entries = await getFoodEntries(user.uid);
        setHistory(entries);
        setLoadingHistory(false);
      }
    };
    fetchHistory();
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
    if (!user || (!textInput && !imagePreview)) return;
    setLoading(true);
    setResult(null);

    try {
      const profile = await getUserProfile(user.uid);
      const prefs = await getUserPreferences(user.uid);
      
      const analysis = await parseNutritionLog(textInput, imagePreview, profile, prefs);
      setResult(analysis);
      
      // Save to Firestore
      await saveFoodEntry({
        userId: user.uid,
        date: new Date().toISOString().split('T')[0],
        input_type: imagePreview ? 'photo' : 'text',
        raw_prompt: textInput,
        food_name: analysis.food_name,
        calories: analysis.calories,
        protein: analysis.protein,
        carbs: analysis.carbs,
        fat: analysis.fat,
      });

      // Refresh history
      const entries = await getFoodEntries(user.uid);
      setHistory(entries);

      // Clear inputs
      setTextInput('');
      setImagePreview(null);

    } catch (error) {
      console.error('Error analyzing food:', error);
      alert('Failed to analyze food. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-white tracking-tight">Log Nutrition</h1>
        </header>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 md:p-8 mb-8"
        >
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">What did you eat?</label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="e.g., 2 scrambled eggs with a slice of whole wheat toast and half an avocado..."
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none resize-none h-32 transition-all"
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Or upload a photo</label>
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
                    <p className="text-sm font-medium">Click to upload a photo of your meal</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || (!textInput && !imagePreview)}
            className="btn-premium w-full flex items-center justify-center gap-2 py-4 text-lg"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing with AI...</>
            ) : (
              'Analyze & Log'
            )}
          </button>
        </motion.div>

        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 md:p-8 border-emerald-500/20 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              
              <div className="flex items-center justify-between mb-8 border-b border-slate-800/50 pb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight">{result.food_name}</h2>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Logged
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5 text-center">
                  <p className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Calories</p>
                  <p className="text-3xl font-bold text-white font-mono">{result.calories}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5 text-center">
                  <p className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Protein</p>
                  <p className="text-3xl font-bold text-emerald-400 font-mono">{result.protein}<span className="text-lg text-emerald-400/50">g</span></p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5 text-center">
                  <p className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Carbs</p>
                  <p className="text-3xl font-bold text-amber-400 font-mono">{result.carbs}<span className="text-lg text-amber-400/50">g</span></p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-5 text-center">
                  <p className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">Fat</p>
                  <p className="text-3xl font-bold text-red-400 font-mono">{result.fat}<span className="text-lg text-red-400/50">g</span></p>
                </div>
              </div>

              <div className="bg-slate-900/30 rounded-xl p-5 border border-slate-800/50">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-emerald-500" /> AI Reasoning
                </h3>
                <p className="text-slate-400 leading-relaxed">{result.reasoning}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-slate-400" />
            <h2 className="text-xl font-bold text-white">Food History</h2>
          </div>

          {loadingHistory ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : history.length === 0 ? (
            <div className="glass-card p-8 text-center rounded-2xl">
              <p className="text-slate-400">No food logged yet. Start by adding your first meal above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700/50 transition-colors">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{entry.food_name}</h3>
                    <p className="text-sm text-slate-400">
                      {new Date(entry.createdAt).toLocaleDateString('en-US', { 
                        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Cal</p>
                      <p className="font-mono font-semibold text-white">{entry.calories}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Pro</p>
                      <p className="font-mono font-semibold text-emerald-400">{entry.protein}g</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Carb</p>
                      <p className="font-mono font-semibold text-amber-400">{entry.carbs}g</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Fat</p>
                      <p className="font-mono font-semibold text-red-400">{entry.fat}g</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
