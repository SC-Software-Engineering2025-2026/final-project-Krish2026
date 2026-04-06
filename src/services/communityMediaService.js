// ===== Community Media Service =====
// Handles media uploads and shared library management for collaborative communities
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";

/**
 * UPLOAD MEDIA TO COMMUNITY LIBRARY
 * Upload images/videos to shared community storage and Firestore metadata
 * @param {string} communityId - Community ID
 * @param {string} userId - Uploader's user ID
 * @param {File} file - Media file to upload
 * @returns {Promise<string>} Media document ID
 */
export const uploadCommunityMedia = async (communityId, userId, file) => {
  try {
    // Determine media type based on file MIME type
    const fileType = file.type.startsWith("image") ? "image" : "video";
    const storageRef = ref(
      storage,
      `communities/${communityId}/media/${Date.now()}_${file.name}`,
    );

    // Upload file to Firebase Storage
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    // Save metadata in Firestore for gallery/access tracking
    const mediaRef = collection(db, `communities/${communityId}/media`);
    const mediaDoc = {
      userId, // Who uploaded it
      url, // Download URL
      type: fileType, // image or video
      fileName: file.name,
      fileSize: file.size,
      storagePath: snapshot.ref.fullPath, // Storage path for deletion
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(mediaRef, mediaDoc);
    return docRef.id;
  } catch (error) {
    console.error("Error uploading media:", error);
    throw new Error("Failed to upload media");
  }
};

/**
 * GET COMMUNITY MEDIA LIBRARY
 * Fetch all media gallery items for a community (sorted newest first)
 * @param {string} communityId - Community ID
 * @returns {Promise<Array>} Array of media items with metadata
 */
export const getCommunityMedia = async (communityId) => {
  try {
    const mediaRef = collection(db, `communities/${communityId}/media`);
    // Query all media ordered by upload date (newest first)
    const q = query(mediaRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting community media:", error);
    throw error;
  }
};

/**
 * Delete media from community library
 * @param {string} communityId - Community ID
 * @param {string} mediaId - Media ID
 * @param {string} userId - User ID (must be uploader or admin)
 */
export const deleteCommunityMedia = async (communityId, mediaId, userId) => {
  try {
    const mediaRef = doc(db, `communities/${communityId}/media`, mediaId);
    const mediaDoc = await getDoc(mediaRef);

    if (!mediaDoc.exists()) {
      throw new Error("Media not found");
    }

    const mediaData = mediaDoc.data();

    // Check if user is uploader (admin check would need to be done separately)
    if (mediaData.userId !== userId) {
      throw new Error("Only the uploader can delete this media");
    }

    // Delete from storage
    if (mediaData.storagePath) {
      try {
        const storageRef = ref(storage, mediaData.storagePath);
        await deleteObject(storageRef);
      } catch (err) {
        console.warn("Error deleting file from storage:", err);
      }
    }

    // Delete from Firestore
    await deleteDoc(mediaRef);
  } catch (error) {
    console.error("Error deleting media:", error);
    throw error;
  }
};

export default {
  uploadCommunityMedia,
  getCommunityMedia,
  deleteCommunityMedia,
};
