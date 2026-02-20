/**
 * Utility function to initialize user profile on signup
 * Call this function after successful user registration
 */

import { createUserProfile } from "../services/profileService";

/**
 * Initialize a new user profile in Firestore
 * @param {Object} user - Firebase auth user object
 * @param {Object} additionalData - Additional profile data
 * @returns {Promise<void>}
 */
export const initializeUserProfile = async (user, additionalData = {}) => {
  try {
    const profileData = {
      username: additionalData.username || user.email.split("@")[0],
      displayName:
        additionalData.displayName ||
        user.displayName ||
        user.email.split("@")[0],
      firstName: additionalData.firstName || "",
      lastName: additionalData.lastName || "",
      email: user.email,
      bio: additionalData.bio || "",
      profileImage: user.photoURL || "",
      coverImages: [],
      links: [],
      joinedCommunities: [],
      isPrivate: false,
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      followers: [],
      following: [],
    };

    await createUserProfile(user.uid, profileData);
    console.log("✅ User profile created successfully");
  } catch (error) {
    console.error("❌ Error creating user profile:", error);
    throw error;
  }
};

/**
 * Example usage in Signup component:
 *
 * import { initializeUserProfile } from '../utils/profileUtils';
 *
 * const handleSignup = async (email, password, username) => {
 *   try {
 *     const userCredential = await signup(email, password);
 *     await initializeUserProfile(userCredential.user, { username });
 *     navigate('/profile');
 *   } catch (error) {
 *     console.error('Signup error:', error);
 *   }
 * };
 */
