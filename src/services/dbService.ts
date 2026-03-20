import { db, auth } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to check if user profile exists
export async function checkUserProfileExists(userId: string): Promise<boolean> {
  try {
    const docRef = doc(db, "user_profiles", userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `user_profiles/${userId}`);
    return false;
  }
}

export async function saveUserProfile(userId: string, data: any) {
  try {
    await setDoc(
      doc(db, "user_profiles", userId),
      { ...data, userId, updatedAt: new Date().toISOString() },
      { merge: true },
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `user_profiles/${userId}`);
  }
}

export async function saveUserPreferences(userId: string, data: any) {
  try {
    await setDoc(
      doc(db, "user_preferences", userId),
      { ...data, userId, updatedAt: new Date().toISOString() },
      { merge: true },
    );
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `user_preferences/${userId}`,
    );
  }
}

export async function getUserProfile(userId: string) {
  try {
    const docRef = doc(db, "user_profiles", userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `user_profiles/${userId}`);
    return null;
  }
}

export async function getUserPreferences(userId: string) {
  try {
    const docRef = doc(db, "user_preferences", userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.GET,
      `user_preferences/${userId}`,
    );
    return null;
  }
}

export async function getDailyLog(userId: string, date: string) {
  try {
    const logId = `${userId}_${date}`;
    const docRef = doc(db, "daily_logs", logId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `daily_logs`);
    return null;
  }
}

export async function saveDailyLog(userId: string, date: string, data: any) {
  try {
    const logId = `${userId}_${date}`;
    await setDoc(
      doc(db, "daily_logs", logId),
      {
        ...data,
        userId,
        date,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `daily_logs`);
  }
}

export async function getDailyLogs(userId: string, limitCount: number = 365) {
  try {
    // Note: In a real app, you'd want to order by date descending and limit.
    // For simplicity without requiring composite indexes immediately, we just query by userId.
    const q = query(
      collection(db, "daily_logs"),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(q);
    const logs: any[] = [];
    querySnapshot.forEach((doc) => {
      logs.push(doc.data());
    });
    // Sort by date ascending for charts
    return logs.sort((a, b) => a.date.localeCompare(b.date)).slice(-limitCount);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "daily_logs");
    return [];
  }
}

export async function getFoodEntries(userId: string, date?: string) {
  try {
    let q = query(
      collection(db, "food_entries"),
      where("userId", "==", userId)
    );
    
    if (date) {
      q = query(
        collection(db, "food_entries"),
        where("userId", "==", userId),
        where("date", "==", date)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const entries: any[] = [];
    querySnapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by createdAt descending
    return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "food_entries");
    return [];
  }
}

export async function saveFoodEntry(data: any) {
  try {
    const entryId = Date.now().toString();
    await setDoc(doc(db, "food_entries", entryId), {
      ...data,
      createdAt: new Date().toISOString(),
    });

    // Update DailyLog
    const { userId, date, calories, protein, carbs, fat } = data;
    const currentLog = await getDailyLog(userId, date);
    const profile = await getUserProfile(userId);

    const newLogData = {
      total_calories_consumed:
        (currentLog?.total_calories_consumed || 0) + (calories || 0),
      total_protein_consumed:
        (currentLog?.total_protein_consumed || 0) + (protein || 0),
      total_carbs_consumed:
        (currentLog?.total_carbs_consumed || 0) + (carbs || 0),
      total_fat_consumed: (currentLog?.total_fat_consumed || 0) + (fat || 0),
      total_calories_target: currentLog?.total_calories_target || profile?.target_calories || 2000,
    };

    await saveDailyLog(userId, date, newLogData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "food_entries");
  }
}

export async function getWorkouts(userId: string) {
  try {
    const q = query(
      collection(db, "workouts"),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(q);
    const workouts: any[] = [];
    querySnapshot.forEach((doc) => {
      workouts.push({ id: doc.id, ...doc.data() });
    });
    // Sort by date descending
    return workouts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "workouts");
    return [];
  }
}

export async function saveWorkoutSession(data: any) {
  try {
    const sessionId = data.id || Date.now().toString();
    const { id, ...sessionData } = data; // Remove id from data to be saved

    // Use setDoc with merge: true to update existing or create new
    await setDoc(
      doc(db, "workouts", sessionId),
      {
        ...sessionData,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    // Update DailyLog
    const { userId, date } = data;
    const currentLog = await getDailyLog(userId, date);
    const profile = await getUserProfile(userId);

    await saveDailyLog(userId, date, {
      ...currentLog,
      is_workout_day: true,
      total_calories_target: currentLog?.total_calories_target || profile?.target_calories || 2000,
      total_calories_consumed: currentLog?.total_calories_consumed || 0,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "workouts");
  }
}
