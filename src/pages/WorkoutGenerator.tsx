import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, getUserPreferences, saveWorkoutSession } from '../services/dbService';
import { generateAdaptiveWorkout } from '../services/geminiService';
import { Dumbbell, Loader2, Activity, CheckCircle2, Flame, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function WorkoutGenerator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fatigueLevel, setFatigueLevel] = useState(5);
  const [loading, setLoading] = useState(false);
  const [workout, setWorkout] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!user) return;
    setLoading(true);
    setWorkout(null);

    try {
      const profile = await getUserProfile(user.id.toString());
      const prefs = await getUserPreferences(user.id.toString());
      const generated = await generateAdaptiveWorkout(profile, prefs, fatigueLevel);

      const workoutWithCompletion = {
        ...generated,
        exercises: generated.exercises.map((e: any) => ({ ...e, completed: false })),
      };
      setWorkout(workoutWithCompletion);
      const newSessionId = Date.now().toString();
      setSessionId(newSessionId);

      await saveWorkoutSession({
        id: newSessionId,
        userId: user.id.toString(),
        date: new Date().toISOString().split('T')[0],
        routine_name: generated.routine_name,
        fatigue_level: fatigueLevel,
        exercises: workoutWithCompletion.exercises,
        completed: false,
      });
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExercise = async (index: number) => {
    if (!workout || !sessionId || !user) return;
    const updatedExercises = [...workout.exercises];
    updatedExercises[index].completed = !updatedExercises[index].completed;
    const updatedWorkout = { ...workout, exercises: updatedExercises };
    setWorkout(updatedWorkout);

    await saveWorkoutSession({
      id: sessionId,
      userId: user.id.toString(),
      date: new Date().toISOString().split('T')[0],
      routine_name: updatedWorkout.routine_name,
      fatigue_level: fatigueLevel,
      exercises: updatedExercises,
      completed: updatedExercises.every((e: any) => e.completed),
    });
  };

  const completedCount = workout?.exercises?.filter((e: any) => e.completed).length || 0;
  const totalCount = workout?.exercises?.length || 0;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allDone = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="page">
      <div className="section">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="btn btn-ghost p-2">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Workout</h1>
            <p className="text-xs text-slate-500">AI-powered routine</p>
          </div>
        </div>

        {/* Fatigue Slider */}
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-amber-400" />
              <span className="text-sm font-medium text-slate-300">Energy Level</span>
            </div>
            <span className={`text-2xl font-bold font-mono ${
              fatigueLevel <= 3 ? 'text-emerald-400' : fatigueLevel <= 7 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {fatigueLevel}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={fatigueLevel}
            onChange={(e) => setFatigueLevel(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-2"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span className={fatigueLevel <= 3 ? 'text-emerald-400' : ''}>Fresh</span>
            <span className={fatigueLevel > 3 && fatigueLevel <= 7 ? 'text-amber-400' : ''}>Normal</span>
            <span className={fatigueLevel > 7 ? 'text-red-400' : ''}>Exhausted</span>
          </div>
        </div>

        {/* Generate Button */}
        {!workout && (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn btn-primary w-full py-4 mb-4"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Generating...</>
            ) : (
              <><Dumbbell size={18} /> Generate Workout</>
            )}
          </button>
        )}

        {/* Workout Result */}
        <AnimatePresence>
          {workout && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Header */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-white">{workout.routine_name}</h2>
                  <span className="badge badge-emerald">
                    {completedCount}/{totalCount}
                  </span>
                </div>

                {workout.coach_notes && (
                  <div className="flex items-start gap-2 mb-4">
                    <Activity size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-400 leading-relaxed">{workout.coach_notes}</p>
                  </div>
                )}

                {/* Progress */}
                <div className="progress-track">
                  <motion.div
                    className="progress-fill"
                    animate={{ width: `${progressPercent}%` }}
                    style={{ backgroundColor: allDone ? '#10b981' : '#10b981' }}
                  />
                </div>
              </div>

              {/* Completion Banner */}
              {allDone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card p-5 border border-emerald-500/20"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-emerald-400" />
                    <div>
                      <p className="font-semibold text-white">Workout Complete!</p>
                      <p className="text-xs text-slate-400 mt-0.5">Great job. Progress saved.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Exercises */}
              {workout.exercises.map((exercise: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className={`card p-4 flex items-center gap-4 cursor-pointer transition-colors ${
                    exercise.completed ? 'opacity-60' : ''
                  }`}
                  onClick={() => toggleExercise(index)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    exercise.completed ? 'bg-emerald-500/20' : 'bg-slate-800'
                  }`}>
                    <CheckCircle2
                      size={20}
                      className={exercise.completed ? 'text-emerald-400' : 'text-slate-600'}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${exercise.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                      {exercise.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500">
                        <span className="text-slate-300 font-medium">{exercise.sets}</span> sets
                      </span>
                      <span className="text-xs text-slate-500">
                        <span className="text-slate-300 font-medium">{exercise.reps}</span> reps
                      </span>
                      <span className="badge badge-slate text-xs">
                        RPE {exercise.rpe}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Reset */}
              {!allDone && (
                <button
                  onClick={() => { setWorkout(null); setSessionId(null); }}
                  className="btn btn-outline w-full mt-2"
                >
                  Start Over
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
