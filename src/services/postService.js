import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  runTransaction,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";
import { createLikeNotification } from "./notificationService";
import { getUserProfile } from "./profileService";

/**
 * Create a new post
 * @param {string} userId - The user ID
 * @param {Object} postData - Post data
 * @param {File[]} images - Array of image files
 * @returns {Promise<string>} Post ID
 */
export const createPost = async (userId, postData, images = []) => {
  try {
    // Upload images first
    const imageUrls = await uploadPostImages(userId, images);

    // Create post document
    const postsRef = collection(db, "userPosts");
    const post = {
      userId,
      caption: postData.caption || "",
      images: imageUrls,
      tags: postData.tags || [],
      location: postData.location || "",
      locationCoordinates: postData.locationCoordinates || null,
      likesCount: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(postsRef, post);

    // Update user's post count
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      postsCount: increment(1),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
};

/**
 * Upload post images
 * @param {string} userId - The user ID
 * @param {File[]} files - Array of image files
 * @returns {Promise<string[]>} Array of download URLs
 */
export const uploadPostImages = async (userId, files) => {
  try {
    if (!files || files.length === 0) return [];

    const uploadPromises = files.map(async (file, index) => {
      const timestamp = Date.now();
      const storageRef = ref(storage, `posts/${userId}/${timestamp}-${index}`);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading post images:", error);
    throw error;
  }
};

/**
 * Get user posts
 * @param {string} userId - The user ID
 * @param {number} limitCount - Number of posts to fetch
 * @param {Object} lastDoc - Last document for pagination
 * @returns {Promise<Object>} Posts array and last document
 */
export const getUserPosts = async (userId, limitCount = 12, lastDoc = null) => {
  try {
    const postsRef = collection(db, "userPosts");
    let q = query(
      postsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

    return { posts, lastDoc: lastVisible };
  } catch (error) {
    console.error("Error getting user posts:", error);
    throw error;
  }
};

/**
 * Get a single post by ID
 * @param {string} postId - The post ID
 * @returns {Promise<Object|null>} Post data or null
 */
export const getPost = async (postId) => {
  try {
    const postRef = doc(db, "userPosts", postId);
    const postSnap = await getDoc(postRef);

    if (postSnap.exists()) {
      return { id: postSnap.id, ...postSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting post:", error);
    throw error;
  }
};

/**
 * Update a post
 * @param {string} postId - The post ID
 * @param {Object} data - Data to update
 * @returns {Promise<void>}
 */
export const updatePost = async (postId, data) => {
  try {
    const postRef = doc(db, "userPosts", postId);
    await updateDoc(postRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating post:", error);
    throw error;
  }
};

/**
 * Delete a post
 * @param {string} postId - The post ID
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
export const deletePost = async (postId, userId) => {
  try {
    // Get post data to delete images
    const post = await getPost(postId);

    if (post && post.images && post.images.length > 0) {
      // Delete images from storage
      const deletePromises = post.images.map(async (imageUrl) => {
        try {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.log("Error deleting image:", error);
        }
      });
      await Promise.all(deletePromises);
    }

    // Delete post document
    const postRef = doc(db, "userPosts", postId);
    await deleteDoc(postRef);

    // Update user's post count
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      postsCount: increment(-1),
    });

    // Delete all comments for this post
    await deletePostComments(postId);
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
};

/**
 * Like a post
 * @param {string} postId - The post ID
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
export const likePost = async (postId, userId) => {
  try {
    const postRef = doc(db, "userPosts", postId);
    const likeRef = doc(db, "postLikes", `${postId}_${userId}`);

    // Check if already liked
    const likeSnap = await getDoc(likeRef);
    if (likeSnap.exists()) {
      console.log("Post already liked");
      return; // Already liked, do nothing
    }

    // Get post data to get post owner
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) {
      throw new Error("Post not found");
    }
    const postData = postSnap.data();
    const postOwnerId = postData.userId;

    // Add like document with specific ID
    await setDoc(likeRef, {
      postId,
      userId,
      createdAt: serverTimestamp(),
    });

    // Increment likes count
    await updateDoc(postRef, {
      likesCount: increment(1),
    });

    // Create like notification
    try {
      const likerProfile = await getUserProfile(userId);
      if (likerProfile) {
        await createLikeNotification(userId, postOwnerId, postId, likerProfile);
      }
    } catch (notifError) {
      console.error("Error creating like notification:", notifError);
      // Don't throw error, like action was successful
    }
  } catch (error) {
    console.error("Error liking post:", error);
    throw error;
  }
};

/**
 * Unlike a post
 * @param {string} postId - The post ID
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
export const unlikePost = async (postId, userId) => {
  try {
    const postRef = doc(db, "userPosts", postId);
    const likeRef = doc(db, "postLikes", `${postId}_${userId}`);

    await runTransaction(db, async (transaction) => {
      const [postSnap, likeSnap] = await Promise.all([
        transaction.get(postRef),
        transaction.get(likeRef),
      ]);

      if (!likeSnap.exists()) {
        console.log("Like not found");
        return;
      }

      if (!postSnap.exists()) {
        throw new Error("Post not found");
      }

      const currentLikesCount = postSnap.data().likesCount || 0;

      transaction.delete(likeRef);
      transaction.update(postRef, {
        likesCount: Math.max(0, currentLikesCount - 1),
      });
    });
  } catch (error) {
    console.error("Error unliking post:", error);
    throw error;
  }
};

/**
 * Check if user has liked a post
 * @param {string} postId - The post ID
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} True if liked
 */
export const hasLikedPost = async (postId, userId) => {
  try {
    const likeRef = doc(db, "postLikes", `${postId}_${userId}`);
    const likeSnap = await getDoc(likeRef);
    return likeSnap.exists();
  } catch (error) {
    console.error("Error checking if post is liked:", error);
    throw error;
  }
};

/**
 * Add a comment to a post
 * @param {string} postId - The post ID
 * @param {string} userId - The user ID
 * @param {string} text - Comment text
 * @param {string} parentCommentId - Optional parent comment ID for replies
 * @returns {Promise<string>} Comment ID
 */
export const addComment = async (
  postId,
  userId,
  text,
  parentCommentId = null,
) => {
  try {
    const commentsRef = collection(db, "postComments");
    const comment = {
      postId,
      userId,
      text,
      createdAt: serverTimestamp(),
      ...(parentCommentId && { parentCommentId }),
    };

    const docRef = await addDoc(commentsRef, comment);

    // Increment comments count
    const postRef = doc(db, "userPosts", postId);
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
 * Get comments for a post
 * @param {string} postId - The post ID
 * @param {number} limitCount - Number of comments to fetch
 * @returns {Promise<Array>} Array of comments
 */
export const getPostComments = async (postId, limitCount = 50) => {
  try {
    const commentsRef = collection(db, "postComments");
    const q = query(
      commentsRef,
      where("postId", "==", postId),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    );

    const querySnapshot = await getDocs(q);
    const comments = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return comments;
  } catch (error) {
    console.error("Error getting comments:", error);
    throw error;
  }
};

/**
 * Delete a comment
 * @param {string} commentId - The comment ID
 * @param {string} postId - The post ID
 * @returns {Promise<void>}
 */
export const deleteComment = async (commentId, postId) => {
  try {
    const commentRef = doc(db, "postComments", commentId);
    await deleteDoc(commentRef);

    // Decrement comments count
    const postRef = doc(db, "userPosts", postId);
    await updateDoc(postRef, {
      commentsCount: increment(-1),
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
};

/**
 * Update a comment
 * @param {string} commentId - The comment ID
 * @param {string} text - Updated comment text
 * @returns {Promise<void>}
 */
export const updateComment = async (commentId, text) => {
  try {
    const commentRef = doc(db, "postComments", commentId);
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
 * Like/unlike a comment
 * @param {string} commentId - The comment ID
 * @param {string} userId - The user ID
 * @returns {Promise<void>}
 */
export const likeComment = async (commentId, userId) => {
  try {
    const commentRef = doc(db, "postComments", commentId);
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
 * Delete all comments for a post
 * @param {string} postId - The post ID
 * @returns {Promise<void>}
 */
export const deletePostComments = async (postId) => {
  try {
    const commentsRef = collection(db, "postComments");
    const q = query(commentsRef, where("postId", "==", postId));

    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting post comments:", error);
    throw error;
  }
};

/**
 * Subscribe to user posts in real-time
 * @param {string} userId - The user ID
 * @param {Function} callback - Callback function to receive posts
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUserPosts = (userId, callback) => {
  const postsRef = collection(db, "userPosts");
  const q = query(
    postsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );

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
      console.error("Error listening to posts:", error);
    },
  );
};

/**
 * Subscribe to a single post in real-time
 * @param {string} postId - The post ID
 * @param {Function} callback - Callback function to receive post updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPost = (postId, callback) => {
  const postRef = doc(db, "userPosts", postId);

  return onSnapshot(
    postRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("Error listening to post:", error);
    },
  );
};

/**
 * Subscribe to user's liked posts in real-time
 * @param {string} userId - The user ID
 * @param {Function} callback - Callback function to receive liked post IDs
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUserLikes = (userId, callback) => {
  const likesRef = collection(db, "postLikes");
  const q = query(likesRef, where("userId", "==", userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const likedPostIds = snapshot.docs.map((doc) => doc.data().postId);
      callback(likedPostIds);
    },
    (error) => {
      console.error("Error listening to likes:", error);
    },
  );
};

/**
 * Get all recent posts for home feed
 * @param {number} limitCount - Number of posts to fetch
 * @returns {Promise<Array>} Array of posts
 */
export const getAllRecentPosts = async (limitCount = 20) => {
  try {
    const postsRef = collection(db, "userPosts");
    const q = query(postsRef, orderBy("createdAt", "desc"), limit(limitCount));

    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return posts;
  } catch (error) {
    console.error("Error getting all posts:", error);
    throw error;
  }
};

/**
 * Subscribe to all recent posts in real-time
 * @param {Function} callback - Callback function to receive posts
 * @param {number} limitCount - Number of posts to fetch
 * @returns {Function} Unsubscribe function
 */
export const subscribeToAllPosts = (callback, limitCount = 20) => {
  const postsRef = collection(db, "userPosts");
  const q = query(postsRef, orderBy("createdAt", "desc"), limit(limitCount));

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
      console.error("Error listening to all posts:", error);
    },
  );
};
