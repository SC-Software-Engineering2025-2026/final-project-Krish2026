// Utility to reset user's community count to actual memberships
// Use this to clean up ghost communities
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../services/firebase";

/**
 * Reset current user's joinedCommunities array to match actual memberships
 * Removes all ghost/stale communities
 */
export const resetCurrentUserCommunities = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("No user logged in");
    }

    const userId = user.uid;
    console.log(`Resetting communities for user: ${userId}`);

    // Find all communities where user is actually a member
    const communitiesRef = collection(db, "communities");
    const q = query(communitiesRef, where("members", "array-contains", userId));
    const communitiesSnapshot = await getDocs(q);

    const actualCommunityIds = communitiesSnapshot.docs.map((doc) => doc.id);
    const communityDetails = communitiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));

    console.log(
      `Found ${actualCommunityIds.length} actual communities:`,
      communityDetails,
    );

    // Update user's joinedCommunities array
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      joinedCommunities: actualCommunityIds,
      updatedAt: serverTimestamp(),
    });

    console.log(
      `✅ Successfully reset to ${actualCommunityIds.length} communities`,
    );
    return {
      success: true,
      count: actualCommunityIds.length,
      communities: communityDetails,
    };
  } catch (error) {
    console.error("Error resetting communities:", error);
    throw error;
  }
};

// Quick test function to check before running
export const checkUserCommunities = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("No user logged in");
    }

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User profile not found");
    }

    const userData = userSnap.data();

    // Find actual communities
    const communitiesRef = collection(db, "communities");
    const q = query(
      communitiesRef,
      where("members", "array-contains", user.uid),
    );
    const actualSnapshot = await getDocs(q);
    const actualCount = actualSnapshot.docs.length;

    const profileCount = userData.joinedCommunities?.length || 0;

    console.log(`📊 Community Count Status:`);
    console.log(`   Profile shows: ${profileCount} communities`);
    console.log(`   Actually in: ${actualCount} communities`);

    if (profileCount > actualCount) {
      console.log(
        `   ⚠️  ${profileCount - actualCount} ghost communities detected`,
      );
    }

    return {
      profileCount,
      actualCount,
      ghostCount: profileCount - actualCount,
      hasGhosts: profileCount > actualCount,
    };
  } catch (error) {
    console.error("Error checking communities:", error);
    throw error;
  }
};
