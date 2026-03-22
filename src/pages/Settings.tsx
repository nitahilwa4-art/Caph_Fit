import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, getUserPreferences, saveUserProfile, saveUserPreferences } from '../services/dbService';
import { calculateTargetCalories } from '../utils/calculations';
import { motion } from 'motion/react';
import { Check, Loader2, User, Target, Utensils, Dumbbell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const equipmentOptions = ['Bodyweight', 'Dumbbells', 'Resistance Bands', 'Full Gym', 'None'];
const dietOptions = ['Vegan', 'Vegetarian', 'Keto', 'Paleo', 'Gluten-Free', 'Dairy-Free'];

const goalLabels: Record<string, string> = {
  cut: 'Cut',
  maintain: 'Maintain',
  bulk: 'Bulk',
};

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    gender: 'male',
    dob: '',
    height: 170,
    starting_weight: 70,
    target_weight: 70,
    goal_type: 'maintain',
  });

  const [preferences, setPreferences] = useState({
    activity_level: 'moderate',
    digestion_speed: 'normal',
    equipment_available: [] as string[],
    dietary_restrictions: [] as string[],
  });

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      const [p, pref] = await Promise.all([
        getUserProfile(user.id.toString()),
        getUserPreferences(user.id.toString()),
      ]);
      if (p) setProfile(p as any);
      if (pref) setPreferences(pref as any);
      setLoading(false);
    };
    loadData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      const target_calories = calculateTargetCalories(profile, preferences);
      await saveUserProfile(user.id.toString(), { ...profile, target_calories });
      await saveUserPreferences(user.id.toString(), preferences);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleArray = (
    setter: React.Dispatch<React.SetStateAction<typeof preferences>>,
    field: 'equipment_available' | 'dietary_restrictions',
    value: string
  ) => {
    setter((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  if (loading) {
    return (
      <div className="page flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="section">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="text-sm text-slate-500 mt-1">{user?.name}</p>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 mb-4"
        >
          <div className="flex items-center gap-3 mb-5">
            <User size={18} className="text-slate-400" />
            <span className="text-sm font-semibold text-white">Body Stats</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Gender</label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                className="input"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Height (cm)</label>
              <input
                type="number"
                value={profile.height}
                onChange={(e) => setProfile({ ...profile, height: Number(e.target.value) })}
                className="input font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Current (kg)</label>
              <input
                type="number"
                value={profile.starting_weight}
                onChange={(e) => setProfile({ ...profile, starting_weight: Number(e.target.value) })}
                className="input font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Target (kg)</label>
              <input
                type="number"
                value={profile.target_weight}
                onChange={(e) => setProfile({ ...profile, target_weight: Number(e.target.value) })}
                className="input font-mono"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-slate-500">Goal</label>
            <div className="grid grid-cols-3 gap-3">
              {(['cut', 'maintain', 'bulk'] as const).map((goal) => (
                <button
                  key={goal}
                  onClick={() => setProfile({ ...profile, goal_type: goal })}
                  className={`py-3 rounded-xl border text-center font-semibold transition-all ${
                    profile.goal_type === goal
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {goalLabels[goal]}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Activity */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card p-5 mb-4"
        >
          <div className="flex items-center gap-3 mb-5">
            <Dumbbell size={18} className="text-slate-400" />
            <span className="text-sm font-semibold text-white">Activity</span>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Activity Level</label>
              <select
                value={preferences.activity_level}
                onChange={(e) => setPreferences({ ...preferences, activity_level: e.target.value })}
                className="input"
              >
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
                <option value="very_active">Very Active</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Equipment</label>
              <div className="flex flex-wrap gap-2">
                {equipmentOptions.map((eq) => (
                  <button
                    key={eq}
                    onClick={() => toggleArray(setPreferences, 'equipment_available', eq)}
                    className={`chip ${preferences.equipment_available.includes(eq) ? 'chip-selected' : 'chip-unselected'}`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Diet */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5 mb-4"
        >
          <div className="flex items-center gap-3 mb-5">
            <Utensils size={18} className="text-slate-400" />
            <span className="text-sm font-semibold text-white">Diet</span>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Digestion</label>
              <select
                value={preferences.digestion_speed}
                onChange={(e) => setPreferences({ ...preferences, digestion_speed: e.target.value })}
                className="input"
              >
                <option value="fast">Fast</option>
                <option value="normal">Normal</option>
                <option value="slow">Slow</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Restrictions</label>
              <div className="flex flex-wrap gap-2">
                {dietOptions.map((diet) => (
                  <button
                    key={diet}
                    onClick={() => toggleArray(setPreferences, 'dietary_restrictions', diet)}
                    className={`chip ${preferences.dietary_restrictions.includes(diet) ? 'chip-selected' : 'chip-unselected'}`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary w-full py-3.5"
        >
          {saved ? <><Check size={16} /> Saved</> : saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
        </motion.button>

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={logout}
          className="btn btn-ghost w-full py-3.5 mt-3 text-red-400"
        >
          <LogOut size={16} /> Sign Out
        </motion.button>
      </div>
    </div>
  );
}
