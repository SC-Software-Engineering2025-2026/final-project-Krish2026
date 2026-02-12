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
  startAfter,
  serverTimestamp,
  increment,
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

    // Add like document
    await addDoc(collection(db, "postLikes"), {
      postId,
      userId,
      createdAt: serverTimestamp(),
    });

    // Increment likes count
    await updateDoc(postRef, {
      likesCount: increment(1),
    });
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

    // Find and delete like document
    const likesRef = collection(db, "postLikes");
    const q = query(
      likesRef,
      where("postId", "==", postId),
      where("userId", "==", userId),
    );

    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Decrement likes count
    await updateDoc(postRef, {
      likesCount: increment(-1),
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
    const likesRef = collection(db, "postLikes");
    const q = query(
      likesRef,
      where("postId", "==", postId),
      where("userId", "==", userId),
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
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
 * @returns {Promise<string>} Comment ID
 */
export const addComment = async (postId, userId, text) => {
  try {
    const commentsRef = collection(db, "postComments");
    const comment = {
      postId,
      userId,
      text,
      createdAt: serverTimestamp(),
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
