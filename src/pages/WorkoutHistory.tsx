import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getWorkouts } from "../services/dbService";
import { ArrowLeft, Dumbbell, Calendar, CheckCircle2, Clock } from "lucide-react";
import { motion } from "motion/react";

export default function WorkoutHistory() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const data = await getWorkouts(user.uid);
        setWorkouts(data);
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <Link to="/" className="flex items-center gap-2 text-emerald-400 mb-6">
        <ArrowLeft /> Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold text-white mb-8">Workout History</h1>
      
      {loading ? (
        <div className="text-center text-emerald-500">Loading...</div>
      ) : workouts.length === 0 ? (
        <div className="text-center text-slate-400">No workouts found.</div>
      ) : (
        <div className="grid gap-4">
          {workouts.map((workout) => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <Dumbbell className="text-emerald-400 w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{workout.routine_name || 'Workout'}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {workout.date}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {workout.exercises?.length || 0} exercises</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full text-sm font-semibold">
                <CheckCircle2 size={16} /> Completed
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
