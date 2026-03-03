import { useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase";

/**
 * Temporary component to sync user communities
 * Add this to your app temporarily, visit the page, click the button, then remove it
 */
const SyncUserCommunities = () => {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const syncCommunities = async (userId) => {
    setSyncing(true);
    setError(null);
    setResult(null);

    try {
      console.log(`Syncing communities for user: ${userId}`);

      // Get all communities where the user is a member
      const communitiesRef = collection(db, "communities");
      const q = query(
        communitiesRef,
        where("members", "array-contains", userId),
      );
      const communitiesSnapshot = await getDocs(q);

      const communityIds = communitiesSnapshot.docs.map((doc) => doc.id);
      const communityDetails = communitiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        memberCount: doc.data().memberCount,
      }));

      console.log(
        `Found ${communityIds.length} communities:`,
        communityDetails,
      );

      if (communityIds.length === 0) {
        setResult({
          success: false,
          message: "No communities found for this user.",
        });
        setSyncing(false);
        return;
      }

      // Update user's joinedCommunities array
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        joinedCommunities: communityIds,
        updatedAt: serverTimestamp(),
      });

      setResult({
        success: true,
        message: `Successfully synced ${communityIds.length} communities!`,
        communities: communityDetails,
      });
    } catch (err) {
      console.error("Error syncing communities:", err);
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Sync User Communities</h2>
        <p className="text-gray-600 mb-6">
          This will sync the joinedCommunities array for user: <br />
          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
            yX3O6vZ1KYO2LBIIQjtIAlzbQMr1
          </code>
        </p>

        <button
          onClick={() => syncCommunities("yX3O6vZ1KYO2LBIIQjtIAlzbQMr1")}
          disabled={syncing}
          className="w-full px-6 py-3 rounded-lg disabled:bg-gray-400 font-medium"
          style={{ backgroundColor: COLORS.Dark_Gray, color: COLORS.Beige }}
        >
          {syncing ? "Syncing..." : "Sync Communities"}
        </button>

        {result && (
          <div
            className={`mt-6 p-4 rounded-lg ${result.success ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}`}
          >
            <p
              className={`font-semibold ${result.success ? "text-green-800" : "text-yellow-800"}`}
            >
              {result.message}
            </p>
            {result.communities && result.communities.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Communities synced:
                </p>
                <ul className="space-y-1">
                  {result.communities.map((comm) => (
                    <li key={comm.id} className="text-sm text-gray-600">
                      • {comm.name} ({comm.memberCount} members)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="font-semibold text-red-800">Error:</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncUserCommunities;
