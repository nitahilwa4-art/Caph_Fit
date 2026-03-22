import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getUserProfile, getUserPreferences, getDailyLogs, getWorkouts } from "../services/dbService";
import { generateAIAnalysis } from "../services/geminiService";
import { motion } from "motion/react";
import { Sparkles, Activity, Dumbbell, Apple, ChevronLeft } from "lucide-react";

export default function AIAnalysis() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      className="page"
    >
      <div className="section">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="btn btn-ghost p-2">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-emerald-400" />
            <h1 className="text-xl font-bold text-white">AI Analysis</h1>
          </div>
        </div>

        {analysis ? (
          <div className="space-y-4">
            {/* Overview */}
            <div className="card p-5">
              <h2 className="text-base font-semibold text-white mb-3">Overview</h2>
              <p className="text-sm text-slate-400 leading-relaxed">{analysis.analysis}</p>
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              {[
                { icon: Apple, label: 'Nutrition', text: analysis.recommendations.nutrition },
                { icon: Dumbbell, label: 'Training', text: analysis.recommendations.training },
                { icon: Activity, label: 'Habits', text: analysis.recommendations.habits },
              ].map(({ icon: Icon, label, text }) => (
                <div key={label} className="card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={16} className="text-emerald-400" />
                    <span className="text-sm font-semibold text-white">{label}</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-slate-500">No analysis available. Log some data first.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
