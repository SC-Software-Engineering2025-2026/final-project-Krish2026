// ===== User Post Service =====
// Handles personal user posts, feeds, likes, and comments on user profiles
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
import {
  createLikeNotification,
  createPostCommentNotification,
} from "./notificationService";
import { getUserProfile } from "./profileService";
import { getUniqueMentionedUsernames } from "../utils/mentionUtils";
import { createNotification } from "./notificationService";

/**
 * CREATE NEW USER POST
 * Add a new post to user's personal posts collection
 * Increments user's post count and uploads all images
 * Extracts mentions, creates notifications for tagged users
 * @param {string} userId - Post creator's user ID
 * @param {Object} postData - Post content (caption, location, tags, etc.)
 * @param {File[]} images - Array of image files to upload
 * @returns {Promise<string>} New post ID
 */
export const createPost = async (userId, postData, images = []) => {
  try {
    // Upload all images in parallel to Firebase Storage
    const imageUrls = await uploadPostImages(userId, images);

    // Extract mentions from caption
    const mentionedUsernames = getUniqueMentionedUsernames(
      postData.caption || "",
    );
    const taggedUserIds = [];

    // Resolve usernames to user IDs and create notifications
    if (mentionedUsernames.length > 0) {
      for (const username of mentionedUsernames) {
        try {
          // Find user by username
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("username", "==", username));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            const mentionedUser = snapshot.docs[0];
            const mentionedUserId = mentionedUser.id;
            const mentionedUserData = mentionedUser.data();

            // Don't tag the post creator
            if (mentionedUserId !== userId) {
              taggedUserIds.push(mentionedUserId);

              // Create mention notification
              try {
                const posterProfile = await getUserProfile(userId);
                if (posterProfile) {
                  await createNotification({
                    userId: mentionedUserId,
                    type: "mention",
                    actorId: userId,
                    actorName:
                      posterProfile.displayName || posterProfile.username,
                    actorProfileImage: posterProfile.profilePhotoURL || "",
                    postId: null, // Will be updated after post is created
                    message: `${posterProfile.displayName || posterProfile.username} mentioned you in a post`,
                  });
                }
              } catch (notifError) {
                console.error(
                  "Error creating mention notification:",
                  notifError,
                );
              }
            }
          }
        } catch (error) {
          console.error(`Error resolving username ${username}:`, error);
        }
      }
    }

    // Create post document in userPosts collection
    const postsRef = collection(db, "userPosts");
    const post = {
      userId, // Post owner
      caption: postData.caption || "",
      images: imageUrls,
      tags: postData.tags || [], // Legacy tags field (for hashtags)
      taggedUserIds: taggedUserIds, // New field: IDs of tagged users
      location: postData.location || "",
      locationCoordinates: postData.locationCoordinates || null,
      likesCount: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(postsRef, post);

    // Increment user's post counter
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
 * UPLOAD POST IMAGES
 * Upload multiple images to Firebase Storage in parallel
 * @param {string} userId - Post creator's user ID
 * @param {File[]} files - Array of image files
 * @returns {Promise<string[]>} Array of download URLs
 */
export const uploadPostImages = async (userId, files) => {
  try {
    if (!files || files.length === 0) return [];

    // Upload all images in parallel (Promise.all)
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
 * GET USER'S POSTS (PAGINATED)
 * Fetch user's posts with pagination support for infinite scroll
 * @param {string} userId - User ID
 * @param {number} limitCount - Number of posts per page (default: 12)
 * @param {Object} lastDoc - Last document for pagination cursor
 * @returns {Promise<Object>} { posts: Array, lastDoc: Object }
 */
export const getUserPosts = async (userId, limitCount = 12, lastDoc = null) => {
  try {
    const postsRef = collection(db, "userPosts");
    // Query user's posts ordered by newest first
    let q = query(
      postsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    );

    // For pagination, start after the last document
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Return last document for next pagination query
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

    return { posts, lastDoc: lastVisible };
  } catch (error) {
    console.error("Error getting user posts:", error);
    throw error;
  }
};

/**
 * GET SINGLE POST BY ID
 * Retrieve a specific post (useful for post detail pages)
 * @param {string} postId - Post ID
 * @returns {Promise<Object|null>} Post data or null if not found
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
    const postDoc = await getDoc(postRef);
    await updateDoc(postRef, {
      commentsCount: increment(1),
    });

    // Create notification for post owner
    try {
      if (postDoc.exists()) {
        const postData = postDoc.data();
        if (postData.userId && postData.userId !== userId) {
          const commenterProfile = await getUserProfile(userId);
          if (commenterProfile) {
            await createPostCommentNotification(
              userId,
              postData.userId,
              postId,
              commenterProfile,
            );
          }
        }
      }
    } catch (notifError) {
      console.error("Error creating comment notification:", notifError);
      // Don't throw error, comment was successful
    }

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
