// ===== User Profile Service =====
// Handles user profile creation, updates, following/followers, and theme settings
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  increment,
  writeBatch,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import { db, storage, auth } from "./firebase";
import { deleteUser } from "firebase/auth";
import { createFollowNotification } from "./notificationService";
import { createOrGetDirectMessageChannel } from "./directMessageService";

/**
 * RETRIEVE USER PROFILE
 * Get complete user profile document from Firestore
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} Full user profile with all fields
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
 * CREATE NEW USER PROFILE
 * Initialize a new user profile when account is first created
 * Sets default values for all profile fields
 * @param {string} userId - The user ID
 * @param {Object} profileData - Initial profile data (username, email, etc.)
 * @returns {Promise<Object>} Created profile object
 */
export const createUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, "users", userId);
    // Set default values for all profile fields
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
      joinedCommunities: [], // Communities this user is a member of
      isPrivate: false, // Account privacy setting
      postsCount: 0, // Total posts created
      followersCount: 0, // Total followers
      followingCount: 0, // Total following
      followers: [], // Array of follower user IDs
      following: [], // Array of following user IDs
      sentFollowRequests: [], // Pending follow requests sent
      pendingFollowRequests: [], // Pending follow requests received
      dmSettings: {
        allowDirectMessagesFrom: "everyone", // DM privacy setting
        blockedUsers: [], // List of blocked user IDs
      },
      theme: "light", // User's theme preference
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...profileData, // Merge with provided profile data
    };

    await setDoc(userRef, defaultProfile);
    return defaultProfile;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

/**
 * UPDATE USER PROFILE
 * Modify user profile fields and update timestamp
 * @param {string} userId - The user ID
 * @param {Object} data - Data fields to update
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
 * Update user theme preference
 * @param {string} userId - The user ID
 * @param {string} theme - Theme preference ("light" or "dark")
 * @returns {Promise<void>}
 */
export const updateUserTheme = async (userId, theme) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      theme: theme,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating user theme:", error);
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

    // Get current user profile for notification
    const currentUserRef = doc(db, "users", currentUserId);
    const currentUserDoc = await getDoc(currentUserRef);
    const currentUserData = currentUserDoc.data();

    // Add to current user's following list
    await updateDoc(currentUserRef, {
      following: arrayUnion(targetUserId),
      updatedAt: serverTimestamp(),
    });

    // Add to target user's followers list
    const targetUserRef = doc(db, "users", targetUserId);
    const targetUserDoc = await getDoc(targetUserRef);
    await updateDoc(targetUserRef, {
      followers: arrayUnion(currentUserId),
      followersCount: (targetUserDoc.data().followersCount || 0) + 1,
      updatedAt: serverTimestamp(),
    });

    // Increment current user's following count
    await updateDoc(currentUserRef, {
      followingCount: (currentUserData.followingCount || 0) + 1,
    });

    // Create follow notification
    try {
      await createFollowNotification(
        currentUserId,
        targetUserId,
        currentUserData,
      );
    } catch (notifError) {
      console.error("Error creating follow notification:", notifError);
      // Don't throw error, follow action was successful
    }

    try {
      await createOrGetDirectMessageChannel(currentUserId, targetUserId);
    } catch (dmError) {
      console.error(
        "Error creating direct message channel after follow:",
        dmError,
      );
    }
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

/**
 * Send a follow request to a user with a private profile
 * @param {string} currentUserId - The ID of the user sending the request
 * @param {string} targetUserId - The ID of the user to send the request to
 * @returns {Promise<void>}
 */
export const sendFollowRequest = async (currentUserId, targetUserId) => {
  try {
    if (currentUserId === targetUserId) {
      throw new Error("Cannot send follow request to yourself");
    }

    // Get current user profile for notification
    const currentUserRef = doc(db, "users", currentUserId);
    const currentUserDoc = await getDoc(currentUserRef);
    const currentUserData = currentUserDoc.data();

    // Add to current user's sent follow requests
    await updateDoc(currentUserRef, {
      sentFollowRequests: arrayUnion(targetUserId),
      updatedAt: serverTimestamp(),
    });

    // Add to target user's pending follow requests
    const targetUserRef = doc(db, "users", targetUserId);
    await updateDoc(targetUserRef, {
      pendingFollowRequests: arrayUnion(currentUserId),
      updatedAt: serverTimestamp(),
    });

    // Create follow request notification
    const { createFollowRequestNotification } =
      await import("./notificationService");
    try {
      await createFollowRequestNotification(
        currentUserId,
        targetUserId,
        currentUserData,
      );
    } catch (notifError) {
      console.error("Error creating follow request notification:", notifError);
      // Don't throw error, request was sent successfully
    }
  } catch (error) {
    console.error("Error sending follow request:", error);
    throw error;
  }
};

/**
 * Accept a follow request from another user
 * @param {string} currentUserId - The ID of the user accepting the request
 * @param {string} requesterId - The ID of the user who sent the request
 * @returns {Promise<void>}
 */
export const acceptFollowRequest = async (currentUserId, requesterId) => {
  try {
    const currentUserRef = doc(db, "users", currentUserId);
    const requesterRef = doc(db, "users", requesterId);

    const currentUserDoc = await getDoc(currentUserRef);
    const requesterDoc = await getDoc(requesterRef);
    const currentUserData = currentUserDoc.data();

    // Remove from current user's pending requests
    await updateDoc(currentUserRef, {
      pendingFollowRequests: arrayRemove(requesterId),
      followers: arrayUnion(requesterId),
      followersCount: (currentUserData.followersCount || 0) + 1,
      updatedAt: serverTimestamp(),
    });

    // Remove from requester's sent requests and add to following
    const requesterData = requesterDoc.data();
    await updateDoc(requesterRef, {
      sentFollowRequests: arrayRemove(currentUserId),
      following: arrayUnion(currentUserId),
      followingCount: (requesterData.followingCount || 0) + 1,
      updatedAt: serverTimestamp(),
    });

    // Create follow request accepted notification
    const { createFollowRequestAcceptedNotification } =
      await import("./notificationService");
    try {
      await createFollowRequestAcceptedNotification(
        currentUserId,
        requesterId,
        currentUserData,
      );
    } catch (notifError) {
      console.error(
        "Error creating follow request accepted notification:",
        notifError,
      );
      // Don't throw error, accept action was successful
    }

    try {
      await createOrGetDirectMessageChannel(currentUserId, requesterId);
    } catch (dmError) {
      console.error(
        "Error creating direct message channel after follow request acceptance:",
        dmError,
      );
    }
  } catch (error) {
    console.error("Error accepting follow request:", error);
    throw error;
  }
};

/**
 * Reject a follow request from another user
 * @param {string} currentUserId - The ID of the user rejecting the request
 * @param {string} requesterId - The ID of the user who sent the request
 * @returns {Promise<void>}
 */
export const rejectFollowRequest = async (currentUserId, requesterId) => {
  try {
    const currentUserRef = doc(db, "users", currentUserId);
    const requesterRef = doc(db, "users", requesterId);

    // Remove from current user's pending requests
    await updateDoc(currentUserRef, {
      pendingFollowRequests: arrayRemove(requesterId),
      updatedAt: serverTimestamp(),
    });

    // Remove from requester's sent requests
    await updateDoc(requesterRef, {
      sentFollowRequests: arrayRemove(currentUserId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error rejecting follow request:", error);
    throw error;
  }
};

/**
 * Cancel a follow request that was sent
 * @param {string} currentUserId - The ID of the user canceling the request
 * @param {string} targetUserId - The ID of the user the request was sent to
 * @returns {Promise<void>}
 */
export const cancelFollowRequest = async (currentUserId, targetUserId) => {
  try {
    const currentUserRef = doc(db, "users", currentUserId);
    const targetUserRef = doc(db, "users", targetUserId);

    // Remove from current user's sent requests
    await updateDoc(currentUserRef, {
      sentFollowRequests: arrayRemove(targetUserId),
      updatedAt: serverTimestamp(),
    });

    // Remove from target user's pending requests
    await updateDoc(targetUserRef, {
      pendingFollowRequests: arrayRemove(currentUserId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error canceling follow request:", error);
    throw error;
  }
};

/**
 * Check if current user has sent a follow request to target user
 * @param {string} currentUserId - The ID of the current user
 * @param {string} targetUserId - The ID of the target user
 * @returns {Promise<boolean>} True if follow request is pending
 */
export const hasFollowRequestPending = async (currentUserId, targetUserId) => {
  try {
    const currentUserRef = doc(db, "users", currentUserId);
    const currentUserDoc = await getDoc(currentUserRef);
    const sentRequests = currentUserDoc.data()?.sentFollowRequests || [];
    return sentRequests.includes(targetUserId);
  } catch (error) {
    console.error("Error checking follow request status:", error);
    return false;
  }
};

/**
 * Search for users by username or display name
 * @param {string} searchTerm - The search term
 * @returns {Promise<Array>} Array of user profiles matching search
 */
export const searchUsers = async (searchTerm = "") => {
  try {
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);

    const allUsers = usersSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      // Filter out users without essential data (likely deleted users)
      .filter(
        (user) =>
          user.username && // Must have username
          user.email && // Must have email
          user.createdAt, // Must have creation timestamp
      );

    // Filter users based on search term (case-insensitive)
    if (!searchTerm.trim()) {
      return allUsers;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return allUsers.filter(
      (user) =>
        user.username?.toLowerCase().includes(lowerSearchTerm) ||
        user.displayName?.toLowerCase().includes(lowerSearchTerm) ||
        user.firstName?.toLowerCase().includes(lowerSearchTerm) ||
        user.lastName?.toLowerCase().includes(lowerSearchTerm),
    );
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
};

/**
 * Delete user profile from Firestore
 * Should be called when a user account is deleted from Firebase Auth
 * @param {string} userId - The user ID to delete
 * @returns {Promise<void>}
 */
export const deleteUserProfile = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log("User profile does not exist");
      return;
    }

    const userData = userDoc.data();

    // Delete profile image from storage if exists
    if (userData.profileImage) {
      try {
        const profileImageRef = ref(storage, `users/${userId}/profile`);
        await deleteObject(profileImageRef);
      } catch (error) {
        console.log("Profile image not found or already deleted");
      }
    }

    // Delete banner image from storage if exists
    if (userData.bannerImage) {
      try {
        const bannerImageRef = ref(storage, `users/${userId}/banner`);
        await deleteObject(bannerImageRef);
      } catch (error) {
        console.log("Banner image not found or already deleted");
      }
    }

    // Delete cover images from storage if they exist
    if (userData.coverImages && userData.coverImages.length > 0) {
      for (const imageUrl of userData.coverImages) {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.log("Cover image not found or already deleted");
        }
      }
    }

    // Remove user from followers' following lists
    if (userData.followers && userData.followers.length > 0) {
      for (const followerId of userData.followers) {
        try {
          const followerRef = doc(db, "users", followerId);
          await updateDoc(followerRef, {
            following: arrayRemove(userId),
            followingCount: increment(-1),
          });
        } catch (error) {
          console.log(`Failed to update follower ${followerId}`);
        }
      }
    }

    // Remove user from following users' followers lists
    if (userData.following && userData.following.length > 0) {
      for (const followingId of userData.following) {
        try {
          const followingRef = doc(db, "users", followingId);
          await updateDoc(followingRef, {
            followers: arrayRemove(userId),
            followersCount: increment(-1),
          });
        } catch (error) {
          console.log(`Failed to update following user ${followingId}`);
        }
      }
    }

    // Delete the user document from Firestore
    await deleteDoc(userRef);
    console.log(`User profile ${userId} deleted successfully`);
  } catch (error) {
    console.error("Error deleting user profile:", error);
    throw error;
  }
};

/**
 * Delete user account completely - removes all user data and Firebase Auth account
 * This is a comprehensive deletion that includes:
 * - All user posts with their images, comments, and likes
 * - All comments by the user on other posts
 * - All likes by the user
 * - Removal from all communities (or deletion if creator)
 * - All community posts by the user
 * - All community chat messages by the user
/**
 * Sync user's joinedCommunities array with actual community memberships
 * Fixes cases where the array is out of sync due to communities being deleted or manual removals
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Summary of changes {added: number, removed: number, communityIds: string[]}
 */
export const syncUserCommunities = async (userId) => {
  try {
    console.log(`Syncing communities for user: ${userId}`);

    // Get all communities where the user is a member
    const communitiesRef = collection(db, "communities");
    const q = query(communitiesRef, where("members", "array-contains", userId));
    const communitiesSnapshot = await getDocs(q);

    // Build the correct list of community IDs
    const actualCommunityIds = communitiesSnapshot.docs.map((doc) => doc.id);

    // Get current user profile
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User profile not found");
    }

    const userData = userSnap.data();
    const currentJoinedCommunities = userData.joinedCommunities || [];

    // Find differences
    const removed = currentJoinedCommunities.filter(
      (id) => !actualCommunityIds.includes(id),
    );
    const added = actualCommunityIds.filter(
      (id) => !currentJoinedCommunities.includes(id),
    );

    // Update the user profile with correct communityIds
    await updateDoc(userRef, {
      joinedCommunities: actualCommunityIds,
      updatedAt: serverTimestamp(),
    });

    console.log(
      `Sync complete. Added: ${added.length}, Removed: ${removed.length}`,
    );

    return {
      success: true,
      added: added.length,
      removed: removed.length,
      communityIds: actualCommunityIds,
      removedIds: removed,
    };
  } catch (error) {
    console.error("Error syncing user communities:", error);
    throw error;
  }
};

/**
 * Delete complete user account and all associated data
 * Removes:
 * - All user posts, comments, likes
 * - All communities created by user
 * - All community memberships and media
 * - User profile and storage
 * - Firebase Auth account
 * @param {string} userId - The user ID to delete
 * @returns {Promise<void>}
 */
export const deleteCompleteUserAccount = async (userId) => {
  try {
    console.log(`Starting complete account deletion for user: ${userId}`);

    // 1. Delete all user posts (includes their comments and likes)
    console.log("Deleting user posts...");
    const userPostsRef = collection(db, "userPosts");
    const userPostsQuery = query(userPostsRef, where("userId", "==", userId));
    const userPostsSnapshot = await getDocs(userPostsQuery);

    for (const postDoc of userPostsSnapshot.docs) {
      const postData = postDoc.data();

      // Delete post images from storage
      if (postData.images && postData.images.length > 0) {
        for (const imageUrl of postData.images) {
          try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
          } catch (error) {
            console.log("Error deleting post image:", error);
          }
        }
      }

      // Delete all comments on this post
      const commentsRef = collection(db, "postComments");
      const commentsQuery = query(
        commentsRef,
        where("postId", "==", postDoc.id),
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      for (const commentDoc of commentsSnapshot.docs) {
        await deleteDoc(commentDoc.ref);
      }

      // Delete all likes on this post
      const likesRef = collection(db, "postLikes");
      const likesQuery = query(likesRef, where("postId", "==", postDoc.id));
      const likesSnapshot = await getDocs(likesQuery);
      for (const likeDoc of likesSnapshot.docs) {
        await deleteDoc(likeDoc.ref);
      }

      // Delete the post document
      await deleteDoc(postDoc.ref);
    }

    // 2. Delete all comments by the user on other posts
    console.log("Deleting user comments...");
    const userCommentsRef = collection(db, "postComments");
    const userCommentsQuery = query(
      userCommentsRef,
      where("userId", "==", userId),
    );
    const userCommentsSnapshot = await getDocs(userCommentsQuery);

    for (const commentDoc of userCommentsSnapshot.docs) {
      const commentData = commentDoc.data();
      // Decrement comment count on the post
      try {
        const postRef = doc(db, "userPosts", commentData.postId);
        await updateDoc(postRef, {
          commentsCount: increment(-1),
        });
      } catch (error) {
        console.log("Error updating post comment count:", error);
      }
      await deleteDoc(commentDoc.ref);
    }

    // 3. Delete all likes by the user
    console.log("Deleting user likes...");
    const userLikesRef = collection(db, "postLikes");
    const userLikesQuery = query(userLikesRef, where("userId", "==", userId));
    const userLikesSnapshot = await getDocs(userLikesQuery);

    for (const likeDoc of userLikesSnapshot.docs) {
      const likeData = likeDoc.data();
      // Decrement like count on the post
      try {
        const postRef = doc(db, "userPosts", likeData.postId);
        await updateDoc(postRef, {
          likesCount: increment(-1),
        });
      } catch (error) {
        console.log("Error updating post like count:", error);
      }
      await deleteDoc(likeDoc.ref);
    }

    // 4. Get all communities the user is in
    console.log("Processing user communities...");
    const communitiesRef = collection(db, "communities");
    const memberQuery = query(
      communitiesRef,
      where("members", "array-contains", userId),
    );
    const memberSnapshot = await getDocs(memberQuery);

    for (const communityDoc of memberSnapshot.docs) {
      const communityData = communityDoc.data();
      const communityId = communityDoc.id;

      // If user is the creator, we need special handling
      if (communityData.creatorId === userId) {
        console.log(`User is creator of community ${communityId}`);

        // Delete all community posts (by all users)
        const communityPostsRef = collection(
          db,
          `communities/${communityId}/posts`,
        );
        const communityPostsSnapshot = await getDocs(communityPostsRef);
        for (const postDoc of communityPostsSnapshot.docs) {
          const postData = postDoc.data();

          // Delete post images
          if (postData.images && postData.images.length > 0) {
            for (const imageUrl of postData.images) {
              try {
                const imageRef = ref(storage, imageUrl);
                await deleteObject(imageRef);
              } catch (error) {
                console.log("Error deleting community post image:", error);
              }
            }
          }

          // Delete post comments
          const postCommentsRef = collection(
            db,
            `communities/${communityId}/posts/${postDoc.id}/comments`,
          );
          const postCommentsSnapshot = await getDocs(postCommentsRef);
          for (const commentDoc of postCommentsSnapshot.docs) {
            await deleteDoc(commentDoc.ref);
          }

          await deleteDoc(postDoc.ref);
        }

        // Delete all community chat messages
        const chatRef = collection(db, `communities/${communityId}/chat`);
        const chatSnapshot = await getDocs(chatRef);
        for (const msgDoc of chatSnapshot.docs) {
          const msgData = msgDoc.data();
          // Delete chat image if exists
          if (msgData.imageUrl) {
            try {
              const imageRef = ref(storage, msgData.imageUrl);
              await deleteObject(imageRef);
            } catch (error) {
              console.log("Error deleting chat image:", error);
            }
          }
          await deleteDoc(msgDoc.ref);
        }

        // Delete all community media
        const mediaRef = collection(db, `communities/${communityId}/media`);
        const mediaSnapshot = await getDocs(mediaRef);
        for (const mediaDoc of mediaSnapshot.docs) {
          const mediaData = mediaDoc.data();
          // Delete media file
          if (mediaData.url) {
            try {
              const mediaFileRef = ref(storage, mediaData.url);
              await deleteObject(mediaFileRef);
            } catch (error) {
              console.log("Error deleting media file:", error);
            }
          }
          await deleteDoc(mediaDoc.ref);
        }

        // Delete community members subcollection
        const membersRef = collection(
          db,
          `communities/${communityId}/communityMembers`,
        );
        const membersSnapshot = await getDocs(membersRef);
        for (const memberDoc of membersSnapshot.docs) {
          await deleteDoc(memberDoc.ref);
        }

        // Delete community cover image
        if (communityData.coverImage) {
          try {
            const coverImageRef = ref(storage, communityData.coverImage);
            await deleteObject(coverImageRef);
          } catch (error) {
            console.log("Error deleting community cover image:", error);
          }
        }

        // Delete the community itself
        await deleteDoc(communityDoc.ref);
        console.log(`Deleted community ${communityId}`);
      } else {
        // User is not creator, just remove from community
        console.log(`Removing user from community ${communityId}`);

        // Delete user's posts in this community
        const userCommunityPostsRef = collection(
          db,
          `communities/${communityId}/posts`,
        );
        const userCommunityPostsQuery = query(
          userCommunityPostsRef,
          where("userId", "==", userId),
        );
        const userCommunityPostsSnapshot = await getDocs(
          userCommunityPostsQuery,
        );

        for (const postDoc of userCommunityPostsSnapshot.docs) {
          const postData = postDoc.data();

          // Delete post images
          if (postData.images && postData.images.length > 0) {
            for (const imageUrl of postData.images) {
              try {
                const imageRef = ref(storage, imageUrl);
                await deleteObject(imageRef);
              } catch (error) {
                console.log("Error deleting community post image:", error);
              }
            }
          }

          // Delete post comments
          const postCommentsRef = collection(
            db,
            `communities/${communityId}/posts/${postDoc.id}/comments`,
          );
          const postCommentsSnapshot = await getDocs(postCommentsRef);
          for (const commentDoc of postCommentsSnapshot.docs) {
            await deleteDoc(commentDoc.ref);
          }

          await deleteDoc(postDoc.ref);
        }

        // Delete user's chat messages in this community
        const userChatRef = collection(db, `communities/${communityId}/chat`);
        const userChatQuery = query(userChatRef, where("userId", "==", userId));
        const userChatSnapshot = await getDocs(userChatQuery);

        for (const msgDoc of userChatSnapshot.docs) {
          const msgData = msgDoc.data();
          // Delete chat image if exists
          if (msgData.imageUrl) {
            try {
              const imageRef = ref(storage, msgData.imageUrl);
              await deleteObject(imageRef);
            } catch (error) {
              console.log("Error deleting chat image:", error);
            }
          }
          await deleteDoc(msgDoc.ref);
        }

        // Delete user's media in this community
        const userMediaRef = collection(db, `communities/${communityId}/media`);
        const userMediaQuery = query(
          userMediaRef,
          where("uploadedBy", "==", userId),
        );
        const userMediaSnapshot = await getDocs(userMediaQuery);

        for (const mediaDoc of userMediaSnapshot.docs) {
          const mediaData = mediaDoc.data();
          // Delete media file
          if (mediaData.url) {
            try {
              const mediaFileRef = ref(storage, mediaData.url);
              await deleteObject(mediaFileRef);
            } catch (error) {
              console.log("Error deleting media file:", error);
            }
          }
          await deleteDoc(mediaDoc.ref);
        }

        // Remove user from community
        await updateDoc(communityDoc.ref, {
          members: arrayRemove(userId),
          admins: arrayRemove(userId),
          memberCount: increment(-1),
          updatedAt: serverTimestamp(),
        });

        // Remove from members subcollection
        const membersQuery = query(
          collection(db, `communities/${communityId}/communityMembers`),
          where("userId", "==", userId),
        );
        const membersSnapshot = await getDocs(membersQuery);
        for (const memberDoc of membersSnapshot.docs) {
          await deleteDoc(memberDoc.ref);
        }
      }
    }

    // 5. Remove user from other users' joinedCommunities if any references exist
    console.log("Cleaning up community references in user profiles...");
    const allUsersRef = collection(db, "users");
    const allUsersSnapshot = await getDocs(allUsersRef);
    for (const userDoc of allUsersSnapshot.docs) {
      const userData = userDoc.data();
      if (
        userData.joinedCommunities &&
        userData.joinedCommunities.includes(userId)
      ) {
        await updateDoc(userDoc.ref, {
          joinedCommunities: arrayRemove(userId),
        });
      }
    }

    // 6. Delete user profile using the existing function
    console.log("Deleting user profile...");
    await deleteUserProfile(userId);

    // 7. Delete all user storage files
    console.log("Deleting user storage files...");
    try {
      const userStorageRef = ref(storage, `posts/${userId}`);
      const userStorageList = await listAll(userStorageRef);
      for (const item of userStorageList.items) {
        await deleteObject(item);
      }
    } catch (error) {
      console.log("Error deleting user storage:", error);
    }

    // 8. Delete Firebase Auth user
    console.log("Deleting Firebase Auth account...");
    const user = auth.currentUser;
    if (user && user.uid === userId) {
      await deleteUser(user);
      console.log("Firebase Auth account deleted successfully");
    }

    console.log(`Complete account deletion finished for user: ${userId}`);
  } catch (error) {
    console.error("Error deleting complete user account:", error);
    throw error;
  }
};
