import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { saveUserProfile, saveUserPreferences } from '../services/dbService';
import { calculateTargetCalories } from '../utils/calculations';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Check, Loader2, Activity } from 'lucide-react';

const TOTAL_STEPS = 4;

const goalLabels: Record<string, { title: string; desc: string }> = {
  cut: { title: 'Cut', desc: 'Lose fat' },
  maintain: { title: 'Maintain', desc: 'Stay fit' },
  bulk: { title: 'Bulk', desc: 'Build muscle' },
};

const equipmentOptions = ['Bodyweight', 'Dumbbells', 'Resistance Bands', 'Full Gym', 'None'];
const dietOptions = ['Vegan', 'Vegetarian', 'Keto', 'Paleo', 'Gluten-Free', 'Dairy-Free'];

export default function Onboarding() {
  const { user, checkProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const target_calories = calculateTargetCalories(profile, preferences);
      await saveUserProfile(user.id.toString(), { ...profile, target_calories });
      await saveUserPreferences(user.id.toString(), preferences);
      await checkProfile();
      navigate('/');
    } catch (error) {
      console.error('Setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    { title: 'Your Goals', sub: "Let's start with what you want to achieve" },
    { title: 'About You', sub: 'Help us personalize your plan' },
    { title: 'Equipment', sub: "What do you have access to?" },
    { title: 'Preferences', sub: 'Final touches for your experience' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-white font-semibold">CaphFit</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4 mb-2">
          <span className="text-sm font-semibold text-white">{step} of {TOTAL_STEPS}</span>
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mt-4">{stepTitles[step - 1].title}</h2>
        <p className="text-sm text-slate-500 mt-1">{stepTitles[step - 1].sub}</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 py-2"
            >
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Primary Goal</p>
                <div className="grid grid-cols-3 gap-3">
                  {(['cut', 'maintain', 'bulk'] as const).map((goal) => (
                    <button
                      key={goal}
                      onClick={() => setProfile({ ...profile, goal_type: goal })}
                      className={`p-4 rounded-2xl border text-center transition-all ${
                        profile.goal_type === goal
                          ? 'bg-emerald-500/10 border-emerald-500'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <p className={`text-base font-bold ${profile.goal_type === goal ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {goalLabels[goal].title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{goalLabels[goal].desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="text-xs font-medium text-slate-500">Date of Birth</label>
                  <input
                    type="date"
                    value={profile.dob}
                    onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Height', key: 'height', suffix: 'cm', min: 100, max: 250 },
                  { label: 'Current', key: 'starting_weight', suffix: 'kg', min: 30, max: 200 },
                  { label: 'Target', key: 'target_weight', suffix: 'kg', min: 30, max: 200 },
                ].map(({ label, key, suffix, min, max }) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500">{label} ({suffix})</label>
                    <input
                      type="number"
                      min={min}
                      max={max}
                      value={profile[key as keyof typeof profile]}
                      onChange={(e) => setProfile({ ...profile, [key]: Number(e.target.value) })}
                      className="input font-mono text-center"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5 py-2"
            >
              <div className="space-y-3">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Activity Level</label>
                <select
                  value={preferences.activity_level}
                  onChange={(e) => setPreferences({ ...preferences, activity_level: e.target.value })}
                  className="input"
                >
                  <option value="sedentary">Sedentary — Office job, little exercise</option>
                  <option value="light">Light — Exercise 1-3 days/week</option>
                  <option value="moderate">Moderate — Exercise 3-5 days/week</option>
                  <option value="active">Active — Exercise 6-7 days/week</option>
                  <option value="very_active">Very Active — Physical job + training</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Digestion Speed</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['fast', 'normal', 'slow'] as const).map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPreferences({ ...preferences, digestion_speed: speed })}
                      className={`py-3 rounded-xl border text-center font-medium capitalize transition-all ${
                        preferences.digestion_speed === speed
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3 py-2"
            >
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Available Equipment</p>
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
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5 py-2"
            >
              <div className="space-y-3">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dietary Restrictions</label>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 py-6 flex gap-3">
        {step > 1 && (
          <button onClick={() => setStep((s) => s - 1)} className="btn btn-outline">
            <ChevronLeft size={16} /> Back
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button onClick={() => setStep((s) => s + 1)} className="btn btn-primary flex-1">
            Continue <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary flex-1"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Check size={16} /> Complete Setup</>}
          </button>
        )}
      </div>
    </div>
  );
}
