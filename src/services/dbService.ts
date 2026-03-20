import api from './api';

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export async function checkUserProfileExists(userId: string): Promise<boolean> {
  try {
    const response = await api.get('/profile');
    return !!response.data;
  } catch (error) {
    return false;
  }
}

export async function saveUserProfile(userId: string, data: any) {
  try {
    await api.post('/profile', data);
  } catch (error) {
    console.error("Failed to save profile", error);
    throw error;
  }
}

export async function saveUserPreferences(userId: string, data: any) {
  try {
    await api.post('/preference', data);
  } catch (error) {
    console.error("Failed to save preferences", error);
    throw error;
  }
}

export async function getUserProfile(userId: string) {
  try {
    const response = await api.get('/profile');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch profile", error);
    return null;
  }
}

export async function getUserPreferences(userId: string) {
  try {
    const response = await api.get('/preference');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch preferences", error);
    return null;
  }
}

export async function getDailyLog(userId: string, date: string) {
  try {
    const response = await api.get(`/daily-logs/${date}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch daily log", error);
    return null;
  }
}

export async function saveDailyLog(userId: string, date: string, data: any) {
  try {
    await api.post(`/daily-logs/${date}`, data);
  } catch (error) {
    console.error("Failed to save daily log", error);
    throw error;
  }
}

export async function getDailyLogs(userId: string, limitCount: number = 365) {
  try {
    const response = await api.get(`/daily-logs?limit=${limitCount}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch daily logs", error);
    return [];
  }
}

export async function getFoodEntries(userId: string, date?: string) {
  try {
    const url = date ? `/food-entries?date=${date}` : '/food-entries';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch food entries", error);
    return [];
  }
}

export async function saveFoodEntry(data: any) {
  try {
    // In backend we automatically update daily log inside FoodController
    // The data might contain `userId`, but we don't need it for the payload
    await api.post('/food-entries', data);
  } catch (error) {
    console.error("Failed to save food entry", error);
    throw error;
  }
}

export async function getWorkouts(userId: string) {
  try {
    const response = await api.get('/workouts');
    return response.data;
  } catch (error) {
    console.error("Failed to fetch workouts", error);
    return [];
  }
}

export async function saveWorkoutSession(data: any) {
  try {
    await api.post('/workouts', data);
  } catch (error) {
    console.error("Failed to save workout", error);
    throw error;
  }
}
