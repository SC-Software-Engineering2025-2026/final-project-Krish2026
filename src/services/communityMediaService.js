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
 * Upload media to community library
 * @param {string} communityId - Community ID
 * @param {string} userId - User ID
 * @param {File} file - Media file
 * @returns {Promise<string>} Media ID
 */
export const uploadCommunityMedia = async (communityId, userId, file) => {
  try {
    const fileType = file.type.startsWith("image") ? "image" : "video";
    const storageRef = ref(
      storage,
      `communities/${communityId}/media/${Date.now()}_${file.name}`,
    );

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    // Save metadata to Firestore
    const mediaRef = collection(db, `communities/${communityId}/media`);
    const mediaDoc = {
      userId,
      url,
      type: fileType,
      fileName: file.name,
      fileSize: file.size,
      storagePath: snapshot.ref.fullPath,
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
 * Get all media from community library
 * @param {string} communityId - Community ID
 * @returns {Promise<Array>} Array of media items
 */
export const getCommunityMedia = async (communityId) => {
  try {
    const mediaRef = collection(db, `communities/${communityId}/media`);
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
