import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

import { firebaseConfig } from './firebaseConfig.local';

const config = firebaseConfig;

// Initialize Firebase
const app = initializeApp(config);

// Firestore
export const db = getFirestore(app);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Helper
export const isLoggedIn = () => auth.currentUser !== null;