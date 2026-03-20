import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { saveUserProfile, saveUserPreferences } from '../services/dbService';
import { calculateTargetCalories } from '../utils/calculations';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';

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
    work_hours: '09:00-17:00',
    dietary_restrictions: [] as string[],
  });

  const equipmentOptions = ['Bodyweight', 'Dumbbells', 'Resistance Bands', 'Full Gym', 'Smart Kitchen Appliances'];
  const dietOptions = ['Vegan', 'Vegetarian', 'Keto', 'Paleo', 'Gluten-Free', 'Dairy-Free', 'None'];

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const target_calories = calculateTargetCalories(profile, preferences);
      await saveUserProfile(user.uid, { ...profile, target_calories });
      await saveUserPreferences(user.uid, preferences);
      await checkProfile();
      navigate('/');
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEquipment = (eq: string) => {
    setPreferences(prev => ({
      ...prev,
      equipment_available: prev.equipment_available.includes(eq)
        ? prev.equipment_available.filter(e => e !== eq)
        : [...prev.equipment_available, eq]
    }));
  };

  const toggleDiet = (diet: string) => {
    setPreferences(prev => ({
      ...prev,
      dietary_restrictions: prev.dietary_restrictions.includes(diet)
        ? prev.dietary_restrictions.filter(d => d !== diet)
        : [...prev.dietary_restrictions, diet]
    }));
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 flex justify-center items-center relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-900/20 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl glass-card p-8 md:p-10 relative z-10"
      >
        <div className="flex justify-between items-center mb-8 border-b border-slate-800/50 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">OmniFit Setup</h1>
            <p className="text-sm text-slate-400">Let's personalize your experience.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-mono font-bold text-xl">{step}</span>
            <span className="text-slate-500 text-sm">/ 4</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-900/50 rounded-full h-1.5 mb-10 overflow-hidden">
          <motion.div 
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full"
            initial={{ width: `${((step - 1) / 4) * 100}%` }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="min-h-[350px] relative">
          <AnimatePresence mode="wait" custom={1}>
            {step === 1 && (
              <motion.div 
                key="step1"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Physique Goals</h2>
                  <label className="block text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Primary Goal</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['cut', 'maintain', 'bulk'].map(goal => (
                      <button
                        key={goal}
                        onClick={() => setProfile({ ...profile, goal_type: goal })}
                        className={`p-4 rounded-xl border capitalize font-bold transition-all duration-300 ${
                          profile.goal_type === goal 
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Gender</label>
                    <select 
                      value={profile.gender}
                      onChange={e => setProfile({...profile, gender: e.target.value})}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Date of Birth</label>
                    <input 
                      type="date" 
                      value={profile.dob}
                      onChange={e => setProfile({...profile, dob: e.target.value})}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Height (cm)</label>
                    <input 
                      type="number" 
                      value={profile.height}
                      onChange={e => setProfile({...profile, height: Number(e.target.value)})}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Current (kg)</label>
                    <input 
                      type="number" 
                      value={profile.starting_weight}
                      onChange={e => setProfile({...profile, starting_weight: Number(e.target.value)})}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Target (kg)</label>
                    <input 
                      type="number" 
                      value={profile.target_weight}
                      onChange={e => setProfile({...profile, target_weight: Number(e.target.value)})}
                      className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="space-y-8"
              >
                <h2 className="text-xl font-bold text-white mb-6">Metabolic & Digestion Pacing</h2>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Activity Level</label>
                  <select 
                    value={preferences.activity_level}
                    onChange={e => setPreferences({...preferences, activity_level: e.target.value})}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all"
                  >
                    <option value="sedentary">Sedentary (Office job, little exercise)</option>
                    <option value="light">Light (Light exercise 1-3 days/week)</option>
                    <option value="moderate">Moderate (Moderate exercise 3-5 days/week)</option>
                    <option value="active">Active (Heavy exercise 6-7 days/week)</option>
                    <option value="highly_active">Highly Active (Physical job + training)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Digestion Speed</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['fast', 'normal', 'slow'].map(speed => (
                      <button
                        key={speed}
                        onClick={() => setPreferences({ ...preferences, digestion_speed: speed })}
                        className={`p-4 rounded-xl border capitalize font-bold transition-all duration-300 ${
                          preferences.digestion_speed === speed 
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
                      >
                        {speed}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-3 font-medium">Helps AI suggest meal timing and liquid calories.</p>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Equipment Inventory</h2>
                  <p className="text-sm text-slate-400 mb-6">Select what you have access to for workouts and meal prep.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {equipmentOptions.map(eq => (
                    <button
                      key={eq}
                      onClick={() => toggleEquipment(eq)}
                      className={`p-4 rounded-xl border text-left font-medium transition-all duration-300 ${
                        preferences.equipment_available.includes(eq)
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          preferences.equipment_available.includes(eq) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 bg-slate-800/50'
                        }`}>
                          {preferences.equipment_available.includes(eq) && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                        </div>
                        {eq}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="space-y-8"
              >
                <h2 className="text-xl font-bold text-white mb-6">Lifestyle Schedule</h2>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Typical Work/School Hours</label>
                  <input 
                    type="text" 
                    placeholder="e.g., 09:00-17:00"
                    value={preferences.work_hours}
                    onChange={e => setPreferences({...preferences, work_hours: e.target.value})}
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Dietary Restrictions</label>
                  <div className="flex flex-wrap gap-2.5">
                    {dietOptions.map(diet => (
                      <button
                        key={diet}
                        onClick={() => toggleDiet(diet)}
                        className={`px-5 py-2.5 rounded-full border text-sm font-bold transition-all duration-300 ${
                          preferences.dietary_restrictions.includes(diet)
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
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

        <div className="flex justify-between mt-10 pt-6 border-t border-slate-800/50">
          {step > 1 ? (
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : <div></div>}
          
          {step < 4 ? (
            <button 
              onClick={handleNext}
              className="btn-premium flex items-center gap-2 px-8 py-3"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="btn-premium flex items-center gap-2 px-8 py-3 disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Check className="w-4 h-4" /> Complete Setup</>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
