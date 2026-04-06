// ===== Community Post Service =====
// Handles community-specific post creation, likes, comments, and engagement
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
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  runTransaction,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";

/**
 * CREATE COMMUNITY POST
 * Add a new post to a specific community's posts collection
 * @param {string} communityId - Community ID
 * @param {string} userId - Post creator's user ID
 * @param {Object} postData - Post content (text, hashtags, location, etc.)
 * @param {File[]} images - Array of image files to upload
 * @returns {Promise<string>} New post ID
 */
export const createCommunityPost = async (
  communityId,
  userId,
  postData,
  images = [],
) => {
  try {
    // Upload all images to Firebase Storage
    const imageUrls = [];
    for (const image of images) {
      const imageRef = ref(
        storage,
        `communities/${communityId}/posts/${Date.now()}_${image.name}`,
      );
      const snapshot = await uploadBytes(imageRef, image);
      const url = await getDownloadURL(snapshot.ref);
      imageUrls.push(url);
    }

    // Create post document in community's posts subcollection
    const postsRef = collection(db, `communities/${communityId}/posts`);
    const post = {
      userId, // Who posted
      content: postData.content || "",
      images: imageUrls,
      videos: postData.videos || [],
      location: postData.location || "",
      locationCoordinates: postData.locationCoordinates || null,
      hashtags: postData.hashtags || [], // Searchable tags
      taggedUsers: postData.taggedUsers || [], // Mentioned users
      likes: [], // Array of user IDs who liked
      likesCount: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(postsRef, post);
    return docRef.id;
  } catch (error) {
    console.error("Error creating community post:", error);
    throw new Error("Failed to create post");
  }
};

/**
 * GET COMMUNITY POSTS
 * Fetch all posts from a community (newest first)
 * @param {string} communityId - Community ID
 * @returns {Promise<Array>} Array of post objects with metadata
 */
export const getCommunityPosts = async (communityId) => {
  try {
    const postsRef = collection(db, `communities/${communityId}/posts`);
    // Query posts ordered by creation date (newest first)
    const q = query(postsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting community posts:", error);
    throw error;
  }
};

/**
 * LIKE A COMMUNITY POST
 * Add user to post's likes array and increment likes counter
 * @param {string} postId - Post ID (format: communityId/posts/postId)
 * @param {string} userId - User ID
 */
export const likeCommunityPost = async (postId, userId) => {
  try {
    // postId should be in format "communityId/posts/actualPostId"
    const postRef = doc(
      db,
      "communities",
      postId.split("/")[0],
      "posts",
      postId.split("/")[2] || postId,
    );
    await runTransaction(db, async (transaction) => {
      const postDoc = await transaction.get(postRef);

      if (!postDoc.exists()) {
        throw new Error("Post not found");
      }

      const likes = postDoc.data().likes || [];
      const currentLikesCount = postDoc.data().likesCount || 0;
      const isLiked = likes.includes(userId);

      if (isLiked) {
        transaction.update(postRef, {
          likes: likes.filter((id) => id !== userId),
          likesCount: Math.max(0, currentLikesCount - 1),
        });
        return;
      }

      transaction.update(postRef, {
        likes: [...likes, userId],
        likesCount: currentLikesCount + 1,
      });
    });
  } catch (error) {
    console.error("Error liking post:", error);
    throw error;
  }
};

/**
 * Add comment to community post
 * @param {string} postId - Post ID
 * @param {string} userId - User ID
 * @param {string} text - Comment text
 * @param {string} parentCommentId - Optional parent comment ID for replies
 * @returns {Promise<string>} Comment ID
 */
export const addCommentToCommunityPost = async (
  postId,
  userId,
  text,
  parentCommentId = null,
) => {
  try {
    const commentsRef = collection(
      db,
      `communities/${postId.split("/")[0]}/posts/${postId.split("/")[2] || postId}/comments`,
    );
    const comment = {
      userId,
      text,
      createdAt: serverTimestamp(),
      ...(parentCommentId && { parentCommentId }),
    };

    const docRef = await addDoc(commentsRef, comment);

    // Increment comment count
    const postRef = doc(
      db,
      "communities",
      postId.split("/")[0],
      "posts",
      postId.split("/")[2] || postId,
    );
    await updateDoc(postRef, {
      commentsCount: increment(1),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
};

/**
 * Get comments for a community post
 * @param {string} postId - Post ID
 * @returns {Promise<Array>} Array of comments
 */
export const getCommunityPostComments = async (postId) => {
  try {
    const commentsRef = collection(
      db,
      `communities/${postId.split("/")[0]}/posts/${postId.split("/")[2] || postId}/comments`,
    );
    const q = query(commentsRef, orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting comments:", error);
    throw error;
  }
};

/**
 * Update a comment on a community post
 * @param {string} postId - Post ID (format: communityId/posts/postId)
 * @param {string} commentId - Comment ID
 * @param {string} text - Updated comment text
 * @returns {Promise<void>}
 */
export const updateCommunityPostComment = async (postId, commentId, text) => {
  try {
    const commentRef = doc(
      db,
      `communities/${postId.split("/")[0]}/posts/${postId.split("/")[2] || postId}/comments`,
      commentId,
    );
    await updateDoc(commentRef, {
      text,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    throw error;
  }
};

/**
 * Delete a comment from a community post
 * @param {string} postId - Post ID (format: communityId/posts/postId)
 * @param {string} commentId - Comment ID
 * @returns {Promise<void>}
 */
export const deleteCommunityPostComment = async (postId, commentId) => {
  try {
    const commentRef = doc(
      db,
      `communities/${postId.split("/")[0]}/posts/${postId.split("/")[2] || postId}/comments`,
      commentId,
    );
    await deleteDoc(commentRef);

    // Decrement comment count
    const postRef = doc(
      db,
      "communities",
      postId.split("/")[0],
      "posts",
      postId.split("/")[2] || postId,
    );
    await updateDoc(postRef, {
      commentsCount: increment(-1),
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
};

/**
 * Like/unlike a comment on a community post
 * @param {string} postId - Post ID (format: communityId/posts/postId)
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const likeCommunityPostComment = async (postId, commentId, userId) => {
  try {
    const commentRef = doc(
      db,
      `communities/${postId.split("/")[0]}/posts/${postId.split("/")[2] || postId}/comments`,
      commentId,
    );
    const commentDoc = await getDoc(commentRef);

    if (!commentDoc.exists()) {
      throw new Error("Comment not found");
    }

    const likes = commentDoc.data().likes || [];
    const isLiked = likes.includes(userId);

    if (isLiked) {
      // Unlike
      await updateDoc(commentRef, {
        likes: arrayRemove(userId),
        likesCount: increment(-1),
      });
    } else {
      // Like
      await updateDoc(commentRef, {
        likes: arrayUnion(userId),
        likesCount: increment(1),
      });
    }
  } catch (error) {
    console.error("Error liking comment:", error);
    throw error;
  }
};

/**
 * Delete a community post
 * @param {string} communityId - Community ID
 * @param {string} postId - Post ID
 * @param {string} userId - User ID (must be author or admin)
 */
export const deleteCommunityPost = async (communityId, postId, userId) => {
  try {
    const postRef = doc(db, `communities/${communityId}/posts`, postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      throw new Error("Post not found");
    }

    const postData = postDoc.data();

    // Check if user is author (admin check would need to be done separately)
    if (postData.userId !== userId) {
      throw new Error("Only the post author can delete this post");
    }

    await deleteDoc(postRef);
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
};

/**
 * Get posts from all communities a user is a member of
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of posts with community info
 */
export const getUserCommunitiesPosts = async (userId) => {
  try {
    const { getCommunities } = await import("./communityService");
    const { getUserProfile } = await import("./profileService");

    // Get user's communities
    const communities = await getCommunities(userId);

    if (communities.length === 0) {
      return [];
    }

    // Get posts from each community
    const allPosts = [];
    for (const community of communities) {
      const postsRef = collection(db, `communities/${community.id}/posts`);
      const q = query(postsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const posts = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const postData = docSnap.data();

          // Get user profile for each post
          let userProfile = null;
          try {
            userProfile = await getUserProfile(postData.userId);
          } catch (error) {
            console.error("Error fetching user profile:", error);
          }

          return {
            id: docSnap.id,
            ...postData,
            communityId: community.id,
            communityName: community.name,
            communityImage: community.imageUrl,
            isCollaborative: community.isCollaborative,
            userProfile,
          };
        }),
      );

      allPosts.push(...posts);
    }

    // Sort all posts by creation date
    allPosts.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

    return allPosts;
  } catch (error) {
    console.error("Error getting user communities posts:", error);
    throw error;
  }
};

/**
 * Subscribe to community posts in real-time
 * @param {string} communityId - Community ID
 * @param {Function} callback - Callback function to receive posts
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCommunityPosts = (communityId, callback) => {
  const postsRef = collection(db, `communities/${communityId}/posts`);
  const q = query(postsRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const posts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(posts);
    },
    (error) => {
      console.error("Error listening to community posts:", error);
    },
  );
};

export default {
  createCommunityPost,
  getCommunityPosts,
  likeCommunityPost,
  addCommentToCommunityPost,
  getCommunityPostComments,
  deleteCommunityPost,
  getUserCommunitiesPosts,
};
