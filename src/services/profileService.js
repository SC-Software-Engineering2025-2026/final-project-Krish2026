import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";

/**
 * Get user profile by userId
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} User profile data or null
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

/**
 * Create a new user profile
 * @param {string} userId - The user ID
 * @param {Object} profileData - Profile data
 * @returns {Promise<void>}
 */
export const createUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, "users", userId);
    const defaultProfile = {
      username: profileData.username || "",
      displayName: profileData.displayName || "",
      email: profileData.email || "",
      bio: "",
      profileImage: "",
      coverImages: [],
      links: [],
      joinedCommunities: [],
      isPrivate: false,
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...profileData,
    };

    await setDoc(userRef, defaultProfile);
    return defaultProfile;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {string} userId - The user ID
 * @param {Object} data - Data to update
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (userId, data) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * Upload profile image
 * @param {string} userId - The user ID
 * @param {File} file - Image file
 * @returns {Promise<string>} Download URL of uploaded image
 */
export const uploadProfileImage = async (userId, file) => {
  try {
    // Delete old profile image if exists
    const userProfile = await getUserProfile(userId);
    if (userProfile?.profileImage) {
      try {
        const oldImageRef = ref(storage, `profiles/${userId}/profile-image`);
        await deleteObject(oldImageRef);
      } catch (error) {
        console.log("No old image to delete or error:", error);
      }
    }

    // Upload new image
    const storageRef = ref(storage, `profiles/${userId}/profile-image`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    // Update user profile with new image URL
    await updateUserProfile(userId, { profileImage: downloadURL });

    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw error;
  }
};

/**
 * Upload cover images (multiple)
 * @param {string} userId - The user ID
 * @param {File[]} files - Array of image files
 * @returns {Promise<string[]>} Array of download URLs
 */
export const uploadCoverImages = async (userId, files) => {
  try {
    const uploadPromises = files.map(async (file, index) => {
      const storageRef = ref(
        storage,
        `profiles/${userId}/cover-images/${Date.now()}-${index}`,
      );
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });

    const urls = await Promise.all(uploadPromises);

    // Update user profile with new cover images
    const userProfile = await getUserProfile(userId);
    const updatedCoverImages = [...(userProfile?.coverImages || []), ...urls];
    await updateUserProfile(userId, { coverImages: updatedCoverImages });

    return urls;
  } catch (error) {
    console.error("Error uploading cover images:", error);
    throw error;
  }
};

/**
 * Upload banner image (single)
 * @param {string} userId - The user ID
 * @param {File} file - Image file
 * @returns {Promise<string>} Download URL of uploaded image
 */
export const uploadBannerImage = async (userId, file) => {
  try {
    // Delete old banner image if exists
    const userProfile = await getUserProfile(userId);
    if (userProfile?.bannerImage) {
      try {
        const oldImageRef = ref(storage, `profiles/${userId}/banner-image`);
        await deleteObject(oldImageRef);
      } catch (error) {
        console.log("No old banner image to delete or error:", error);
      }
    }

    // Upload new banner image
    const storageRef = ref(storage, `profiles/${userId}/banner-image`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    // Update user profile with new banner image URL
    await updateUserProfile(userId, { bannerImage: downloadURL });

    return downloadURL;
  } catch (error) {
    console.error("Error uploading banner image:", error);
    throw error;
  }
};

/**
 * Remove a cover image
 * @param {string} userId - The user ID
 * @param {string} imageUrl - URL of image to remove
 * @returns {Promise<void>}
 */
export const removeCoverImage = async (userId, imageUrl) => {
  try {
    const userProfile = await getUserProfile(userId);
    const updatedCoverImages = userProfile.coverImages.filter(
      (url) => url !== imageUrl,
    );
    await updateUserProfile(userId, { coverImages: updatedCoverImages });
  } catch (error) {
    console.error("Error removing cover image:", error);
    throw error;
  }
};

/**
 * Remove banner image
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
export const removeBannerImage = async (userId) => {
  try {
    // Delete banner image from storage
    try {
      const bannerImageRef = ref(storage, `profiles/${userId}/banner-image`);
      await deleteObject(bannerImageRef);
    } catch (error) {
      console.log("No banner image to delete or error:", error);
    }

    // Update user profile to remove banner image URL
    await updateUserProfile(userId, { bannerImage: "" });
  } catch (error) {
    console.error("Error removing banner image:", error);
    throw error;
  }
};

/**
 * Add link to user profile
 * @param {string} userId - The user ID
 * @param {Object} link - Link object {title, url}
 * @returns {Promise<void>}
 */
export const addProfileLink = async (userId, link) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      links: arrayUnion(link),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding profile link:", error);
    throw error;
  }
};

/**
 * Remove link from user profile
 * @param {string} userId - The user ID
 * @param {Object} link - Link object to remove
 * @returns {Promise<void>}
 */
export const removeProfileLink = async (userId, link) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      links: arrayRemove(link),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error removing profile link:", error);
    throw error;
  }
};

/**
 * Toggle profile privacy
 * @param {string} userId - The user ID
 * @param {boolean} isPrivate - Privacy status
 * @returns {Promise<void>}
 */
export const toggleProfilePrivacy = async (userId, isPrivate) => {
  try {
    await updateUserProfile(userId, { isPrivate });
  } catch (error) {
    console.error("Error toggling profile privacy:", error);
    throw error;
  }
};

/**
 * Check if username is available
 * @param {string} username - Username to check
 * @param {string} currentUserId - Current user ID (to exclude from check)
 * @returns {Promise<boolean>} True if available
 */
export const isUsernameAvailable = async (username, currentUserId = null) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return true;

    // If username exists, check if it's the current user's username
    if (currentUserId) {
      const existingUser = querySnapshot.docs[0];
      return existingUser.id === currentUserId;
    }

    return false;
  } catch (error) {
    console.error("Error checking username availability:", error);
    throw error;
  }
};

/**
 * Join a community
 * @param {string} userId - The user ID
 * @param {string} communityId - Community ID to join
 * @returns {Promise<void>}
 */
export const joinCommunity = async (userId, communityId) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      joinedCommunities: arrayUnion(communityId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error joining community:", error);
    throw error;
  }
};

/**
 * Leave a community
 * @param {string} userId - The user ID
 * @param {string} communityId - Community ID to leave
 * @returns {Promise<void>}
 */
export const leaveCommunity = async (userId, communityId) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      joinedCommunities: arrayRemove(communityId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error leaving community:", error);
    throw error;
  }
};
