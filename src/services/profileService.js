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
  onSnapshot,
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
      firstName: profileData.firstName || "",
      lastName: profileData.lastName || "",
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
      followers: [],
      following: [],
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
 * @param {File} croppedFile - Cropped image file (for display)
 * @param {File} originalFile - Original uncropped image file (for future editing)
 * @param {Object} cropData - Crop position and zoom data {crop: {x, y}, zoom: number}
 * @returns {Promise<string>} Download URL of uploaded cropped image
 */
export const uploadProfileImage = async (
  userId,
  croppedFile,
  originalFile = null,
  cropData = null,
) => {
  try {
    // Delete old profile images if they exist
    const userProfile = await getUserProfile(userId);
    if (userProfile?.profileImage) {
      try {
        // Delete old cropped image
        const oldImageUrl = userProfile.profileImage;
        const oldImagePath = decodeURIComponent(
          oldImageUrl.split("/o/")[1]?.split("?")[0],
        );
        if (oldImagePath) {
          const oldImageRef = ref(storage, oldImagePath);
          await deleteObject(oldImageRef);
        }
      } catch (error) {
        console.log("No old cropped image to delete or error:", error);
      }
    }

    if (userProfile?.profileImageOriginal) {
      try {
        // Delete old original image
        const oldOriginalUrl = userProfile.profileImageOriginal;
        const oldOriginalPath = decodeURIComponent(
          oldOriginalUrl.split("/o/")[1]?.split("?")[0],
        );
        if (oldOriginalPath) {
          const oldOriginalRef = ref(storage, oldOriginalPath);
          await deleteObject(oldOriginalRef);
        }
      } catch (error) {
        console.log("No old original image to delete or error:", error);
      }
    }

    // Upload cropped image with unique timestamp
    const timestamp = Date.now();
    const croppedRef = ref(
      storage,
      `profiles/${userId}/profile-image-cropped-${timestamp}`,
    );
    await uploadBytes(croppedRef, croppedFile);
    const croppedURL = await getDownloadURL(croppedRef);

    const updateData = { profileImage: croppedURL };

    // Upload original image if provided
    if (originalFile) {
      const originalRef = ref(
        storage,
        `profiles/${userId}/profile-image-original-${timestamp}`,
      );
      await uploadBytes(originalRef, originalFile);
      const originalURL = await getDownloadURL(originalRef);
      updateData.profileImageOriginal = originalURL;
    }

    // Save crop and zoom data if provided
    if (cropData) {
      updateData.profileImageCropData = cropData;
    }

    // Update user profile with new image URLs
    await updateUserProfile(userId, updateData);

    return croppedURL;
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
 * @param {File} croppedFile - Cropped image file (for display)
 * @param {File} originalFile - Original uncropped image file (for future editing)
 * @param {Object} cropData - Crop position and zoom data {crop: {x, y}, zoom: number}
 * @returns {Promise<string>} Download URL of uploaded cropped image
 */
export const uploadBannerImage = async (
  userId,
  croppedFile,
  originalFile = null,
  cropData = null,
) => {
  try {
    // Delete old banner images if they exist
    const userProfile = await getUserProfile(userId);
    if (userProfile?.bannerImage) {
      try {
        // Delete old cropped banner
        const oldImageUrl = userProfile.bannerImage;
        const oldImagePath = decodeURIComponent(
          oldImageUrl.split("/o/")[1]?.split("?")[0],
        );
        if (oldImagePath) {
          const oldImageRef = ref(storage, oldImagePath);
          await deleteObject(oldImageRef);
        }
      } catch (error) {
        console.log("No old banner image to delete or error:", error);
      }
    }

    if (userProfile?.bannerImageOriginal) {
      try {
        // Delete old original banner
        const oldOriginalUrl = userProfile.bannerImageOriginal;
        const oldOriginalPath = decodeURIComponent(
          oldOriginalUrl.split("/o/")[1]?.split("?")[0],
        );
        if (oldOriginalPath) {
          const oldOriginalRef = ref(storage, oldOriginalPath);
          await deleteObject(oldOriginalRef);
        }
      } catch (error) {
        console.log("No old original banner to delete or error:", error);
      }
    }

    // Upload cropped banner with unique timestamp
    const timestamp = Date.now();
    const croppedRef = ref(
      storage,
      `profiles/${userId}/banner-image-cropped-${timestamp}`,
    );
    await uploadBytes(croppedRef, croppedFile);
    const croppedURL = await getDownloadURL(croppedRef);

    const updateData = { bannerImage: croppedURL };

    // Upload original banner if provided
    if (originalFile) {
      const originalRef = ref(
        storage,
        `profiles/${userId}/banner-image-original-${timestamp}`,
      );
      await uploadBytes(originalRef, originalFile);
      const originalURL = await getDownloadURL(originalRef);
      updateData.bannerImageOriginal = originalURL;
    }

    // Save crop and zoom data if provided
    if (cropData) {
      updateData.bannerImageCropData = cropData;
    }

    // Update user profile with new banner URLs
    await updateUserProfile(userId, updateData);

    return croppedURL;
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

/**
 * Subscribe to user profile updates in real-time
 * @param {string} userId - The user ID to subscribe to
 * @param {Function} callback - Callback function to receive updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUserProfile = (userId, callback) => {
  const userRef = doc(db, "users", userId);

  return onSnapshot(
    userRef,
    (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data(),
        });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("Error listening to user profile:", error);
      callback(null);
    },
  );
};

/**
 * Follow a user
 * @param {string} currentUserId - The ID of the user who is following
 * @param {string} targetUserId - The ID of the user to follow
 * @returns {Promise<void>}
 */
export const followUser = async (currentUserId, targetUserId) => {
  try {
    if (currentUserId === targetUserId) {
      throw new Error("Cannot follow yourself");
    }

    // Add to current user's following list
    const currentUserRef = doc(db, "users", currentUserId);
    await updateDoc(currentUserRef, {
      following: arrayUnion(targetUserId),
      updatedAt: serverTimestamp(),
    });

    // Add to target user's followers list
    const targetUserRef = doc(db, "users", targetUserId);
    await updateDoc(targetUserRef, {
      followers: arrayUnion(currentUserId),
      followersCount:
        (await getDoc(targetUserRef)).data().followersCount + 1 || 1,
      updatedAt: serverTimestamp(),
    });

    // Increment current user's following count
    const currentUserDoc = await getDoc(currentUserRef);
    await updateDoc(currentUserRef, {
      followingCount: (currentUserDoc.data().followingCount || 0) + 1,
    });
  } catch (error) {
    console.error("Error following user:", error);
    throw error;
  }
};

/**
 * Unfollow a user
 * @param {string} currentUserId - The ID of the user who is unfollowing
 * @param {string} targetUserId - The ID of the user to unfollow
 * @returns {Promise<void>}
 */
export const unfollowUser = async (currentUserId, targetUserId) => {
  try {
    // Remove from current user's following list
    const currentUserRef = doc(db, "users", currentUserId);
    await updateDoc(currentUserRef, {
      following: arrayRemove(targetUserId),
      updatedAt: serverTimestamp(),
    });

    // Remove from target user's followers list
    const targetUserRef = doc(db, "users", targetUserId);
    await updateDoc(targetUserRef, {
      followers: arrayRemove(currentUserId),
      followersCount: Math.max(
        ((await getDoc(targetUserRef)).data().followersCount || 1) - 1,
        0,
      ),
      updatedAt: serverTimestamp(),
    });

    // Decrement current user's following count
    const currentUserDoc = await getDoc(currentUserRef);
    await updateDoc(currentUserRef, {
      followingCount: Math.max(
        (currentUserDoc.data().followingCount || 1) - 1,
        0,
      ),
    });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    throw error;
  }
};

/**
 * Check if current user is following target user
 * @param {string} currentUserId - The ID of the current user
 * @param {string} targetUserId - The ID of the user to check
 * @returns {Promise<boolean>} True if following
 */
export const isFollowing = async (currentUserId, targetUserId) => {
  try {
    const currentUserRef = doc(db, "users", currentUserId);
    const currentUserDoc = await getDoc(currentUserRef);
    const following = currentUserDoc.data()?.following || [];
    return following.includes(targetUserId);
  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
};

/**
 * Get user's followers
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of follower user profiles
 */
export const getUserFollowers = async (userId) => {
  try {
    const userProfile = await getUserProfile(userId);
    const followerIds = userProfile?.followers || [];

    if (followerIds.length === 0) return [];

    const followerProfiles = await Promise.all(
      followerIds.map((id) => getUserProfile(id)),
    );

    return followerProfiles.filter((profile) => profile !== null);
  } catch (error) {
    console.error("Error getting user followers:", error);
    return [];
  }
};

/**
 * Get user's following list
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of following user profiles
 */
export const getUserFollowing = async (userId) => {
  try {
    const userProfile = await getUserProfile(userId);
    const followingIds = userProfile?.following || [];

    if (followingIds.length === 0) return [];

    const followingProfiles = await Promise.all(
      followingIds.map((id) => getUserProfile(id)),
    );

    return followingProfiles.filter((profile) => profile !== null);
  } catch (error) {
    console.error("Error getting user following:", error);
    return [];
  }
};
