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
  transferOwnership,
  demoteAdmin,
} from "../services/communityService";
import { getUserProfile } from "../services/profileService";

const CommunitySettings = ({ communityId, userRole }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberProfiles, setMemberProfiles] = useState({});
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

      // Fetch user profiles for all members
      const profiles = {};
      await Promise.all(
        membersData.map(async (member) => {
          try {
            const profile = await getUserProfile(member.userId);
            if (profile) {
              profiles[member.userId] = profile;
            }
          } catch (error) {
            console.error(
              `Error fetching profile for ${member.userId}:`,
              error,
            );
          }
        }),
      );
      setMemberProfiles(profiles);
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
      alert("Only the owner or admin can delete this community");
      return;
    }

    const confirmed = confirm(
      "Are you sure you want to delete this community? This action cannot be undone. All posts, messages, and media will be permanently deleted.",
    );
    if (!confirmed) return;

    try {
      await deleteCommunity(communityId, currentUser.uid);
      console.log(
        `Community id: ${communityId} deleted successfully. Current user id: ${currentUser.uid}`,
      );
      navigate("/communities");
    } catch (error) {
      console.log(
        `Community id: ${communityId} deleted successfully. Current user id: ${currentUser.uid}`,
      );
      console.error("Error deleting community:", error);
      alert(error.message || "Failed to delete community");
    }
  };

  const handleLeaveCommunity = async () => {
    if (isCreator) {
      alert(
        "Owner cannot leave the community. Transfer ownership or delete the community.",
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

  const handleTransferOwnership = async (userId) => {
    if (!isCreator) return;

    const confirmed = confirm(
      "Are you sure you want to transfer ownership to this admin? You will no longer be the owner of this community.",
    );
    if (!confirmed) return;

    try {
      await transferOwnership(communityId, userId, currentUser.uid);
      await loadData();
      alert("Ownership transferred successfully");
    } catch (error) {
      console.error("Error transferring ownership:", error);
      alert(error.message || "Failed to transfer ownership");
    }
  };

  const handleDemoteAdmin = async (userId) => {
    if (!isCreator) return;

    const confirmed = confirm(
      "Are you sure you want to demote this admin to a regular member?",
    );
    if (!confirmed) return;

    try {
      await demoteAdmin(communityId, userId, currentUser.uid);
      await loadData();
    } catch (error) {
      console.error("Error demoting admin:", error);
      alert(error.message || "Failed to demote admin");
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
              memberProfiles={memberProfiles}
              community={community}
              onRemove={handleRemoveMember}
              onPromote={handlePromoteToAdmin}
              onTransferOwnership={handleTransferOwnership}
              onDemote={handleDemoteAdmin}
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
  memberProfiles,
  community,
  onRemove,
  onPromote,
  onTransferOwnership,
  onDemote,
  currentUserId,
  isCreator,
}) => {
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const filteredMembers = members.filter((member) => {
    const profile = memberProfiles[member.userId];
    const searchLower = search.toLowerCase();
    return (
      member.userId.toLowerCase().includes(searchLower) ||
      profile?.username?.toLowerCase().includes(searchLower) ||
      profile?.displayName?.toLowerCase().includes(searchLower) ||
      profile?.email?.toLowerCase().includes(searchLower)
    );
  });

  // Separate members into owner, admins, and regular members
  const ownerMember = filteredMembers.filter(
    (member) => member.userId === community?.creatorId,
  );
  const adminMembers = filteredMembers.filter(
    (member) =>
      member.role === "admin" && member.userId !== community?.creatorId,
  );
  const regularMembers = filteredMembers.filter(
    (member) =>
      member.role !== "admin" && member.userId !== community?.creatorId,
  );

  const renderMember = (member) => {
    const isCurrentUser = member.userId === currentUserId;
    const isCommunityCreator = member.userId === community?.creatorId;
    const isMemberAdmin = member.role === "admin";
    const profile = memberProfiles[member.userId];

    return (
      <div
        key={member.id}
        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
      >
        <div className="flex items-center space-x-3">
          {profile?.profileImage ? (
            <img
              src={profile.profileImage}
              alt={profile.username || "User"}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium text-lg">
                {profile?.username?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-medium">
                {isCurrentUser
                  ? "You"
                  : profile?.firstName && profile?.lastName
                    ? `${profile.firstName} ${profile.lastName}`
                    : profile?.displayName ||
                      profile?.username ||
                      `User ${member.userId.slice(0, 8)}`}
              </p>
              {isCommunityCreator && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                  Owner
                </span>
              )}
              {isMemberAdmin && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  Admin
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {!isCurrentUser && profile?.username && (
                <p className="truncate max-w-xs">@{profile.username}</p>
              )}
              <p>
                Joined{" "}
                {member.joinedAt?.toDate?.().toLocaleDateString() || "Recently"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {!isCurrentUser && !isCommunityCreator && (
          <div className="relative">
            <button
              onClick={() =>
                setOpenMenuId(openMenuId === member.id ? null : member.id)
              }
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {openMenuId === member.id && (
              <>
                {/* Backdrop to close menu when clicking outside */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setOpenMenuId(null)}
                />

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  {!isMemberAdmin && (
                    <button
                      onClick={() => {
                        onPromote(member.userId);
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Promote to Admin
                    </button>
                  )}
                  {isMemberAdmin && isCreator && (
                    <>
                      <button
                        onClick={() => {
                          onDemote(member.userId);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700"
                      >
                        Demote to Member
                      </button>
                      <button
                        onClick={() => {
                          onTransferOwnership(member.userId);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700"
                      >
                        Transfer Ownership
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      onRemove(member.userId);
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-200"
                  >
                    Remove Member
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 overflow-visible pb-[100px]">
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

      {/* Owner Section */}
      {ownerMember.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Owner</h3>
          <div className="space-y-2 overflow-visible">
            {ownerMember.map(renderMember)}
          </div>
        </div>
      )}

      {/* Admins Section */}
      {adminMembers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Admins ({adminMembers.length})
          </h3>
          <div className="space-y-2 overflow-visible">
            {adminMembers.map(renderMember)}
          </div>
        </div>
      )}

      {/* Regular Members Section */}
      {regularMembers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Members ({regularMembers.length})
          </h3>
          <div className="space-y-2 overflow-visible">
            {regularMembers.map(renderMember)}
          </div>
        </div>
      )}

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No members found</p>
        </div>
      )}
    </div>
  );
};

export default CommunitySettings;
