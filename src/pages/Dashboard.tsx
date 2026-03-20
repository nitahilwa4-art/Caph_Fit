import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getUserProfile,
  getUserPreferences,
  getDailyLogs,
  saveDailyLog,
} from "../services/dbService";
import { generateDailyHabits } from "../services/geminiService";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  Apple,
  Dumbbell,
  LogOut,
  ChevronRight,
  Scale,
  Sparkles,
  Settings,
  X,
  CheckCircle2,
  ListTodo,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingHabits, setGeneratingHabits] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showHabitsModal, setShowHabitsModal] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  // ... (rest of the component logic remains the same)

  // Add this to the JSX where the checklist was:
  // <button onClick={() => setShowHabitsModal(true)} ...>Open Checklist</button>

  // Add this Modal component:
  const HabitsModal = () => (
    <AnimatePresence>
      {showHabitsModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowHabitsModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card w-full max-w-lg p-6 rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ListTodo className="text-emerald-400" /> Daily Checklist
              </h2>
              <button onClick={() => setShowHabitsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {todayLog?.habits ? (
              <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {todayLog.habits.map((habit: any) => (
                  <li
                    key={habit.id}
                    className={`flex items-start gap-4 p-4 rounded-2xl transition-all border ${habit.completed ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-900/80 border-slate-700/50 hover:border-emerald-500/30'} cursor-pointer`}
                    onClick={() => toggleHabit(habit.id)}
                  >
                    <div className={`mt-0.5 relative flex items-center justify-center w-6 h-6 shrink-0 rounded-lg border-2 transition-colors ${habit.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                      <svg className={`w-4 h-4 text-white transition-opacity ${habit.completed ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <span className={`block font-medium transition-colors ${habit.completed ? "text-slate-500 line-through" : "text-slate-100"}`}>
                        {habit.text}
                      </span>
                      <span className={`text-xs block mt-1 transition-colors ${habit.completed ? "text-slate-600" : "text-slate-400"}`}>
                        {habit.reason}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-10">
                <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-6">Generate your personalized daily habits.</p>
                <button
                  onClick={handleGenerateHabits}
                  disabled={generatingHabits}
                  className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
                >
                  {generatingHabits ? "Generating..." : "Generate Habits"}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ... (rest of the component)


  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const p = await getUserProfile(user.id.toString());
        const pref = await getUserPreferences(user.id.toString());
        const logs = await getDailyLogs(user.id.toString());
        setProfile(p);
        setPreferences(pref);
        setDailyLogs(logs);
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const today = new Date().toISOString().split("T")[0];
  const todayLog = dailyLogs.find((log) => log.date === today) || {};

  const handleGenerateHabits = async () => {
    if (!user || !profile || !preferences) return;
    setGeneratingHabits(true);
    try {
      const newHabits = await generateDailyHabits(profile, preferences);
      const habitsWithStatus = newHabits.map((h: any, index: number) => ({
        ...h,
        id: `${h.id || 'habit'}-${index}-${Date.now()}`,
        completed: false,
      }));

      await saveDailyLog(user.id.toString(), today, {
        ...todayLog,
        habits: habitsWithStatus,
        total_calories_target: todayLog.total_calories_target || 2000,
        total_calories_consumed: todayLog.total_calories_consumed || 0,
      });

      const logs = await getDailyLogs(user.id.toString());
      setDailyLogs(logs);
    } catch (error) {
      console.error("Error generating habits:", error);
    } finally {
      setGeneratingHabits(false);
    }
  };

  const toggleHabit = async (habitId: string) => {
    if (!user || !todayLog.habits) return;

    const updatedHabits = todayLog.habits.map((h: any) =>
      h.id === habitId ? { ...h, completed: !h.completed } : h,
    );

    // Optimistic update
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

  const handleLogWeight = async () => {
    if (!user || !newWeight) return;
    const weightNum = parseFloat(newWeight);
    if (isNaN(weightNum)) return;

    await saveDailyLog(user.id.toString(), today, {
      ...todayLog,
      weight_input: weightNum,
      total_calories_target: todayLog.total_calories_target || profile?.target_calories || 2000,
      total_calories_consumed: todayLog.total_calories_consumed || 0,
    });

    // Refresh logs
    const logs = await getDailyLogs(user.id.toString());
    setDailyLogs(logs);
    setShowWeightModal(false);
    setNewWeight("");
  };

  const macroData = [
    {
      name: "Protein",
      value: todayLog?.total_protein_consumed || 0,
      color: "#10b981",
    },
    {
      name: "Carbs",
      value: todayLog?.total_carbs_consumed || 0,
      color: "#f59e0b",
    },
    { name: "Fat", value: todayLog?.total_fat_consumed || 0, color: "#ef4444" },
  ];

  // If all macros are 0, show a placeholder
  const hasMacros = macroData.some((m) => m.value > 0);
  const displayMacroData = hasMacros
    ? macroData
    : [{ name: "No Data", value: 1, color: "#334155" }];

  const weightData = dailyLogs
    .map((log) => ({
      date: new Date(log.date).toLocaleDateString("en-US", {
        weekday: "short",
      }),
      actual: log.weight_input || null,
      target: profile?.target_weight || null,
    }))
    .filter((log) => log.actual !== null);

  // Fallback to mock data if no weight logs exist yet
  const displayWeightData =
    weightData.length > 0
      ? weightData
      : [
          {
            date: "Mon",
            actual: profile?.starting_weight || 70,
            target: profile?.target_weight || 70,
          },
        ];

  // Calorie Data
  const getCalorieData = () => {
    if (viewMode === 'daily') {
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toISOString().split("T")[0];
      });

      return last30Days.map((date) => {
        const log = dailyLogs.find((l) => l.date === date);
        return {
          date: new Date(date).toLocaleDateString("en-US", { month: 'short', day: 'numeric' }),
          consumed: log?.total_calories_consumed || 0,
          target: log?.total_calories_target || profile?.target_calories || 2000,
        };
      });
    } else {
      // Monthly aggregation
      const months: { [key: string]: { consumed: number, target: number, count: number } } = {};
      dailyLogs.forEach(log => {
        const month = log.date.substring(0, 7); // YYYY-MM
        if (!months[month]) months[month] = { consumed: 0, target: 0, count: 0 };
        months[month].consumed += log.total_calories_consumed || 0;
        months[month].target += log.total_calories_target || profile?.target_calories || 2000;
        months[month].count += 1;
      });

      return Object.keys(months).map(month => ({
        date: new Date(month + '-01').toLocaleDateString("en-US", { month: 'short', year: 'numeric' }),
        consumed: Math.round(months[month].consumed / months[month].count),
        target: Math.round(months[month].target / months[month].count),
      }));
    }
  };

  const calorieData = getCalorieData();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 100, damping: 15 },
    },
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-emerald-500">
        <Activity className="w-10 h-10 animate-pulse mb-4" />
        <p className="text-slate-400 font-medium tracking-wide">
          Loading your dashboard...
        </p>
      </div>
    );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0 }}
      variants={containerVariants}
      className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 relative overflow-hidden"
    >
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.header
          variants={itemVariants}
          className="flex justify-between items-center mb-12"
        >
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tighter flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                <Activity className="text-emerald-400 w-7 h-7" />
              </div>
              OmniFit AI
            </h1>
            <p className="text-slate-400 text-sm mt-3 flex items-center gap-2 font-medium">
              Goal:{" "}
              <span className="px-3 py-1 bg-slate-800/50 rounded-full capitalize text-emerald-400 font-semibold text-xs border border-slate-700/50">
                {profile?.goal_type || 'Maintain'}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/workout"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all font-semibold text-sm"
            >
              <Dumbbell className="w-4 h-4" />
              Workout
            </Link>
            <Link
              to="/workout-history"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all font-semibold text-sm"
            >
              <Activity className="w-4 h-4" />
              History
            </Link>
            <Link
              to="/daily-detail"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all font-semibold text-sm"
            >
              <Activity className="w-4 h-4" />
              Daily Detail
            </Link>
            <button
              onClick={() => setShowHabitsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all font-semibold text-sm"
            >
              <ListTodo className="w-4 h-4" />
              Checklist
            </button>
            <Link
              to="/ai-analysis"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all font-semibold text-sm"
            >
              <Sparkles className="w-4 h-4" />
              AI Analysis
            </Link>
            <Link
              to="/settings"
              className="p-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 rounded-full transition-all text-slate-400 hover:text-white shadow-sm"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <button
              onClick={logout}
              className="p-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 rounded-full transition-all text-slate-400 hover:text-white shadow-sm"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </motion.header>

        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <motion.div
            variants={itemVariants}
            className="glass-card rounded-2xl p-6 lg:p-8"
          >
            <h2 className="text-lg font-semibold text-white mb-6">
              Today's Macros
            </h2>
            <div className="h-64 relative">
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-3xl font-bold text-white">
                  {todayLog?.total_calories_consumed || 0}
                </span>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  / {todayLog?.total_calories_target || profile?.target_calories || 2000} Kcal
                </span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayMacroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={6}
                  >
                    {displayMacroData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        style={{
                          filter: `drop-shadow(0px 4px 8px ${entry.color}40)`,
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      backdropFilter: "blur(8px)",
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                    }}
                    itemStyle={{ color: "#f8fafc", fontWeight: 500 }}
                    cursor={false}
                    formatter={(value: number) =>
                      hasMacros ? [`${value}g`, ""] : ["No data yet", ""]
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-6">
              {macroData.map((m) => (
                <div key={m.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{
                      backgroundColor: m.color,
                      boxShadow: `0 0 10px ${m.color}80`,
                    }}
                  />
                  <span className="text-sm font-medium text-slate-300">
                    {m.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="glass-card rounded-2xl p-6 lg:p-8 relative"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white">
                Weight Progress
              </h2>
              <button
                onClick={() => setShowWeightModal(true)}
                className="flex items-center gap-2 text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors border border-emerald-500/20"
              >
                <Scale className="w-3.5 h-3.5" /> Log Weight
              </button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={displayWeightData}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    domain={["dataMin - 2", "dataMax + 2"]}
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      backdropFilter: "blur(8px)",
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                    }}
                    itemStyle={{ color: "#f8fafc", fontWeight: 500 }}
                    cursor={{
                      stroke: "#334155",
                      strokeWidth: 1,
                      strokeDasharray: "5 5",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#020617",
                      stroke: "#10b981",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 6,
                      fill: "#10b981",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    name="Actual Weight"
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Target Weight"
                    opacity={0.5}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>

        <motion.div variants={containerVariants} className="mt-6">
          <motion.div
            variants={itemVariants}
            className="glass-card rounded-2xl p-6 lg:p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-white">
                {viewMode === 'daily' ? 'Daily Calorie Intake' : 'Monthly Calorie Intake'}
              </h2>
              <div className="flex bg-slate-800 rounded-lg p-1">
                <button onClick={() => setViewMode('daily')} className={`px-3 py-1 text-xs rounded-md ${viewMode === 'daily' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Daily</button>
                <button onClick={() => setViewMode('monthly')} className={`px-3 py-1 text-xs rounded-md ${viewMode === 'monthly' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>Monthly</button>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={calorieData}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      backdropFilter: "blur(8px)",
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                    }}
                    itemStyle={{ color: "#f8fafc", fontWeight: 500 }}
                    cursor={{
                      stroke: "#334155",
                      strokeWidth: 1,
                      strokeDasharray: "5 5",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="consumed"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#020617",
                      stroke: "#3b82f6",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 6,
                      fill: "#3b82f6",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    name="Consumed (kcal)"
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#64748b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Target (kcal)"
                    opacity={0.5}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Weight Logging Modal */}
      <AnimatePresence>
        {showWeightModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass-card w-full max-w-sm p-6 rounded-2xl border border-slate-700/50 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                Log Today's Weight
              </h3>
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="e.g. 70.5"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all font-mono text-lg"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWeightModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogWeight}
                  disabled={!newWeight}
                  className="flex-1 btn-premium py-3 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        <HabitsModal />
      </AnimatePresence>
    </motion.div>
  );
}
