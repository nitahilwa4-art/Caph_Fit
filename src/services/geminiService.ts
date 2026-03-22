import { GoogleGenAI, Type } from "@google/genai";

// Initialize AI service, but don't crash immediately if key is missing
let ai: GoogleGenAI | null = null;
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn("VITE_GEMINI_API_KEY is not set. AI features will not work. Please add it to your .env file.");
}

// Helper to check if AI is available
const checkAIAvailability = () => {
    if (!ai) {
        throw new Error("Gemini AI is not configured. Please add VITE_GEMINI_API_KEY to your .env file.");
    }
    return ai;
};

export interface NutritionResult {
  food_name: string;
  portion_grams: number;
  portion_description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  hidden_calories_warning: string | null;
  reasoning: string;
}

export async function parseNutritionLog(
  input: string,
  imageBase64: string | null,
  userProfile: any,
  userPreferences: any,
): Promise<NutritionResult> {
  const isCut = userProfile?.goal_type === "cut";
  const isBulk = userProfile?.goal_type === "bulk";
  const dietaryRestrictions = userPreferences?.dietary_restrictions || [];

  const systemInstruction = `You are an expert AI nutritionist with deep knowledge of Indonesian and Southeast Asian cuisine.
Analyze the user's food input (text description and/or image).

## USER CONTEXT
- Goal: ${userProfile?.goal_type || "maintain"}
- Dietary restrictions: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(", ") : "None"}
${isCut ? "- CUT PHASE: Overestimate hidden calories (oils, sauces, frying) rather than underestimate." : ""}
${isBulk ? "- BULK PHASE: Be generous with estimates. Underestimating hurts their surplus." : ""}

## PORTION ESTIMATION RULES (CRITICAL)
When estimating from photo alone:
1. Estimate the weight in GRAMS based on these standard references:
   - 1 adult fist ≈ 200-250g (rice, noodles, salad)
   - 1 palm (without fingers) ≈ 115-170g (meat, fish, tofu)
   - 1 cupped hand ≈ 30g (nuts, chips)
   - 1 thumb ≈ 15g (butter, cheese, nut butter)
   - Standard plate: 25cm diameter, ~1.5-2cm food height ≈ 300-400g
   - 1 scoop of rice ≈ 150g
   - 1 piece of fried chicken (medium) ≈ 150-200g
   - 1 bowl of Soto/Rawon/Nasi Goreng ≈ 400-500g
   - 1 slice of bread ≈ 30g
   - 1 egg (large) ≈ 50-60g
   - 1 banana ≈ 120g, 1 apple ≈ 180g

2. ALWAYS state your portion estimate clearly in both grams AND descriptive terms (e.g., "~300g / 2 scoops of rice + sides")

3. For text input, parse the description carefully:
   - "2 eggs" = 2 × 50-60g = 100-120g
   - "1 plate nasi goreng" = 400-500g
   - "secukupnya" or "sedikit" = assume standard small serving

## HIDDEN CALORIES (especially for CUT users)
Actively look for and flag:
- Cooking oil used in frying (can add 100-200+ kcal)
- Coconut milk in soups/sauces (santannya)
- Sugar in drinks, sauces, marinades
- Saus sambal, kecap manis, mayo
- Crispy/fried coatings on foods
- Butter, margarine, cooking cream

## INDONESIAN FOOD EXPERTISE
Common dishes - know their typical nutrition:
- Nasi Goreng: ~500-650 kcal (with egg, tanpa nasi banyak)
- Soto Ayam: ~350-450 kcal per bowl
- Rendang: ~350-450 kcal per portion (high fat)
- Ayam Geprek: ~400-500 kcal
- Indomie: ~400-450 kcal per pack
- Es Teh Manis: ~100-150 kcal (depends on sugar)
- Es Jeruk: ~80-120 kcal
- Martabak: ~400-600 kcal per slice

## CONFIDENCE LEVEL
- HIGH: Food is clearly visible, portion is obvious, well-known food
- MEDIUM: Some ambiguity in portion size, or less common food
- LOW: Very unclear from photo alone, or mixed dishes

## OUTPUT FORMAT
Return valid JSON with all fields. Be honest about your confidence.`;

  const parts: any[] = [];
  if (imageBase64) {
    const match = imageBase64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      });
    }
  }

  const textPrompt = input
    ? `Analyze this food: "${input}"`
    : "Analyze this food in the image. Estimate the portion size carefully.";

  parts.push({ text: textPrompt });

  const aiService = checkAIAvailability();

  const response = await aiService.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          food_name: {
            type: Type.STRING,
            description: "Name of the meal or food item in Bahasa Indonesia if applicable",
          },
          portion_grams: {
            type: Type.NUMBER,
            description: "Estimated portion size in GRAMS (integer)",
          },
          portion_description: {
            type: Type.STRING,
            description: "Human-readable description of the portion (e.g., '~300g / 2 scoops rice + side dishes')",
          },
          calories: {
            type: Type.NUMBER,
            description: "Total estimated calories for the entire portion",
          },
          protein: {
            type: Type.NUMBER,
            description: "Total protein in grams for the entire portion",
          },
          carbs: {
            type: Type.NUMBER,
            description: "Total carbohydrates in grams for the entire portion",
          },
          fat: {
            type: Type.NUMBER,
            description: "Total fat in grams for the entire portion",
          },
          confidence: {
            type: Type.STRING,
            enum: ["HIGH", "MEDIUM", "LOW"],
            description: "How confident you are in this estimate",
          },
          hidden_calories_warning: {
            type: Type.STRING,
            description: "Warning about potential hidden calories if any, or null if none detected",
          },
          reasoning: {
            type: Type.STRING,
            description: "Detailed explanation of how you estimated, what you assumed, and what you're unsure about",
          },
        },
        required: [
          "food_name",
          "portion_grams",
          "portion_description",
          "calories",
          "protein",
          "carbs",
          "fat",
          "confidence",
          "hidden_calories_warning",
          "reasoning",
        ],
      },
    },
  });

  if (!response.text) throw new Error("Failed to generate nutrition data");

  const result = JSON.parse(response.text);

  // Validate and sanitize
  return {
    ...result,
    portion_grams: Math.round(result.portion_grams) || 100,
    calories: Math.round(result.calories) || 0,
    protein: Math.round(result.protein * 10) / 10 || 0,
    carbs: Math.round(result.carbs * 10) / 10 || 0,
    fat: Math.round(result.fat * 10) / 10 || 0,
  };
}

export async function generateDailyHabits(
  userProfile: any,
  userPreferences: any,
) {
  const goal = userProfile?.goal_type || "maintain";
  const digestion = userPreferences?.digestion_speed || "normal";

  const systemInstruction = `You are an elite AI health coach.
Generate 3-5 personalized daily habits for the user based on their profile.
Goal: ${goal}
Digestion Speed: ${digestion}

Make the habits actionable, specific, and directly related to their goals.
For example, if they are cutting, suggest drinking water before meals. If bulking with slow digestion, suggest liquid calories.
`;

  const aiService = checkAIAvailability();

  const response = await aiService.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Generate my daily habits for today.",
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.STRING,
              description: "A unique short identifier for the habit",
            },
            text: {
              type: Type.STRING,
              description:
                "The habit text (e.g., 'Drink 500ml water before lunch')",
            },
            reason: {
              type: Type.STRING,
              description: "Brief reason why this helps their specific goal",
            },
          },
          required: ["id", "text", "reason"],
        },
      },
    },
  });

  if (!response.text) throw new Error("Failed to generate habits");
  return JSON.parse(response.text);
}

export async function generateAdaptiveWorkout(
  userProfile: any,
  userPreferences: any,
  fatigueLevel: number,
) {
  const equipment =
    userPreferences?.equipment_available?.join(", ") || "Bodyweight only";

  const systemInstruction = `You are an elite AI personal trainer.
Generate a workout routine for today based strictly on the user's available equipment: [${equipment}].
User Goal: ${userProfile?.goal_type || "maintain"}.
Current Fatigue Level (1-10): ${fatigueLevel}.

If fatigue is high (8-10), reduce volume (sets/reps) and intensity (RPE).
If fatigue is low (1-4), push for progressive overload.
DO NOT suggest exercises that require equipment the user does not have.
`;

  const aiService = checkAIAvailability();

  const response = await aiService.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Generate today's workout session.",
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          routine_name: {
            type: Type.STRING,
            description:
              "Name of the workout (e.g., 'Upper Body Push', 'Light Recovery Flow')",
          },
          exercises: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                sets: { type: Type.NUMBER },
                reps: {
                  type: Type.STRING,
                  description: "e.g., '8-12' or 'To failure'",
                },
                rpe: {
                  type: Type.NUMBER,
                  description: "Rate of Perceived Exertion (1-10)",
                },
              },
              required: ["name", "sets", "reps", "rpe"],
            },
          },
          coach_notes: {
            type: Type.STRING,
            description:
              "Brief advice for today's session based on fatigue and goals.",
          },
        },
        required: ["routine_name", "exercises", "coach_notes"],
      },
    },
  });

  if (!response.text) throw new Error("Failed to generate workout");
  return JSON.parse(response.text);
}

export async function generateAIAnalysis(
  userProfile: any,
  userPreferences: any,
  dailyLogs: any[],
  workoutHistory: any[],
) {
  const systemInstruction = `You are an elite AI health coach.
Analyze the user's progress based on their profile, preferences, daily logs (nutrition, weight, habits), and workout history.
Provide a comprehensive analysis of their progress towards their goal of ${userProfile?.goal_type || "maintain"}.
Give specific, actionable recommendations for nutrition, training, and habit adjustments.
`;

  const aiService = checkAIAvailability();

  const response = await aiService.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this data:
Profile: ${JSON.stringify(userProfile)}
Preferences: ${JSON.stringify(userPreferences)}
Daily Logs: ${JSON.stringify(dailyLogs.slice(-30))}
Workout History: ${JSON.stringify(workoutHistory.slice(-10))}
`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: {
            type: Type.STRING,
            description: "Comprehensive analysis of progress",
          },
          recommendations: {
            type: Type.OBJECT,
            properties: {
              nutrition: { type: Type.STRING },
              training: { type: Type.STRING },
              habits: { type: Type.STRING },
            },
            required: ["nutrition", "training", "habits"],
          },
        },
        required: ["analysis", "recommendations"],
      },
    },
  });

  if (!response.text) throw new Error("Failed to generate AI analysis");
  return JSON.parse(response.text);
}
