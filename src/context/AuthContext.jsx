// ===== Authentication Context =====
// Global state management for user authentication and session persistence
import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../services/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

// Create auth context for global access to auth methods and user state
const AuthContext = createContext({});

// Hook to access auth context throughout the app
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Currently logged-in user
  const [loading, setLoading] = useState(true); // Auth state loading indicator

  // EMAIL/PASSWORD AUTHENTICATION METHODS

  // Create new user account with email and password
  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Log in existing user with email and password
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Log out current user
  const logout = () => {
    return firebaseSignOut(auth);
  };

  // SOCIAL AUTHENTICATION METHODS

  // Sign in with Google OAuth
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // Sign in with Apple OAuth
  const signInWithApple = async () => {
    const provider = new OAuthProvider("apple.com");
    return signInWithPopup(auth, provider);
  };

  // PHONE AUTHENTICATION METHODS (Two-Step Process)

  // Step 1: Initialize reCAPTCHA verifier for phone auth security
  const setupRecaptcha = (containerId) => {
    // Clear any existing verifier to prevent conflicts
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }

    // Create new invisible reCAPTCHA verifier
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved - allow form submission
      },
      "expired-callback": () => {
        // Response expired - ask user to solve reCAPTCHA again
        window.recaptchaVerifier = null;
      },
    });

    return window.recaptchaVerifier;
  };

  // Step 2: Send SMS verification code to phone number
  const signInWithPhone = async (phoneNumber, recaptchaVerifier) => {
    return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  };

  // EFFECT: Listen for auth state changes and update current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // Finished loading auth state
    });

    return unsubscribe; // Cleanup listener on unmount
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loading,
    signInWithGoogle,
    signInWithApple,
    signInWithPhone,
    setupRecaptcha,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
