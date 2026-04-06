// ===== Firebase Configuration & Initialization =====
// Central hub for Firebase service initialization (Auth, Firestore, Storage)
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase configuration - missing env vars will break the app
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("❌ Firebase configuration is missing! Check your .env file.");
}

// Initialize Firebase app instance
const app = initializeApp(firebaseConfig);

// Export Firebase service instances for use throughout app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to Firebase Emulators in development (only if explicitly enabled)
const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";

if (useEmulators) {
  try {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    console.log("🔥 Connected to Firebase Emulators");
  } catch (error) {
    // Emulators already connected or not available
    console.log("Firebase emulators connection:", error.message);
  }
} else {
  console.log("🌐 Connected to Firebase Production (sfera-91b35)");
}

export default app;
