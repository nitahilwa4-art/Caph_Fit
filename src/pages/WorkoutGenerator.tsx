import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getUserProfile,
  getUserPreferences,
  saveWorkoutSession,
} from "../services/dbService";
import { generateAdaptiveWorkout } from "../services/geminiService";
import {
  Dumbbell,
  ArrowLeft,
  Loader2,
  Activity,
  CheckCircle2,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
    setSessionId(null);

    try {
      const profile = await getUserProfile(user.uid);
      const prefs = await getUserPreferences(user.uid);

      const generated = await generateAdaptiveWorkout(
        profile,
        prefs,
        fatigueLevel,
      );

      const workoutWithCompletion = {
        ...generated,
        exercises: generated.exercises.map((e: any) => ({
          ...e,
          completed: false,
        })),
      };
      setWorkout(workoutWithCompletion);

      // Save to Firestore and get ID
      const newSessionId = Date.now().toString();
      setSessionId(newSessionId);

      await saveWorkoutSession({
        id: newSessionId,
        userId: user.uid,
        date: new Date().toISOString().split("T")[0],
        routine_name: generated.routine_name,
        fatigue_level: fatigueLevel,
        exercises: workoutWithCompletion.exercises,
        completed: false,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error generating workout:", error);
      alert("Failed to generate workout. Please try again.");
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

    // Update in Firestore
    try {
      await saveWorkoutSession({
        id: sessionId,
        userId: user.uid,
        date: new Date().toISOString().split("T")[0],
        routine_name: updatedWorkout.routine_name,
        fatigue_level: fatigueLevel,
        exercises: updatedExercises,
        completed: updatedExercises.every((e: any) => e.completed),
      });
    } catch (error) {
      console.error("Error updating workout:", error);
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
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-900/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <header className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-400" />
          </button>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Adaptive Workout
          </h1>
        </header>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 md:p-8 mb-8"
        >
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <label className="block text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" /> Current Fatigue
                Level
              </label>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-emerald-400 font-mono">
                  {fatigueLevel}
                </span>
                <span className="text-sm text-slate-500">/10</span>
              </div>
            </div>

            <div className="relative pt-2 pb-6">
              <input
                type="range"
                min="1"
                max="10"
                value={fatigueLevel}
                onChange={(e) => setFatigueLevel(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
              />
              <div className="flex justify-between text-xs font-medium text-slate-500 mt-4 uppercase tracking-wider">
                <span className={fatigueLevel <= 3 ? "text-emerald-400" : ""}>
                  Fresh
                </span>
                <span
                  className={
                    fatigueLevel > 3 && fatigueLevel <= 7
                      ? "text-amber-400"
                      : ""
                  }
                >
                  Normal
                </span>
                <span className={fatigueLevel > 7 ? "text-red-400" : ""}>
                  Exhausted
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="btn-premium w-full flex items-center justify-center gap-2 py-4 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Generating
                Routine...
              </>
            ) : (
              <>
                <Dumbbell className="w-5 h-5" /> Generate Workout
              </>
            )}
          </button>
        </motion.div>

        <AnimatePresence>
          {workout && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 md:p-8 border-emerald-500/20 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />

              <div className="mb-8 border-b border-slate-800/50 pb-6">
                <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
                  {workout.routine_name}
                </h2>
                <div className="flex items-start gap-3 bg-slate-900/50 rounded-xl p-5 border border-slate-800/50 mb-6">
                  <Activity className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Coach Notes
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {workout.coach_notes}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400 font-medium">
                      Workout Progress
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {Math.round(
                        (workout.exercises.filter((e: any) => e.completed)
                          .length /
                          workout.exercises.length) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(workout.exercises.filter((e: any) => e.completed).length / workout.exercises.length) * 100}%`,
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>

              {workout.exercises.every((e: any) => e.completed) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-8 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center"
                >
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Workout Complete!
                  </h3>
                  <p className="text-emerald-400/80">
                    Great job crushing today's session. Your progress has been
                    saved.
                  </p>
                </motion.div>
              )}

              <div className="space-y-4">
                {workout.exercises.map((exercise: any, index: number) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={index}
                    className={`bg-slate-900/30 border rounded-2xl p-5 flex items-center justify-between group transition-all duration-300 ${exercise.completed ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-800/50 hover:bg-slate-800/50 hover:border-emerald-500/30"}`}
                  >
                    <div>
                      <h3
                        className={`text-lg font-bold mb-2 transition-colors ${exercise.completed ? "text-slate-500 line-through" : "text-white group-hover:text-emerald-400"}`}
                      >
                        {exercise.name}
                      </h3>
                      <div className="flex flex-wrap gap-3 md:gap-6 text-sm text-slate-400">
                        <span className="flex items-center gap-1.5 bg-slate-950/50 px-3 py-1 rounded-lg border border-slate-800/50">
                          <span className="text-emerald-400 font-bold font-mono text-base">
                            {exercise.sets}
                          </span>{" "}
                          sets
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-950/50 px-3 py-1 rounded-lg border border-slate-800/50">
                          <span className="text-emerald-400 font-bold font-mono text-base">
                            {exercise.reps}
                          </span>{" "}
                          reps
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-950/50 px-3 py-1 rounded-lg border border-slate-800/50">
                          RPE{" "}
                          <span className="text-amber-400 font-bold font-mono text-base">
                            {exercise.rpe}
                          </span>
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExercise(index)}
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 ${exercise.completed ? "border-emerald-500 text-emerald-500 bg-emerald-500/20" : "border-slate-700/50 text-slate-600 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10"}`}
                    >
                      <CheckCircle2 className="w-6 h-6" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
