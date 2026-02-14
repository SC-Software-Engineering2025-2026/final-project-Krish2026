// Copy and paste this script into the browser console while logged in as an admin
// Or run it through the React app with proper authentication

async function syncUserCommunities(userId) {
  try {
    console.log(`\n🔄 Syncing communities for user: ${userId}`);
    console.log("=".repeat(60));

    // Import Firebase from the global scope (if running in browser)
    const {
      getFirestore,
      collection,
      query,
      where,
      getDocs,
      doc,
      updateDoc,
      serverTimestamp,
    } = window.firebase || {};

    if (!getFirestore) {
      console.error(
        "❌ Firebase not found. Make sure you are running this in the browser console.",
      );
      return;
    }

    const db = getFirestore();

    // Get all communities where the user is a member
    const communitiesRef = collection(db, "communities");
    const q = query(communitiesRef, where("members", "array-contains", userId));
    const communitiesSnapshot = await getDocs(q);

    const communityIds = communitiesSnapshot.docs.map((doc) => doc.id);
    const communityDetails = communitiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      memberCount: doc.data().memberCount,
    }));

    console.log(`\n📊 Found ${communityIds.length} communities:`);
    communityDetails.forEach((comm) => {
      console.log(
        `  ✓ ${comm.name} (${comm.id}) - ${comm.memberCount} members`,
      );
    });

    if (communityIds.length === 0) {
      console.log("\n⚠️  No communities found for this user.");
      return;
    }

    // Update user's joinedCommunities array
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      joinedCommunities: communityIds,
      updatedAt: serverTimestamp(),
    });

    console.log("\n✅ Successfully synced joinedCommunities array!");
    console.log(
      `📝 Updated user document with ${communityIds.length} communities.`,
    );
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Error syncing communities:", error);
  }
}

// Run the sync
syncUserCommunities("yX3O6vZ1KYO2LBIIQjtIAlzbQMr1");
