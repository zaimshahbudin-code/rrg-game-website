import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, onSnapshot, updateDoc, getDocs, addDoc } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA6I-tP_viGeAepADdPHnAoKHIpTvxi_wc",
  authDomain: "rrg-game.firebaseapp.com",
  projectId: "rrg-game",
  storageBucket: "rrg-game.firebasestorage.app",
  messagingSenderId: "253063914434",
  appId: "1:253063914434:web:1051860a84c26ca19eec5b",
  measurementId: "G-0QYGSXX650"
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
