import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
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
 * Create a new community
 * @param {string} userId - The creator's user ID
 * @param {Object} communityData - Community data
 * @param {File} imageFile - Community image file
 * @returns {Promise<string>} Community ID
 */
export const createCommunity = async (
  userId,
  communityData,
  imageFile = null,
) => {
  try {
    let imageUrl = "";

    // Upload image if provided
    if (imageFile) {
      const imageRef = ref(
        storage,
        `communities/${Date.now()}_${imageFile.name}`,
      );
      const snapshot = await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    // Create community document
    const communitiesRef = collection(db, "communities");
    const community = {
      name: communityData.name,
      description: communityData.description || "",
      imageUrl,
      isPublic: communityData.isPublic,
      isCollaborative: communityData.isCollaborative,
      creatorId: userId,
      admins: [userId],
      members: [userId],
      memberCount: 1,
      homePageContent: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(communitiesRef, community);

    // Add user to community members subcollection
    await addDoc(collection(db, `communities/${docRef.id}/communityMembers`), {
      userId,
      role: "admin",
      joinedAt: serverTimestamp(),
    });

    // Add community to user's joinedCommunities array
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      joinedCommunities: arrayUnion(docRef.id),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating community:", error);
    throw new Error("Failed to create community");
  }
};

/**
 * Get community by ID
 * @param {string} communityId - Community ID
 * @returns {Promise<Object>} Community data
 */
export const getCommunity = async (communityId) => {
  try {
    const communityDoc = await getDoc(doc(db, "communities", communityId));

    if (!communityDoc.exists()) {
      throw new Error("Community not found");
    }

    return {
      id: communityDoc.id,
      ...communityDoc.data(),
    };
  } catch (error) {
    console.error("Error getting community:", error);
    throw error;
  }
};

/**
 * Get all public communities or user's communities
 * @param {string} userId - Optional user ID to get user's communities
 * @returns {Promise<Array>} Array of communities
 */
export const getCommunities = async (userId = null) => {
  try {
    const communitiesRef = collection(db, "communities");
    let q;

    if (userId) {
      // Get communities where user is a member
      q = query(
        communitiesRef,
        where("members", "array-contains", userId),
        orderBy("updatedAt", "desc"),
      );
    } else {
      // Get all public communities
      q = query(
        communitiesRef,
        where("isPublic", "==", true),
        orderBy("memberCount", "desc"),
        limit(50),
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting communities:", error);
    throw error;
  }
};

/**
 * Get all communities regardless of privacy setting
 * @returns {Promise<Array>} Array of all communities
 */
export const getAllCommunities = async () => {
  try {
    const communitiesRef = collection(db, "communities");
    const q = query(communitiesRef, orderBy("memberCount", "desc"), limit(100));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting all communities:", error);
    throw error;
  }
};

/**
 * Get multiple communities by their IDs
 * @param {Array<string>} communityIds - Array of community IDs
 * @returns {Promise<Array>} Array of community objects
 */
export const getCommunitiesByIds = async (communityIds) => {
  try {
    if (!communityIds || communityIds.length === 0) {
      return [];
    }

    // Fetch all communities in parallel
    const communityPromises = communityIds.map(async (id) => {
      try {
        const communityDoc = await getDoc(doc(db, "communities", id));
        if (communityDoc.exists()) {
          return {
            id: communityDoc.id,
            ...communityDoc.data(),
          };
        }
        return null;
      } catch (error) {
        console.error(`Error fetching community ${id}:`, error);
        return null;
      }
    });

    const communities = await Promise.all(communityPromises);
    // Filter out any null values (communities that don't exist or had errors)
    return communities.filter((community) => community !== null);
  } catch (error) {
    console.error("Error getting communities by IDs:", error);
    throw error;
  }
};

/**
 * Join a community
 * @param {string} communityId - Community ID
 * @param {string} userId - User ID
 */
export const joinCommunity = async (communityId, userId) => {
  try {
    const communityRef = doc(db, "communities", communityId);
    const communityDoc = await getDoc(communityRef);

    if (!communityDoc.exists()) {
      throw new Error("Community not found");
    }

    const communityData = communityDoc.data();

    // Check if already a member
    if (communityData.members?.includes(userId)) {
      throw new Error("Already a member of this community");
    }

    // Check if community is private
    if (!communityData.isPublic) {
      throw new Error("Cannot join private community without invitation");
    }

    // Use batch write to update both community and user profile
    const batch = writeBatch(db);

    // Add user to members array and increment count
    batch.update(communityRef, {
      members: arrayUnion(userId),
      memberCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    // Update user's joinedCommunities array
    const userRef = doc(db, "users", userId);
    batch.update(userRef, {
      joinedCommunities: arrayUnion(communityId),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    // Add to community members subcollection
    await addDoc(
      collection(db, `communities/${communityId}/communityMembers`),
      {
        userId,
        role: "member",
        joinedAt: serverTimestamp(),
      },
    );
  } catch (error) {
    console.error("Error joining community:", error);
    throw error;
  }
};

/**
 * Leave a community
 * @param {string} communityId - Community ID
 * @param {string} userId - User ID
 */
export const leaveCommunity = async (communityId, userId) => {
  try {
    const communityRef = doc(db, "communities", communityId);
    const communityDoc = await getDoc(communityRef);

    if (!communityDoc.exists()) {
      throw new Error("Community not found");
    }

    const communityData = communityDoc.data();

    // Check if user is the creator
    if (communityData.creatorId === userId) {
      throw new Error(
        "Creator cannot leave the community. Transfer ownership or delete the community.",
      );
    }

    // Use batch write to update both community and user profile
    const batch = writeBatch(db);

    // Remove user from members and admins arrays
    batch.update(communityRef, {
      members: arrayRemove(userId),
      admins: arrayRemove(userId),
      memberCount: increment(-1),
      updatedAt: serverTimestamp(),
    });

    // Update user's joinedCommunities array
    const userRef = doc(db, "users", userId);
    batch.update(userRef, {
      joinedCommunities: arrayRemove(communityId),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    // Remove from community members subcollection
    const membersQuery = query(
      collection(db, `communities/${communityId}/communityMembers`),
      where("userId", "==", userId),
    );
    const membersSnapshot = await getDocs(membersQuery);

    const memberBatch = writeBatch(db);
    membersSnapshot.docs.forEach((doc) => {
      memberBatch.delete(doc.ref);
    });
    await memberBatch.commit();
  } catch (error) {
    console.error("Error leaving community:", error);
    throw error;
  }
};

/**
 * Update community information
 * @param {string} communityId - Community ID
 * @param {Object} updates - Updates to apply
 * @param {File} newImage - Optional new image file
 */
export const updateCommunity = async (
  communityId,
  updates,
  newImage = null,
) => {
  try {
    const updateData = { ...updates };

    // Upload new image if provided
    if (newImage) {
      const imageRef = ref(
        storage,
        `communities/${Date.now()}_${newImage.name}`,
      );
      const snapshot = await uploadBytes(imageRef, newImage);
      updateData.imageUrl = await getDownloadURL(snapshot.ref);
    }

    updateData.updatedAt = serverTimestamp();

    await updateDoc(doc(db, "communities", communityId), updateData);
  } catch (error) {
    console.error("Error updating community:", error);
    throw error;
  }
};

/**
 * Delete a community
 * @param {string} communityId - Community ID
 * @param {string} userId - User ID (must be creator)
 */
export const deleteCommunity = async (communityId, userId) => {
  try {
    const communityDoc = await getDoc(doc(db, "communities", communityId));

    if (!communityDoc.exists()) {
      throw new Error("Community not found");
    }

    const communityData = communityDoc.data();

    // Only creator or admin can delete
    const isCreator = communityData.creatorId === userId;
    const isAdmin = communityData.admins?.includes(userId);

    if (!isCreator && !isAdmin) {
      throw new Error("Only the creator or admin can delete this community");
    }

    // Helper function to get storage path from URL
    const getStoragePathFromUrl = (url) => {
      if (!url) return null;
      try {
        // If it's already a path, return it
        if (!url.includes("http")) return url;

        // Extract path from Firebase Storage URL
        const urlObj = new URL(url);
        const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
        if (pathMatch) {
          return decodeURIComponent(pathMatch[1]);
        }
        return null;
      } catch (err) {
        console.warn("Error parsing storage URL:", err);
        return null;
      }
    };

    // Delete community image from storage
    if (communityData.imageUrl) {
      try {
        const storagePath = getStoragePathFromUrl(communityData.imageUrl);
        if (storagePath) {
          const imageRef = ref(storage, storagePath);
          await deleteObject(imageRef);
        }
      } catch (err) {
        console.warn("Error deleting community image:", err);
      }
    }

    // Delete all post images from storage
    try {
      const postsSnapshot = await getDocs(
        collection(db, `communities/${communityId}/posts`),
      );

      for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data();

        // Delete post images
        if (postData.images && Array.isArray(postData.images)) {
          for (const imageUrl of postData.images) {
            try {
              const storagePath = getStoragePathFromUrl(imageUrl);
              if (storagePath) {
                const imageRef = ref(storage, storagePath);
                await deleteObject(imageRef);
              }
            } catch (err) {
              console.warn("Error deleting post image:", err);
            }
          }
        }

        // Delete post videos
        if (postData.videos && Array.isArray(postData.videos)) {
          for (const videoUrl of postData.videos) {
            try {
              const storagePath = getStoragePathFromUrl(videoUrl);
              if (storagePath) {
                const videoRef = ref(storage, storagePath);
                await deleteObject(videoRef);
              }
            } catch (err) {
              console.warn("Error deleting post video:", err);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Error deleting post media:", err);
    }

    // Delete all media library files from storage
    try {
      const mediaSnapshot = await getDocs(
        collection(db, `communities/${communityId}/media`),
      );

      for (const mediaDoc of mediaSnapshot.docs) {
        const mediaData = mediaDoc.data();
        if (mediaData.url) {
          try {
            const storagePath = getStoragePathFromUrl(mediaData.url);
            if (storagePath) {
              const mediaRef = ref(storage, storagePath);
              await deleteObject(mediaRef);
            }
          } catch (err) {
            console.warn("Error deleting media file:", err);
          }
        }
      }
    } catch (err) {
      console.warn("Error deleting media library:", err);
    }

    // Delete subcollections and main document using batches
    const batch = writeBatch(db);
    let batchCount = 0;
    const MAX_BATCH_SIZE = 500;

    // Helper function to commit batch if needed
    const commitIfNeeded = async () => {
      if (batchCount >= MAX_BATCH_SIZE) {
        await batch.commit();
        batchCount = 0;
      }
    };

    // Delete community members
    const membersSnapshot = await getDocs(
      collection(db, `communities/${communityId}/communityMembers`),
    );
    for (const memberDoc of membersSnapshot.docs) {
      batch.delete(memberDoc.ref);
      batchCount++;
      await commitIfNeeded();
    }

    // Delete community posts and their comments
    const postsSnapshot = await getDocs(
      collection(db, `communities/${communityId}/posts`),
    );
    for (const postDoc of postsSnapshot.docs) {
      // Delete comments for this post
      const commentsSnapshot = await getDocs(
        collection(
          db,
          `communities/${communityId}/posts/${postDoc.id}/comments`,
        ),
      );
      for (const commentDoc of commentsSnapshot.docs) {
        batch.delete(commentDoc.ref);
        batchCount++;
        await commitIfNeeded();
      }

      // Delete the post
      batch.delete(postDoc.ref);
      batchCount++;
      await commitIfNeeded();
    }

    // Delete media library
    const mediaSnapshot = await getDocs(
      collection(db, `communities/${communityId}/media`),
    );
    for (const mediaDoc of mediaSnapshot.docs) {
      batch.delete(mediaDoc.ref);
      batchCount++;
      await commitIfNeeded();
    }

    // Delete chat messages
    const chatSnapshot = await getDocs(
      collection(db, `communities/${communityId}/chat`),
    );
    for (const chatDoc of chatSnapshot.docs) {
      batch.delete(chatDoc.ref);
      batchCount++;
      await commitIfNeeded();
    }

    // Delete community document
    batch.delete(doc(db, "communities", communityId));

    // Commit final batch
    await batch.commit();

    console.log("Community and all associated data deleted successfully");
  } catch (error) {
    console.error("Error deleting community:", error);
    throw error;
  }
};

/**
 * Get user's role in a community
 * @param {string} communityId - Community ID
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} Role ('admin', 'member') or null
 */
export const getUserRole = async (communityId, userId) => {
  try {
    // First check the main community document
    const communityDoc = await getDoc(doc(db, "communities", communityId));

    if (!communityDoc.exists()) {
      console.error("Community not found:", communityId);
      return null;
    }

    const communityData = communityDoc.data();

    // Check if user is in members array
    if (!communityData.members?.includes(userId)) {
      return null; // Not a member at all
    }

    // Check if user is an admin
    if (communityData.admins?.includes(userId)) {
      return "admin";
    }

    // Then query the subcollection for the specific role
    const membersQuery = query(
      collection(db, `communities/${communityId}/communityMembers`),
      where("userId", "==", userId),
    );
    const snapshot = await getDocs(membersQuery);

    if (!snapshot.empty) {
      return snapshot.docs[0].data().role;
    }

    // Fallback: if in members array but not in subcollection, return "member"
    return "member";
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};

/**
 * Check if user is a member of a community
 * @param {string} communityId - Community ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const isMember = async (communityId, userId) => {
  try {
    const communityDoc = await getDoc(doc(db, "communities", communityId));
    if (!communityDoc.exists()) return false;

    const members = communityDoc.data().members || [];
    return members.includes(userId);
  } catch (error) {
    console.error("Error checking membership:", error);
    return false;
  }
};

/**
 * Promote user to admin
 * @param {string} communityId - Community ID
 * @param {string} userId - User ID to promote
 * @param {string} promoterId - ID of user performing the promotion
 */
export const promoteToAdmin = async (communityId, userId, promoterId) => {
  try {
    const communityRef = doc(db, "communities", communityId);
    const communityDoc = await getDoc(communityRef);

    if (!communityDoc.exists()) {
      throw new Error("Community not found");
    }

    const admins = communityDoc.data().admins || [];

    // Check if promoter is an admin
    if (!admins.includes(promoterId)) {
      throw new Error("Only admins can promote users");
    }

    // Add user to admins array
    await updateDoc(communityRef, {
      admins: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });

    // Update role in members subcollection
    const membersQuery = query(
      collection(db, `communities/${communityId}/communityMembers`),
      where("userId", "==", userId),
    );
    const membersSnapshot = await getDocs(membersQuery);

    if (!membersSnapshot.empty) {
      await updateDoc(membersSnapshot.docs[0].ref, {
        role: "admin",
      });
    }
  } catch (error) {
    console.error("Error promoting user:", error);
    throw error;
  }
};

/**
 * Remove user from community (kick)
 * @param {string} communityId - Community ID
 * @param {string} userIdToRemove - User ID to remove
 * @param {string} adminId - ID of admin performing the removal
 */
export const removeMember = async (communityId, userIdToRemove, adminId) => {
  try {
    const communityRef = doc(db, "communities", communityId);
    const communityDoc = await getDoc(communityRef);

    if (!communityDoc.exists()) {
      throw new Error("Community not found");
    }

    const communityData = communityDoc.data();

    // Check if remover is an admin
    if (!communityData.admins?.includes(adminId)) {
      throw new Error("Only admins can remove members");
    }

    // Cannot remove the creator
    if (communityData.creatorId === userIdToRemove) {
      throw new Error("Cannot remove the community creator");
    }

    // Remove user
    await updateDoc(communityRef, {
      members: arrayRemove(userIdToRemove),
      admins: arrayRemove(userIdToRemove),
      memberCount: increment(-1),
      updatedAt: serverTimestamp(),
    });

    // Remove from members subcollection
    const membersQuery = query(
      collection(db, `communities/${communityId}/communityMembers`),
      where("userId", "==", userIdToRemove),
    );
    const membersSnapshot = await getDocs(membersQuery);

    const batch = writeBatch(db);
    membersSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error removing member:", error);
    throw error;
  }
};

/**
 * Get community members with their roles
 * @param {string} communityId - Community ID
 * @returns {Promise<Array>} Array of members with roles
 */
export const getCommunityMembers = async (communityId) => {
  try {
    const membersSnapshot = await getDocs(
      collection(db, `communities/${communityId}/communityMembers`),
    );

    return membersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting community members:", error);
    throw error;
  }
};

/**
 * Update community home page content
 * @param {string} communityId - Community ID
 * @param {string} content - HTML content from rich text editor
 */
export const updateHomePageContent = async (communityId, content) => {
  try {
    await updateDoc(doc(db, "communities", communityId), {
      homePageContent: content,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating home page content:", error);
    throw error;
  }
};

/**
 * Listen to community updates in real-time
 * @param {string} communityId - Community ID
 * @param {Function} callback - Callback function to receive updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCommunity = (communityId, callback) => {
  const communityRef = doc(db, "communities", communityId);

  return onSnapshot(
    communityRef,
    (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data(),
        });
      }
    },
    (error) => {
      console.error("Error listening to community:", error);
    },
  );
};

export default {
  createCommunity,
  getCommunity,
  getCommunities,
  getAllCommunities,
  getCommunitiesByIds,
  joinCommunity,
  leaveCommunity,
  updateCommunity,
  deleteCommunity,
  getUserRole,
  isMember,
  promoteToAdmin,
  removeMember,
  getCommunityMembers,
  updateHomePageContent,
  subscribeToCommunity,
};
