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

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up new user
  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Log in existing user
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Log out user
  const logout = () => {
    return firebaseSignOut(auth);
  };

  // Google Sign In
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // Apple Sign In
  const signInWithApple = async () => {
    const provider = new OAuthProvider("apple.com");
    return signInWithPopup(auth, provider);
  };

  // Phone Sign In - Step 1: Setup reCAPTCHA
  const setupRecaptcha = (containerId) => {
    // Clear existing verifier if it exists
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }

    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved - allow form submission
      },
      "expired-callback": () => {
        // Response expired. Ask user to solve reCAPTCHA again.
        window.recaptchaVerifier = null;
      },
    });

    return window.recaptchaVerifier;
  };

  // Phone Sign In - Step 2: Send verification code
  const signInWithPhone = async (phoneNumber, recaptchaVerifier) => {
    return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
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
