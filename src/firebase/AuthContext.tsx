import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  facebookProvider,
  handleFirestoreError,
  OperationType,
  testConnection,
} from './config';

export interface UserStats {
  userId: string;
  displayName: string;
  isGuest: boolean;
  highScore: number;
  totalKills: number;
  gamesPlayed: number;
  bestTimeSeconds: number;
  updatedAt?: string;
}

export interface LeaderboardItem {
  id: string;
  userId: string;
  displayName: string;
  score: number;
  kills: number;
  timeSurvived: number;
  level: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  userStats: UserStats | null;
  loading: boolean;
  isGuest: boolean;
  authError: string | null;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  playAsGuest: () => Promise<void>;
  signOutUser: () => Promise<void>;
  saveRunResult: (kills: number, score: number, timeSurvived: number, level: number) => Promise<void>;
  leaderboard: LeaderboardItem[];
  fetchLeaderboard: () => Promise<void>;
  runHistory: LeaderboardItem[];
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [runHistory, setRunHistory] = useState<LeaderboardItem[]>([]);

  // Load user isolated stats from Firestore /users/{uid}
  const loadUserStats = useCallback(async (firebaseUser: User) => {
    const path = `users/${firebaseUser.uid}`;
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const snapshot = await getDoc(userDocRef);

      if (snapshot.exists()) {
        const data = snapshot.data() as UserStats;
        setUserStats(data);
      } else {
        // Initialize new user profile document
        const initialStats: UserStats = {
          userId: firebaseUser.uid,
          displayName:
            firebaseUser.displayName ||
            (firebaseUser.isAnonymous ? `Guest #${firebaseUser.uid.slice(0, 4)}` : 'Survivor'),
          isGuest: firebaseUser.isAnonymous,
          highScore: 0,
          totalKills: 0,
          gamesPlayed: 0,
          bestTimeSeconds: 0,
          updatedAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, initialStats);
        setUserStats(initialStats);
      }
    } catch (err) {
      console.warn('Could not sync user profile to cloud, using local session:', err);
      // Fallback local memory profile so gameplay is never blocked
      setUserStats({
        userId: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'Survivor',
        isGuest: firebaseUser.isAnonymous,
        highScore: 0,
        totalKills: 0,
        gamesPlayed: 0,
        bestTimeSeconds: 0,
      });
    }
  }, []);

  // Fetch competitive leaderboard
  const fetchLeaderboard = useCallback(async () => {
    const path = 'leaderboard';
    try {
      const q = query(collection(db, path), orderBy('score', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const items: LeaderboardItem[] = [];
      querySnapshot.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<LeaderboardItem, 'id'>) });
      });
      setLeaderboard(items);
    } catch (err) {
      console.warn('Leaderboard query unavailable:', err);
    }
  }, []);

  const fetchRunHistory = useCallback(async (firebaseUser: User) => {
    try {
      const historyQuery = query(
        collection(db, 'users', firebaseUser.uid, 'runs'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const historySnapshot = await getDocs(historyQuery);
      const legacyQuery = query(collection(db, 'leaderboard'), where('userId', '==', firebaseUser.uid));
      const legacySnapshot = await getDocs(legacyQuery);
      const runsByTimestamp = new Map<string, LeaderboardItem>();
      historySnapshot.docs.forEach((run) => {
        const item = { id: run.id, ...(run.data() as Omit<LeaderboardItem, 'id'>) };
        runsByTimestamp.set(item.createdAt || item.id, item);
      });
      legacySnapshot.docs.forEach((run) => {
        const item = { id: run.id, ...(run.data() as Omit<LeaderboardItem, 'id'>) };
        const key = item.createdAt || item.id;
        if (!runsByTimestamp.has(key)) runsByTimestamp.set(key, item);
      });

      setRunHistory(
        [...runsByTimestamp.values()]
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
          .slice(0, 10)
      );
    } catch (err) {
      console.warn('Run history unavailable:', err);
      setRunHistory([]);
    }
  }, []);

  // Listen to Auth State
  useEffect(() => {
    testConnection().catch(() => {});
    fetchLeaderboard().catch(() => {});

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsGuest(currentUser.isAnonymous);
        await loadUserStats(currentUser);
        await fetchRunHistory(currentUser);
      } else {
        setUserStats(null);
        setIsGuest(false);
        setRunHistory([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserStats, fetchLeaderboard, fetchRunHistory]);

  // Sign In with Google
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign in popup was closed. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('Sign in popup was blocked by browser. Please allow popups.');
      } else {
        setAuthError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Sign In with Facebook
  const handleFacebookSignIn = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, facebookProvider);
    } catch (err: any) {
      console.error('Facebook Sign In failed:', err);
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found') {
        setAuthError(
          'Facebook login provider is not configured in Firebase Console. Please use Google or Play as Guest.'
        );
      } else if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign in popup was closed. Please try again.');
      } else {
        setAuthError(err.message || 'Failed to sign in with Facebook.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Play as Guest (Anonymous)
  const handleGuestPlay = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.warn('Anonymous sign-in unavailable in project console, creating local guest session:', err);
      // Fallback local guest session
      const fakeUid = 'guest_' + Math.random().toString(36).substring(2, 9);
      setIsGuest(true);
      setUserStats({
        userId: fakeUid,
        displayName: `Guest #${fakeUid.slice(-4)}`,
        isGuest: true,
        highScore: 0,
        totalKills: 0,
        gamesPlayed: 0,
        bestTimeSeconds: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Sign Out
  const handleSignOut = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserStats(null);
      setIsGuest(false);
    } catch (err: any) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save run results with User Isolation
  const saveRunResult = async (kills: number, score: number, timeSurvived: number, level: number) => {
    if (!user && !userStats) return;

    const currentUser = user ?? auth.currentUser;
    const currentUid = currentUser?.uid || userStats?.userId || 'guest';
    const updatedStats: UserStats = {
      userId: currentUid,
      displayName: userStats?.displayName || (currentUser?.isAnonymous ? `Guest #${currentUid.slice(0, 4)}` : currentUser?.displayName || 'Survivor'),
      isGuest: Boolean(isGuest || currentUser?.isAnonymous),
      highScore: Math.max(score, userStats?.highScore || 0),
      totalKills: (userStats?.totalKills || 0) + kills,
      gamesPlayed: (userStats?.gamesPlayed || 0) + 1,
      bestTimeSeconds: Math.max(timeSurvived, userStats?.bestTimeSeconds || 0),
      updatedAt: new Date().toISOString(),
    };

    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const createdAt = new Date().toISOString();
        const run = {
          userId: currentUser.uid,
          displayName: updatedStats.displayName,
          score,
          kills,
          timeSurvived,
          level,
          createdAt,
        };
        const batch = writeBatch(db);
        batch.set(userDocRef, updatedStats, { merge: true });

        const runRef = doc(collection(db, 'users', currentUser.uid, 'runs'));
        batch.set(runRef, run);

        if (score > 0) {
          const leaderboardRef = doc(db, 'leaderboard', `${currentUser.uid}_${runRef.id}`);
          batch.set(leaderboardRef, run);
        }

        await batch.commit();
        setUserStats(updatedStats);
        setRunHistory((previous) => [{ id: runRef.id, ...run }, ...previous].slice(0, 10));
        fetchLeaderboard().catch(() => {});
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Could not persist run results:', err);
        setAuthError(`Run could not be saved to your account: ${message}`);
        throw err;
      }
    } else {
      setUserStats(updatedStats);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userStats,
        loading,
        isGuest,
        authError,
        clearError: () => setAuthError(null),
        signInWithGoogle: handleGoogleSignIn,
        signInWithFacebook: handleFacebookSignIn,
        playAsGuest: handleGuestPlay,
        signOutUser: handleSignOut,
        saveRunResult,
        leaderboard,
        fetchLeaderboard,
        runHistory,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
