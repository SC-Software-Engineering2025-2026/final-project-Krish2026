import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { connectFirestoreEmulator } from "firebase/firestore";

// Firebase configuration
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
connectFirestoreEmulator(db, "localhost", 8080);

async function syncUserCommunities(userId) {
  try {
    console.log(`\nSyncing communities for user: ${userId}`);
    console.log("=".repeat(60));

    // Get all communities where the user is a member
    const communitiesRef = collection(db, "communities");
    const q = query(communitiesRef, where("members", "array-contains", userId));
    const communitiesSnapshot = await getDocs(q);

    const communityIds = communitiesSnapshot.docs.map((doc) => doc.id);
    const communityNames = communitiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));

    console.log(`\nFound ${communityIds.length} communities:`);
    communityNames.forEach((comm) =>
      console.log(`  - ${comm.name} (${comm.id})`),
    );

    if (communityIds.length === 0) {
      console.log("\n⚠️  No communities found for this user.");
      process.exit(0);
    }

    // Update user's joinedCommunities array
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      joinedCommunities: communityIds,
      updatedAt: serverTimestamp(),
    });

    console.log("\n✅ Successfully synced joinedCommunities array!");
    console.log(
      `Updated user document with ${communityIds.length} communities.`,
    );
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error syncing communities:", error);
    process.exit(1);
  }
}

// Run the sync for the specified user
const userId = "yX3O6vZ1KYO2LBIIQjtIAlzbQMr1";
syncUserCommunities(userId);
