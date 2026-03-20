import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, User, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { checkUserProfileExists } from '../services/dbService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasProfile: boolean | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  checkProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  const checkProfile = async () => {
    if (auth.currentUser) {
      const exists = await checkUserProfileExists(auth.currentUser.uid);
      setHasProfile(exists);
    } else {
      setHasProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await checkProfile();
      } else {
        setHasProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, hasProfile, signInWithGoogle, logout, checkProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
