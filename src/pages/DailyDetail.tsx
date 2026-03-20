import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getDailyLog, saveDailyLog } from "../services/dbService";
import FoodTracker from "../components/DailyDetail/FoodTracker";
import ExerciseTracker from "../components/DailyDetail/ExerciseTracker";
import CalorieSummary from "../components/DailyDetail/CalorieSummary";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function DailyDetail() {
  const { user } = useAuth();
  const [log, setLog] = useState<any>(null);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const data = await getDailyLog(user.uid, today);
        setLog(data || { date: today, food: [], exercise: [] });
      }
    };
    fetchData();
  }, [user, today]);

  const updateLog = async (newData: any) => {
    if (!user) return;
    
    // Calculate totals based on the new data
    const updatedFood = newData.food || log?.food || [];
    const updatedExercise = newData.exercise || log?.exercise || [];
    
    const consumed = updatedFood.reduce((acc: number, item: any) => acc + (item.calories || 0), 0);
    const burned = updatedExercise.reduce((acc: number, item: any) => acc + (item.calories || 0), 0);

    const updatedLog = { 
      ...log, 
      ...newData, 
      total_calories_consumed: consumed,
      total_calories_burned: burned
    };
    
    await saveDailyLog(user.uid, today, updatedLog);
    setLog(updatedLog);
  };

  const consumed = log?.food?.reduce((acc: number, item: any) => acc + (item.calories || 0), 0) || 0;
  const burned = log?.exercise?.reduce((acc: number, item: any) => acc + (item.calories || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <Link to="/" className="flex items-center gap-2 text-emerald-400 mb-6"><ArrowLeft /> Back to Dashboard</Link>
      <h1 className="text-3xl font-bold text-white mb-6">Daily Detail: {today}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CalorieSummary consumed={consumed} burned={burned} target={2000} />
        <FoodTracker logs={log?.food || []} onUpdate={(food) => updateLog({ food })} />
        <ExerciseTracker logs={log?.exercise || []} onUpdate={(exercise) => updateLog({ exercise })} />
      </div>
    </div>
  );
}
