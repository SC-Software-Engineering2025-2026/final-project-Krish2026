// Script to add likes and likesCount fields to existing posts
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

// Firebase configuration (using emulator)
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator
import { connectFirestoreEmulator } from "firebase/firestore";
connectFirestoreEmulator(db, "localhost", 8080);

async function migratePosts() {
  try {
    console.log("Starting migration...");

    // Get all communities
    const communitiesSnapshot = await getDocs(collection(db, "communities"));

    let totalPosts = 0;
    let updatedPosts = 0;

    for (const communityDoc of communitiesSnapshot.docs) {
      const communityId = communityDoc.id;
      console.log(`\nProcessing community: ${communityId}`);

      // Get all posts in this community
      const postsRef = collection(db, `communities/${communityId}/posts`);
      const postsSnapshot = await getDocs(postsRef);

      for (const postDoc of postsSnapshot.docs) {
        totalPosts++;
        const postData = postDoc.data();

        // Check if likes and likesCount fields exist
        if (
          !postData.hasOwnProperty("likes") ||
          !postData.hasOwnProperty("likesCount")
        ) {
          console.log(`  Updating post ${postDoc.id}...`);

          const updates = {};

          // Add likes array if missing
          if (!postData.hasOwnProperty("likes")) {
            updates.likes = [];
          }

          // Add likesCount if missing
          if (!postData.hasOwnProperty("likesCount")) {
            updates.likesCount = postData.likes?.length || 0;
          }

          if (Object.keys(updates).length > 0) {
            const postRef = doc(
              db,
              `communities/${communityId}/posts/${postDoc.id}`,
            );
            await updateDoc(postRef, updates);
            updatedPosts++;
            console.log(`    ✓ Updated with:`, updates);
          }
        }
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`Total posts processed: ${totalPosts}`);
    console.log(`Posts updated: ${updatedPosts}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

// Run migration
migratePosts();
