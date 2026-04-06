// Script to fix community membership
const admin = require("firebase-admin");

// Initialize Firebase Admin with emulator
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

admin.initializeApp({
  projectId: "sfera-91b35",
});

const db = admin.firestore();

async function fixMembership() {
  try {
    // Get all communities
    const communitiesSnapshot = await db.collection("communities").get();

    console.log(`Found ${communitiesSnapshot.size} communities\n`);

    for (const communityDoc of communitiesSnapshot.docs) {
      const community = communityDoc.data();
      const communityId = communityDoc.id;

      console.log(`Community: ${community.name} (${communityId})`);
      console.log(`Creator: ${community.creatorId}`);
      console.log(`Current members: ${community.members?.length || 0}`);
      console.log(`Current admins: ${community.admins?.length || 0}`);

      // Check if creator is in members array
      if (
        community.creatorId &&
        !community.members?.includes(community.creatorId)
      ) {
        console.log("⚠️  Creator not in members array! Fixing...");

        await db
          .collection("communities")
          .doc(communityId)
          .update({
            members: admin.firestore.FieldValue.arrayUnion(community.creatorId),
            memberCount: admin.firestore.FieldValue.increment(0), // Don't change if already counted
          });

        console.log("✅ Added creator to members array");
      }

      // Check if creator is in admins array
      if (
        community.creatorId &&
        !community.admins?.includes(community.creatorId)
      ) {
        console.log("⚠️  Creator not in admins array! Fixing...");

        await db
          .collection("communities")
          .doc(communityId)
          .update({
            admins: admin.firestore.FieldValue.arrayUnion(community.creatorId),
          });

        console.log("✅ Added creator to admins array");
      }

      // Check if communityMembers subcollection has the creator
      const membersSnapshot = await db
        .collection("communities")
        .doc(communityId)
        .collection("communityMembers")
        .where("userId", "==", community.creatorId)
        .get();

      if (membersSnapshot.empty && community.creatorId) {
        console.log(
          "⚠️  Creator not in communityMembers subcollection! Fixing...",
        );

        await db
          .collection("communities")
          .doc(communityId)
          .collection("communityMembers")
          .add({
            userId: community.creatorId,
            role: "admin",
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        console.log("✅ Added creator to communityMembers subcollection");
      }

      console.log("---\n");
    }

    console.log("✅ All communities checked and fixed!");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing membership:", error);
    process.exit(1);
  }
}

fixMembership();
