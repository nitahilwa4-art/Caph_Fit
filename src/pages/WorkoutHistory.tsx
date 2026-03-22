import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getWorkouts } from '../services/dbService';
import { Dumbbell, Calendar, Clock, Loader2, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import EmptyState from '../components/ui/EmptyState';

export default function WorkoutHistory() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const data = await getWorkouts(user.id.toString());
      setWorkouts(data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="page flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="section">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Workouts</h1>
          <p className="text-sm text-slate-500 mt-1">{workouts.length} sessions completed</p>
        </div>

        {workouts.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="No workouts yet"
            description="Start your first workout from the home screen"
          />
        ) : (
          <div className="space-y-3">
            {workouts.map((workout, i) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="card p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <Dumbbell size={18} className="text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {workout.routine_name || 'Workout'}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar size={12} />
                        {new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <TrendingUp size={12} />
                        {workout.exercises?.length || 0} exercises
                      </span>
                    </div>
                    {workout.coach_notes && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">{workout.coach_notes}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
