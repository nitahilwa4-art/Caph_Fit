export function calculateTargetCalories(profile: any, preferences: any): number {
  if (!profile || !preferences) return 2000;

  // Calculate Age
  let age = 30; // default
  if (profile.dob) {
    const birthDate = new Date(profile.dob);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  // Calculate BMR (Mifflin-St Jeor)
  const weight = profile.starting_weight || 70;
  const height = profile.height || 170;
  
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  if (profile.gender === 'female') {
    bmr -= 161;
  } else {
    bmr += 5; // male or other
  }

  // Activity Multiplier
  let multiplier = 1.2; // sedentary
  switch (preferences.activity_level) {
    case 'light': multiplier = 1.375; break;
    case 'moderate': multiplier = 1.55; break;
    case 'active': multiplier = 1.725; break;
    case 'very_active': multiplier = 1.9; break;
  }

  const tdee = bmr * multiplier;

  // Goal Adjustment
  let target = tdee;
  switch (profile.goal_type) {
    case 'cut': target = tdee - 500; break;
    case 'bulk': target = tdee + 500; break;
    case 'maintain':
    default:
      target = tdee;
      break;
  }

  // Ensure minimum safe calories
  const minCalories = profile.gender === 'female' ? 1200 : 1500;
  return Math.max(Math.round(target), minCalories);
}
