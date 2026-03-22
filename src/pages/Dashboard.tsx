import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserProfile,
  getUserPreferences,
  getDailyLogs,
  saveDailyLog,
  getFoodEntries,
} from '../services/dbService';
import { generateDailyHabits } from '../services/geminiService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Flame,
  Plus,
  CheckCircle2,
  Circle,
  Loader2,
  Dumbbell,
  Sparkles,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Minus,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MacroBar from '../components/ui/MacroBar';

interface Habit {
  id: string;
  text: string;
  reason: string;
  completed: boolean;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [foodEntries, setFoodEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingHabits, setGeneratingHabits] = useState(false);
  const [showHabits, setShowHabits] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayLog = dailyLogs.find((log) => log.date === today) || {};
  const todayFood = foodEntries.filter((f) => f.date === today);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const [p, pref, logs, foods] = await Promise.all([
        getUserProfile(user.id.toString()),
        getUserPreferences(user.id.toString()),
        getDailyLogs(user.id.toString()),
        getFoodEntries(user.id.toString()),
      ]);
      setProfile(p);
      setPreferences(pref);
      setDailyLogs(logs);
      setFoodEntries(foods);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const caloriesConsumed = todayLog?.total_calories_consumed || 0;
  const calorieTarget = todayLog?.total_calories_target || profile?.target_calories || 2000;
  const caloriePercent = Math.min((caloriesConsumed / calorieTarget) * 100, 100);
  const remaining = Math.max(calorieTarget - caloriesConsumed, 0);
  const isOver = caloriesConsumed > calorieTarget;

  const proteinConsumed = todayLog?.total_protein_consumed || 0;
  const carbsConsumed = todayLog?.total_carbs_consumed || 0;
  const fatConsumed = todayLog?.total_fat_consumed || 0;

  const proteinTarget = Math.round(calorieTarget * 0.3 / 4);
  const carbsTarget = Math.round(calorieTarget * 0.4 / 4);
  const fatTarget = Math.round(calorieTarget * 0.3 / 9);

  const handleGenerateHabits = async () => {
    if (!user || !profile || !preferences) return;
    setGeneratingHabits(true);
    try {
      const newHabits = await generateDailyHabits(profile, preferences);
      const habitsWithStatus: Habit[] = newHabits.map((h: any, index: number) => ({
        id: `${h.id || 'habit'}-${index}`,
        text: h.text,
        reason: h.reason,
        completed: false,
      }));
      const updatedLog = {
        ...todayLog,
        habits: habitsWithStatus,
        total_calories_target: todayLog.total_calories_target || profile?.target_calories || 2000,
        total_calories_consumed: todayLog.total_calories_consumed || 0,
      };
      await saveDailyLog(user.id.toString(), today, updatedLog);
      const logs = await getDailyLogs(user.id.toString());
      setDailyLogs(logs);
      setShowHabits(true);
    } catch (error) {
      console.error('Error generating habits:', error);
    } finally {
      setGeneratingHabits(false);
    }
  };

  const toggleHabit = async (habitId: string) => {
    if (!user || !todayLog?.habits) return;
    const updatedHabits = todayLog.habits.map((h: Habit) =>
      h.id === habitId ? { ...h, completed: !h.completed } : h,
    );
    const updatedLogs = dailyLogs.map((log) =>
      log.date === today ? { ...log, habits: updatedHabits } : log,
    );
    setDailyLogs(updatedLogs);
    await saveDailyLog(user.id.toString(), today, {
      ...todayLog,
      habits: updatedHabits,
      total_calories_target: todayLog.total_calories_target || profile?.target_calories || 2000,
      total_calories_consumed: todayLog.total_calories_consumed || 0,
    });
  };

  const weightData = dailyLogs
    .slice(-14)
    .filter((log) => log.weight_input)
    .map((log) => ({
      date: new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' }),
      actual: log.weight_input,
      target: profile?.target_weight || null,
    }));

  if (loading) {
    return (
      <div className="page flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="section">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-slate-500">{greeting()}</p>
            <h1 className="text-2xl font-bold text-white">{user?.name?.split(' ')[0] || 'Friend'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${profile?.goal_type === 'cut' ? 'badge-emerald' : profile?.goal_type === 'bulk' ? 'badge-amber' : 'badge-slate'}`}>
              {profile?.goal_type === 'cut' && <TrendingDown size={12} />}
              {profile?.goal_type === 'bulk' && <TrendingUp size={12} />}
              {profile?.goal_type === 'maintain' && <Minus size={12} />}
              {profile?.goal_type?.charAt(0).toUpperCase() + profile?.goal_type?.slice(1)}
            </span>
            <button onClick={logout} className="btn btn-ghost p-2 text-slate-500 text-xs">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Calorie Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-orange-400" />
              <span className="text-sm font-medium text-slate-300">Today's Calories</span>
            </div>
            <Link to="/nutrition" className="btn btn-ghost p-2 text-emerald-400 text-xs font-medium">
              + Add Food <ChevronRight size={14} />
            </Link>
          </div>

          {/* Main calorie number */}
          <div className="text-center mb-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className={`text-5xl font-bold font-mono ${isOver ? 'text-red-400' : 'text-white'}`}>
                {caloriesConsumed}
              </span>
              <span className="text-lg text-slate-500 font-medium">/ {calorieTarget}</span>
            </div>
            <p className={`text-sm mt-1 font-medium ${isOver ? 'text-red-400' : 'text-slate-400'}`}>
              {isOver ? `${caloriesConsumed - calorieTarget} over` : `${remaining} remaining`}
            </p>
          </div>

          {/* Progress bar */}
          <div className="progress-track mb-4">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${caloriePercent}%` }}
              style={{ backgroundColor: isOver ? '#ef4444' : '#10b981' }}
            />
          </div>

          {/* Macro bars */}
          <div className="space-y-3">
            <MacroBar label="Protein" current={proteinConsumed} target={proteinTarget} color="#10b981" />
            <MacroBar label="Carbs" current={carbsConsumed} target={carbsTarget} color="#f59e0b" />
            <MacroBar label="Fat" current={fatConsumed} target={fatTarget} color="#ef4444" />
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 gap-3 mb-4"
        >
          <Link to="/nutrition" className="card p-4 flex items-center gap-3 hover:bg-slate-800/40 transition-colors">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Plus size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Log Food</p>
              <p className="text-xs text-slate-500">Track your meal</p>
            </div>
          </Link>
          <Link to="/workout" className="card p-4 flex items-center gap-3 hover:bg-slate-800/40 transition-colors">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Dumbbell size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Workout</p>
              <p className="text-xs text-slate-500">Start session</p>
            </div>
          </Link>
        </motion.div>

        {/* Habits Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5 mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span className="text-sm font-semibold text-white">Today's Habits</span>
            </div>
            <button
              onClick={() => setShowHabits(!showHabits)}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              {showHabits ? 'Hide' : 'Show'}
            </button>
          </div>

          {todayLog?.habits && todayLog.habits.length > 0 ? (
            <AnimatePresence>
              {showHabits && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2"
                >
                  {todayLog.habits.map((habit: Habit) => (
                    <button
                      key={habit.id}
                      onClick={() => toggleHabit(habit.id)}
                      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-slate-800/40 transition-colors text-left"
                    >
                      {habit.completed ? (
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Circle size={18} className="text-slate-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${habit.completed ? 'text-slate-600 line-through' : 'text-slate-200'}`}>
                          {habit.text}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{habit.reason}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <div className="text-center py-3">
              <p className="text-sm text-slate-500 mb-3">Generate your daily habits with AI</p>
              <button
                onClick={handleGenerateHabits}
                disabled={generatingHabits}
                className="btn btn-outline text-sm py-2.5 px-4"
              >
                {generatingHabits ? (
                  <><Loader2 size={14} className="animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles size={14} className="text-emerald-400" /> Generate Habits</>
                )}
              </button>
            </div>
          )}
        </motion.div>

        {/* Weight Progress */}
        {weightData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card p-5 mb-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingDown size={18} className="text-slate-400" />
                <span className="text-sm font-semibold text-white">Weight Trend</span>
              </div>
              <Link to="/daily-detail" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                View all <ChevronRight size={12} className="inline" />
              </Link>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} domain={['dataMin-1', 'dataMax+1']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#f1f5f9' }}
                  />
                  <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#0f172a', stroke: '#10b981', strokeWidth: 2 }} />
                  {profile?.target_weight && (
                    <Line type="monotone" dataKey="target" stroke="#475569" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Recent Food */}
        {todayFood.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-white">Today's Food</span>
              <Link to="/nutrition" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                See all <ChevronRight size={12} className="inline" />
              </Link>
            </div>
            <div className="space-y-2">
              {todayFood.slice(0, 3).map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{entry.food_name}</p>
                    <p className="text-xs text-slate-500">{entry.portion_grams || ''}g</p>
                  </div>
                  <span className="text-sm font-mono font-semibold text-slate-300">{entry.calories} kcal</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
