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

export async function parseNutritionLog(
  input: string,
  imageBase64: string | null,
  userProfile: any,
  userPreferences: any,
) {
  const isCut = userProfile?.goal_type === "cut";
  const isBulk = userProfile?.goal_type === "bulk";

  let systemInstruction = `You are an expert AI nutritionist. 
Analyze the user's food input (text and/or image).
User Goal: ${userProfile?.goal_type || "maintain"}.
`;

  if (isCut) {
    systemInstruction += `\nCRITICAL: The user is on a calorie deficit (CUT). You MUST be extremely strict and actively look for "hidden calories" (cooking oils, sauces, butter, dressings) in the image or text. Overestimate slightly rather than underestimate to protect their deficit.`;
  } else if (isBulk) {
    systemInstruction += `\nCRITICAL: The user is on a calorie surplus (BULK). Ensure you do not underestimate the calories. If unsure, provide a conservative estimate so they don't accidentally undereat.`;
  }

  const parts: any[] = [];
  if (imageBase64) {
    // Extract mime type and base64 data
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

  parts.push({ text: input || "Analyze this food." });

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
            description: "Name of the meal or food item",
          },
          calories: {
            type: Type.NUMBER,
            description: "Total estimated calories",
          },
          protein: { type: Type.NUMBER, description: "Total protein in grams" },
          carbs: {
            type: Type.NUMBER,
            description: "Total carbohydrates in grams",
          },
          fat: { type: Type.NUMBER, description: "Total fat in grams" },
          reasoning: {
            type: Type.STRING,
            description:
              "Brief explanation of how you estimated the macros, especially regarding hidden calories.",
          },
        },
        required: [
          "food_name",
          "calories",
          "protein",
          "carbs",
          "fat",
          "reasoning",
        ],
      },
    },
  });

  if (!response.text) throw new Error("Failed to generate nutrition data");
  return JSON.parse(response.text);
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
