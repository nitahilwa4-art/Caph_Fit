import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserProfile, getUserPreferences, getDailyLogs, getWorkouts } from "../services/dbService";
import { generateAIAnalysis } from "../services/geminiService";
import { motion } from "motion/react";
import { Sparkles, Activity, Dumbbell, Apple, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function AIAnalysis() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [profile, preferences, logs, workouts] = await Promise.all([
          getUserProfile(user.id.toString()),
          getUserPreferences(user.id.toString()),
          getDailyLogs(user.id.toString()),
          getWorkouts(user.id.toString()),
        ]);
        const result = await generateAIAnalysis(profile, preferences, logs, workouts);
        setAnalysis(result);
      } catch (error) {
        console.error("Error generating analysis:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-emerald-500">
        <Sparkles className="w-10 h-10 animate-pulse mb-4" />
        <p className="text-slate-400 font-medium">Analyzing your progress...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8"
    >
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="text-slate-400 hover:text-white flex items-center gap-2 mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <Sparkles className="text-emerald-400" /> AI Health Analysis
        </h1>
        
        {analysis && (
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl">
              <h2 className="text-xl font-semibold text-white mb-4">Overview</h2>
              <p className="text-slate-300 leading-relaxed">{analysis.analysis}</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-card p-6 rounded-2xl">
                <Apple className="text-emerald-400 w-8 h-8 mb-4" />
                <h3 className="font-semibold text-white mb-2">Nutrition</h3>
                <p className="text-sm text-slate-400">{analysis.recommendations.nutrition}</p>
              </div>
              <div className="glass-card p-6 rounded-2xl">
                <Dumbbell className="text-emerald-400 w-8 h-8 mb-4" />
                <h3 className="font-semibold text-white mb-2">Training</h3>
                <p className="text-sm text-slate-400">{analysis.recommendations.training}</p>
              </div>
              <div className="glass-card p-6 rounded-2xl">
                <Activity className="text-emerald-400 w-8 h-8 mb-4" />
                <h3 className="font-semibold text-white mb-2">Habits</h3>
                <p className="text-sm text-slate-400">{analysis.recommendations.habits}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
