import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, getUserPreferences, saveUserProfile, saveUserPreferences } from '../services/dbService';
import { calculateTargetCalories } from '../utils/calculations';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Loader2, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const p = await getUserProfile(user.id.toString());
        const pref = await getUserPreferences(user.id.toString());
        if (p) setProfile(p as any);
        if (pref) setPreferences(pref as any);
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const target_calories = calculateTargetCalories(profile, preferences);
      await saveUserProfile(user.id.toString(), { ...profile, target_calories });
      await saveUserPreferences(user.id.toString(), preferences);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 relative overflow-hidden"
    >
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-3xl mx-auto relative z-10">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-slate-400" />
            </button>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-emerald-500" />
              Settings
            </h1>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="btn-premium flex items-center gap-2 py-2 px-6"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </header>

        <div className="space-y-8">
          {/* Profile Settings */}
          <div className="glass-card p-6 md:p-8 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-6 border-b border-slate-800 pb-4">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Gender</label>
                <select 
                  value={profile.gender}
                  onChange={e => setProfile({...profile, gender: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Date of Birth</label>
                <input 
                  type="date" 
                  value={profile.dob}
                  onChange={e => setProfile({...profile, dob: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Height (cm)</label>
                <input 
                  type="number" 
                  value={profile.height}
                  onChange={e => setProfile({...profile, height: Number(e.target.value)})}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Target Weight (kg)</label>
                <input 
                  type="number" 
                  value={profile.target_weight}
                  onChange={e => setProfile({...profile, target_weight: Number(e.target.value)})}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-2">Primary Goal</label>
                <div className="grid grid-cols-3 gap-3">
                  {['cut', 'maintain', 'bulk'].map(goal => (
                    <button
                      key={goal}
                      onClick={() => setProfile({...profile, goal_type: goal})}
                      className={`p-3 rounded-xl border capitalize transition-all ${
                        profile.goal_type === goal 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                          : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Settings */}
          <div className="glass-card p-6 md:p-8 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-6 border-b border-slate-800 pb-4">Preferences</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Activity Level</label>
                <select 
                  value={preferences.activity_level}
                  onChange={e => setPreferences({...preferences, activity_level: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none"
                >
                  <option value="sedentary">Sedentary (office job, little exercise)</option>
                  <option value="light">Light (light exercise 1-3 days/week)</option>
                  <option value="moderate">Moderate (moderate exercise 3-5 days/week)</option>
                  <option value="active">Active (hard exercise 6-7 days/week)</option>
                  <option value="very_active">Very Active (physical job or training twice a day)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Digestion Speed</label>
                <select 
                  value={preferences.digestion_speed}
                  onChange={e => setPreferences({...preferences, digestion_speed: e.target.value})}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none"
                >
                  <option value="fast">Fast (Hungry often, hard to gain weight)</option>
                  <option value="normal">Normal</option>
                  <option value="slow">Slow (Stay full long, easy to gain weight)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-3">Available Equipment</label>
                <div className="flex flex-wrap gap-2">
                  {equipmentOptions.map(eq => (
                    <button
                      key={eq}
                      onClick={() => toggleEquipment(eq)}
                      className={`px-4 py-2 rounded-full text-sm border transition-all ${
                        preferences.equipment_available.includes(eq)
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {eq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-3">Dietary Restrictions</label>
                <div className="flex flex-wrap gap-2">
                  {dietOptions.map(diet => (
                    <button
                      key={diet}
                      onClick={() => toggleDiet(diet)}
                      className={`px-4 py-2 rounded-full text-sm border transition-all ${
                        preferences.dietary_restrictions.includes(diet)
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-slate-900/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {diet}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
