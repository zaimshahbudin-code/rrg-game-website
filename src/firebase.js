import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, onSnapshot, updateDoc, getDocs, addDoc, where } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBxoNTwFYAc2B78Df6L89uinWOqRbtL7WM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "rrg-game-website.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rrg-game-website",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "rrg-game-website.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1089840178829",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1089840178829:web:a2283ed37a3299943324c4",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-53S6KD8FTS"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const isFirebaseConfigured = true;

// Authentication Helpers
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update last login in Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      lastLogin: new Date().toISOString(),
    }, { merge: true });
    
    return user;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const registerWithEmail = async (name, email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create pending user profile
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      name: name,
      email: user.email,
      role: 'Pelajar',
      isApproved: false,
      createdAt: new Date().toISOString(),
    });
    
    // Attempt to send email verification (optional but good practice)
    await sendEmailVerification(user);
    
    return user;
  } catch (error) {
    console.error("Error registering:", error);
    throw error;
  }
};

// Score Saving Helpers
export const saveQuizScore = async (user, score, total) => {
  if (!user || !user.uid) return;
  try {
    await addDoc(collection(db, 'scores'), {
      type: 'kuiz',
      userId: user.uid,
      userName: user.name || user.email,
      score: score,
      total: total,
      percentage: Math.round((score / total) * 100),
      date: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving quiz score:", error);
  }
};

export const saveGameRecord = async (user, gameWinnerName, gameWinnerScore, playerCount) => {
  if (!user || !user.uid) return;
  try {
    await addDoc(collection(db, 'scores'), {
      type: 'rrg_game',
      hostId: user.uid,
      hostName: user.name || user.email,
      winnerName: gameWinnerName,
      winnerScore: gameWinnerScore,
      playerCount: playerCount,
      date: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error saving game record:", error);
  }
};

export const subscribeToAuth = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const logout = () => auth.signOut();

export { collection, query, orderBy, limit, getDocs, where };
