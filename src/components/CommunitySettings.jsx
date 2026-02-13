import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getCommunity,
  getCommunityMembers,
  updateCommunity,
  deleteCommunity,
  removeMember,
  promoteToAdmin,
  leaveCommunity,
} from "../services/communityService";

const CommunitySettings = ({ communityId, userRole }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general"); // general, members

  const isAdmin = userRole === "admin";
  const isCreator = community?.creatorId === currentUser.uid;
  const canDelete = isCreator || isAdmin;

  useEffect(() => {
    loadData();
  }, [communityId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [communityData, membersData] = await Promise.all([
        getCommunity(communityId),
        getCommunityMembers(communityId),
      ]);
      setCommunity(communityData);
      setMembers(membersData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCommunity = async (updates) => {
    if (!isAdmin) return;

    setSaving(true);
    try {
      await updateCommunity(communityId, updates);
      await loadData();
    } catch (error) {
      console.error("Error updating community:", error);
      alert("Failed to update community");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!canDelete) {
      alert("Only the creator or admin can delete this community");
      return;
    }

    const confirmed = confirm(
      "Are you sure you want to delete this community? This action cannot be undone. All posts, messages, and media will be permanently deleted.",
    );
    if (!confirmed) return;

    try {
      await deleteCommunity(communityId, currentUser.uid);
      navigate("/communities");
    } catch (error) {
      console.error("Error deleting community:", error);
      alert(error.message || "Failed to delete community");
    }
  };

  const handleLeaveCommunity = async () => {
    if (isCreator) {
      alert(
        "Creator cannot leave the community. Transfer ownership or delete the community.",
      );
      return;
    }

    const confirmed = confirm("Are you sure you want to leave this community?");
    if (!confirmed) return;

    try {
      await leaveCommunity(communityId, currentUser.uid);
      navigate("/communities");
    } catch (error) {
      console.error("Error leaving community:", error);
      alert(error.message || "Failed to leave community");
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!isAdmin) return;

    const confirmed = confirm("Are you sure you want to remove this member?");
    if (!confirmed) return;

    try {
      await removeMember(communityId, userId, currentUser.uid);
      await loadData();
    } catch (error) {
      console.error("Error removing member:", error);
      alert(error.message || "Failed to remove member");
    }
  };

  const handlePromoteToAdmin = async (userId) => {
    if (!isAdmin) return;

    const confirmed = confirm(
      "Are you sure you want to promote this member to admin?",
    );
    if (!confirmed) return;

    try {
      await promoteToAdmin(communityId, userId, currentUser.uid);
      await loadData();
    } catch (error) {
      console.error("Error promoting member:", error);
      alert(error.message || "Failed to promote member");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Community Settings</h2>
          <p className="text-gray-600 mb-6">
            Only admins can access community settings.
          </p>
          <button
            onClick={handleLeaveCommunity}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Leave Community
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Community Settings</h2>
          <p className="text-gray-600 mt-1">
            Manage your community settings and members
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("general")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "general"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "members"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Members ({members.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "general" && (
            <GeneralSettings
              community={community}
              onUpdate={handleUpdateCommunity}
              onDelete={handleDeleteCommunity}
              canDelete={canDelete}
              saving={saving}
            />
          )}
          {activeTab === "members" && (
            <MembersSettings
              members={members}
              community={community}
              onRemove={handleRemoveMember}
              onPromote={handlePromoteToAdmin}
              currentUserId={currentUser.uid}
              isCreator={isCreator}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// General Settings Tab
const GeneralSettings = ({
  community,
  onUpdate,
  onDelete,
  canDelete,
  saving,
}) => {
  const [formData, setFormData] = useState({
    name: community?.name || "",
    description: community?.description || "",
    isPublic: community?.isPublic ?? true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Community Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Community Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            maxLength={50}
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            maxLength={500}
          />
        </div>

        {/* Privacy Setting */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">Public Community</h3>
            <p className="text-sm text-gray-500">
              {formData.isPublic
                ? "Anyone can find and join this community"
                : "Only invited members can join"}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setFormData({ ...formData, isPublic: !formData.isPublic })
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.isPublic ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.isPublic ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Community Type (Read-only) */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900">Community Type</h3>
          <p className="text-sm text-gray-500 mt-1">
            {community?.isCollaborative ? "Collaborative" : "Informational"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Community type cannot be changed after creation
          </p>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Danger Zone */}
      {canDelete && (
        <div className="pt-6 border-t">
          <h3 className="text-lg font-semibold text-red-600 mb-4">
            Danger Zone
          </h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900">Delete Community</h4>
            <p className="text-sm text-red-700 mt-1 mb-4">
              Once you delete a community, there is no going back. This will
              permanently delete all posts, comments, messages, media, and
              member data.
            </p>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Delete Community
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Members Settings Tab
const MembersSettings = ({
  members,
  community,
  onRemove,
  onPromote,
  currentUserId,
  isCreator,
}) => {
  const [search, setSearch] = useState("");

  const filteredMembers = members.filter((member) =>
    member.userId.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Members List */}
      <div className="space-y-2">
        {filteredMembers.map((member) => {
          const isCurrentUser = member.userId === currentUserId;
          const isCommunityCreator = member.userId === community?.creatorId;
          const isMemberAdmin = member.role === "admin";

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">
                      {isCurrentUser
                        ? "You"
                        : `User ${member.userId.slice(0, 8)}`}
                    </p>
                    {isCommunityCreator && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                        Creator
                      </span>
                    )}
                    {isMemberAdmin && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Joined{" "}
                    {member.joinedAt?.toDate?.().toLocaleDateString() ||
                      "Recently"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {!isCurrentUser && !isCommunityCreator && (
                <div className="flex items-center space-x-2">
                  {!isMemberAdmin && (
                    <button
                      onClick={() => onPromote(member.userId)}
                      className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Promote to Admin
                    </button>
                  )}
                  <button
                    onClick={() => onRemove(member.userId)}
                    className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No members found</p>
        </div>
      )}
    </div>
  );
};

export default CommunitySettings;
