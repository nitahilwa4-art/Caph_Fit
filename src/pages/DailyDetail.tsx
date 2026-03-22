import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDailyLogs, getFoodEntries, getUserProfile } from '../services/dbService';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingDown, Flame, ChevronLeft, ChevronRight, Scale } from 'lucide-react';
import { motion } from 'motion/react';
import MacroBar from '../components/ui/MacroBar';

export default function DailyDetail() {
  const { user } = useAuth();
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [foodEntries, setFoodEntries] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const [logs, foods, prof] = await Promise.all([
        getDailyLogs(user.id.toString()),
        getFoodEntries(user.id.toString()),
        getUserProfile(user.id.toString()),
      ]);
      setDailyLogs(logs);
      setFoodEntries(foods);
      setProfile(prof);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const getWeekDates = () => {
    const dates = [];
    const base = new Date();
    base.setDate(base.getDate() - base.getDay() + weekOffset * 7);
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const weekData = weekDates.map((date) => {
    const log = dailyLogs.find((l) => l.date === date);
    const foods = foodEntries.filter((f) => f.date === date);
    const consumed = log?.total_calories_consumed || foods.reduce((s, f) => s + (f.calories || 0), 0);
    const target = log?.total_calories_target || profile?.target_calories || 2000;
    return {
      day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      date,
      consumed,
      target,
      weight: log?.weight_input || null,
      protein: log?.total_protein_consumed || 0,
      carbs: log?.total_carbs_consumed || 0,
      fat: log?.total_fat_consumed || 0,
    };
  });

  const weeklyAvgCalories = Math.round(
    weekData.reduce((s, d) => s + d.consumed, 0) / (weekData.filter((d) => d.consumed > 0).length || 1)
  );
  const weeklyAvgTarget = weekData[0]?.target || 2000;
  const weekCompliance = Math.round(
    (weekData.filter((d) => d.consumed > 0 && d.consumed <= d.target * 1.1).length /
      weekData.filter((d) => d.consumed > 0).length) *
      100
  ) || 0;

  // Today's summary
  const today = new Date().toISOString().split('T')[0];
  const todayLog = dailyLogs.find((l) => l.date === today) || {};
  const todayFood = foodEntries.filter((f) => f.date === today);
  const todayConsumed = todayLog?.total_calories_consumed || todayFood.reduce((s, f) => s + (f.calories || 0), 0);
  const todayTarget = todayLog?.total_calories_target || profile?.target_calories || 2000;
  const caloriePercent = Math.min((todayConsumed / todayTarget) * 100, 100);

  const proteinConsumed = todayLog?.total_protein_consumed || 0;
  const carbsConsumed = todayLog?.total_carbs_consumed || 0;
  const fatConsumed = todayLog?.total_carbs_consumed || 0;
  const proteinTarget = Math.round(todayTarget * 0.3 / 4);
  const carbsTarget = Math.round(todayTarget * 0.4 / 4);
  const fatTarget = Math.round(todayTarget * 0.3 / 9);

  const weightLogs = dailyLogs.filter((l) => l.weight_input).slice(-30);
  const weightTrend = weightLogs.length >= 2
    ? (weightLogs[weightLogs.length - 1].weight_input - weightLogs[0].weight_input).toFixed(1)
    : null;

  const thisWeekLabel = () => {
    const start = new Date(weekDates[0]);
    const end = new Date(weekDates[6]);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  if (loading) {
    return (
      <div className="page flex flex-col items-center justify-center gap-3">
        <Scale className="w-8 h-8 text-slate-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="section">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Progress</h1>
          <p className="text-sm text-slate-500 mt-1">Track your weekly journey</p>
        </div>

        {/* Today's macros summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 mb-4"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-white">Today</span>
            <Link to="/nutrition" className="text-xs text-emerald-400 font-medium">+ Add food</Link>
          </div>

          {/* Calorie ring */}
          <div className="flex items-center gap-6 mb-4">
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="#10b981" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - caloriePercent / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-white">{todayConsumed}</span>
                <span className="text-xs text-slate-500">/ {todayTarget}</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <MacroBar label="Protein" current={proteinConsumed} target={proteinTarget} color="#10b981" />
              <MacroBar label="Carbs" current={carbsConsumed} target={carbsTarget} color="#f59e0b" />
              <MacroBar label="Fat" current={fatConsumed} target={fatTarget} color="#ef4444" />
            </div>
          </div>
        </motion.div>

        {/* Weekly calories */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card p-5 mb-4"
        >
          {/* Week nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setWeekOffset((w) => w - 1)} className="btn btn-ghost p-2 text-slate-400">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-medium text-white">{thisWeekLabel()}</span>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              disabled={weekOffset >= 0}
              className="btn btn-ghost p-2 text-slate-400 disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-900/50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-white font-mono">{weeklyAvgCalories}</p>
              <p className="text-xs text-slate-500">Avg kcal/day</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-3 text-center">
              <p className={`text-xl font-bold font-mono ${weekCompliance >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {weekCompliance}%
              </p>
              <p className="text-xs text-slate-500">On target</p>
            </div>
          </div>

          {/* Bar chart */}
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                  formatter={(value: number) => [`${value} kcal`, '']}
                />
                <Bar dataKey="consumed" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Weight trend */}
        {weightLogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-5 mb-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingDown size={18} className="text-slate-400" />
                <span className="text-sm font-semibold text-white">Weight Trend</span>
              </div>
              {weightTrend !== null && (
                <span className={`badge ${parseFloat(weightTrend) < 0 ? 'badge-emerald' : parseFloat(weightTrend) > 0 ? 'badge-amber' : 'badge-slate'}`}>
                  {parseFloat(weightTrend) < 0 ? '' : '+'}{weightTrend} kg
                </span>
              )}
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightLogs.map((l) => ({ date: new Date(l.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), weight: l.weight_input }))} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} domain={['dataMin-1', 'dataMax+1']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#f1f5f9' }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#0f172a', stroke: '#10b981', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Weekly macro avg */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Flame size={18} className="text-slate-400" />
            <span className="text-sm font-semibold text-white">Weekly Average</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Protein', value: Math.round(weekData.reduce((s, d) => s + d.protein, 0) / (weekData.filter(d => d.protein > 0).length || 1)), color: '#10b981', unit: 'g' },
              { label: 'Carbs', value: Math.round(weekData.reduce((s, d) => s + d.carbs, 0) / (weekData.filter(d => d.carbs > 0).length || 1)), color: '#f59e0b', unit: 'g' },
              { label: 'Fat', value: Math.round(weekData.reduce((s, d) => s + d.fat, 0) / (weekData.filter(d => d.fat > 0).length || 1)), color: '#ef4444', unit: 'g' },
            ].map(({ label, value, color, unit }) => (
              <div key={label} className="bg-slate-900/50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold font-mono" style={{ color }}>{value}{unit}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
