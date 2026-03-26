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
  banUserFromCommunity,
} from "../services/communityService";
import { getUserProfile } from "../services/profileService";
import { PhotoIcon, PencilIcon } from "@heroicons/react/24/outline";
import ImageCropper from "./ImageCropper";
import { getCroppedImg } from "../utils/cropImage";
import { COLORS } from "../theme/colors";

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

  const handleUpdateCommunity = async (updates, imageFile = null) => {
    if (!isAdmin) return;

    setSaving(true);
    try {
      await updateCommunity(communityId, updates, imageFile);
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

  const handleBanUser = async (userId) => {
    if (!isAdmin) return;

    const confirmed = confirm(
      "Are you sure you want to ban this user? They will not be able to rejoin this community.",
    );
    if (!confirmed) return;

    try {
      await banUserFromCommunity(communityId, userId, currentUser.uid);
      await loadData();
      alert("User has been banned from the community");
    } catch (error) {
      console.error("Error banning user:", error);
      alert(error.message || "Failed to ban user");
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">
            Community Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-700">
          <h2 className="text-2xl font-bold dark:text-white">
            Community Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your community settings and members
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("general")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "general"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "members"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
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
              onBan={handleBanUser}
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
    categories: community?.categories?.length
      ? community.categories.slice(0, 3)
      : [""],
    chatEnabled: community?.chatEnabled !== false,
    mediaEnabled: community?.mediaEnabled !== false,
  });

  // Comprehensive category list
  const CATEGORY_OPTIONS = [
    "Sports",
    "Discussion",
    "School",
    "Theater",
    "Fashion",
    "Design",
    "Gaming",
    "Music",
    "Networking",
    "Scientific interests",
    "Math",
    "Computer Science",
    "Economics",
    "Educational",
    "Creative",
    "Influencer",
    "Emotions",
    "Animals",
    "Marine life",
    "Beach",
    "Travel",
    "City life",
    "Nature",
    "Environmentalists",
    "Photography",
    "Videography",
    "Filmmaking",
    "Films",
    "TV Shows",
    "Cars",
    "Racing",
    "Show Cars",
    // Additional categories
    "Technology",
    "Art",
    "Books",
    "Writing",
    "Fitness",
    "Health",
    "Food",
    "Cooking",
    "Politics",
    "History",
    "Parenting",
    "Relationships",
    "Science",
    "Space",
    "DIY",
    "Crafts",
    "Finance",
    "Investing",
    "Startups",
    "Entrepreneurship",
    "Memes",
    "Podcasts",
    "Board Games",
    "Card Games",
    "Outdoors",
    "Hiking",
    "Camping",
    "Wellness",
    "Mindfulness",
    "Language Learning",
    "News",
    "Events",
  ];
  // Handle dropdown change for a specific slot
  const handleCategoryDropdownChange = (idx, value) => {
    setFormData((prev) => {
      const updated = [...prev.categories];
      updated[idx] = value;
      // If last slot and not empty, add another slot (up to 3)
      if (idx === updated.length - 1 && value && updated.length < 3) {
        updated.push("");
      }
      // Remove empty slots after the last filled one
      while (
        updated.length > 1 &&
        updated[updated.length - 1] === "" &&
        updated[updated.length - 2] === ""
      ) {
        updated.pop();
      }
      // Remove duplicates
      const deduped = updated.filter(
        (cat, i) => cat === "" || updated.indexOf(cat) === i,
      );
      return { ...prev, categories: deduped };
    });
  };
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(community?.imageUrl || null);
  const [imageToCrop, setImageToCrop] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      // Show cropper
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditCurrentImage = () => {
    if (imagePreview) {
      // Open cropper with current image
      setImageToCrop(imagePreview);
    }
  };

  const handleCropComplete = async (croppedAreaPixels) => {
    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);

      // Convert blob to file
      const file = new File([croppedImage], "community-image.jpg", {
        type: "image/jpeg",
      });

      setImageFile(file);
      setImagePreview(URL.createObjectURL(croppedImage));
      setImageToCrop(null);
    } catch (error) {
      console.error("Error cropping image:", error);
      alert("Failed to crop image");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData, imageFile);
  };

  return (
    <>
      {/* Image Cropper Modal */}
      {imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => setImageToCrop(null)}
          aspect={1}
          lockAspectRatio={true}
        />
      )}

      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Community Picture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Community Picture
            </label>
            <div className="flex items-center gap-4">
              <div className="relative group w-24 h-24 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 cursor-pointer">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Community"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PhotoIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
                {imagePreview ? (
                  <button
                    type="button"
                    onClick={handleEditCurrentImage}
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <PencilIcon className="h-8 w-8 text-white" />
                    </div>
                  </button>
                ) : (
                  <label className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <PencilIcon className="h-8 w-8 text-white" />
                    </div>
                  </label>
                )}
              </div>
              <label
                className="cursor-pointer px-4 py-2 rounded-lg transition"
                style={{
                  backgroundColor: COLORS.Dark_Gray,
                  color: COLORS.Beige,
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imagePreview ? "Change Picture" : "Add Picture"}
              </label>
            </div>
          </div>

          {/* Community Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Community Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              required
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-700 dark:text-white"
              rows={4}
              maxLength={500}
            />
          </div>

          {/* Categories Section (Dropdowns) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categories{" "}
              <span className="text-xs text-gray-500">(Choose up to 3)</span>
            </label>
            <div className="flex flex-col gap-2">
              {formData.categories.map((selected, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={selected}
                    onChange={(e) =>
                      handleCategoryDropdownChange(idx, e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={saving}
                  >
                    <option value="">Select category...</option>
                    {CATEGORY_OPTIONS.filter(
                      (cat) =>
                        !formData.categories.includes(cat) || cat === selected,
                    ).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {selected && (
                    <button
                      type="button"
                      aria-label="Remove category"
                      className="ml-1 px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-200 dark:hover:bg-red-700 hover:text-red-700 dark:hover:text-red-400 transition"
                      onClick={() => handleCategoryDropdownChange(idx, "")}
                      disabled={saving}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.categories.filter((c) => c).length} selected
            </p>
          </div>

          {/* Privacy Setting */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Public Community
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
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

          {/* Feature Toggles (for collaborative communities only) */}
          {community?.isCollaborative && (
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-gray-900 dark:text-white">
                Feature Toggles
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Control which features are available to community members
              </p>

              {/* Chat Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Chat Tab
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formData.chatEnabled
                      ? "Members can use the chat feature"
                      : "Chat feature is disabled"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      chatEnabled: !formData.chatEnabled,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.chatEnabled ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  disabled={saving}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.chatEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Media Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Media Tab
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formData.mediaEnabled
                      ? "Members can share and view media"
                      : "Media feature is disabled"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      mediaEnabled: !formData.mediaEnabled,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.mediaEnabled ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  disabled={saving}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.mediaEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Community Type (Read-only) */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Community Type
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {community?.isCollaborative ? "Collaborative" : "Informational"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Community type cannot be changed after creation
            </p>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-2 rounded-lg disabled:bg-gray-300"
            style={{ backgroundColor: COLORS.Dark_Gray, color: COLORS.Beige }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {/* Danger Zone */}
        {canDelete && (
          <div className="pt-6 border-t dark:border-gray-700">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
              Danger Zone
            </h3>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-medium text-red-900 dark:text-red-400">
                Delete Community
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1 mb-4">
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
    </>
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
  onBan,
  currentUserId,
  isCreator,
}) => {
  const navigate = useNavigate();
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
        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
      >
        <div
          className="flex items-center space-x-3 flex-1 cursor-pointer"
          onClick={() => navigate(`/profile/${member.userId}`)}
        >
          {profile?.profileImage ? (
            <img
              src={profile.profileImage}
              alt={profile.username || "User"}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                {profile?.username?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <p className="font-medium dark:text-white">
                {isCurrentUser
                  ? "You"
                  : profile?.firstName && profile?.lastName
                    ? `${profile.firstName} ${profile.lastName}`
                    : profile?.displayName ||
                      profile?.username ||
                      `User ${member.userId.slice(0, 8)}`}
              </p>
              {isCommunityCreator && (
                <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium rounded">
                  Owner
                </span>
              )}
              {isMemberAdmin && (
                <span
                  className="px-2 py-0.5 text-xs font-medium rounded"
                  style={{
                    backgroundColor: COLORS.Dark_Gray,
                    color: COLORS.Beige,
                  }}
                >
                  Admin
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
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
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === member.id ? null : member.id);
              }}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-300"
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
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                  {!isMemberAdmin && (
                    <button
                      onClick={() => {
                        onPromote(member.userId);
                        setOpenMenuId(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400"
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
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-700 dark:hover:text-orange-400"
                      >
                        Demote to Member
                      </button>
                      <button
                        onClick={() => {
                          onTransferOwnership(member.userId);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 hover:text-yellow-700 dark:hover:text-yellow-400"
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
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 border-t border-gray-200 dark:border-gray-700"
                  >
                    Remove Member
                  </button>
                  <button
                    onClick={() => {
                      onBan(member.userId);
                      setOpenMenuId(null);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 bg-red-50 dark:bg-red-900/20"
                  >
                    Ban User
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
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      {/* Owner Section */}
      {ownerMember.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Owner
          </h3>
          <div className="space-y-2 overflow-visible">
            {ownerMember.map(renderMember)}
          </div>
        </div>
      )}

      {/* Admins Section */}
      {adminMembers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Members ({regularMembers.length})
          </h3>
          <div className="space-y-2 overflow-visible">
            {regularMembers.map(renderMember)}
          </div>
        </div>
      )}

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No members found</p>
        </div>
      )}
    </div>
  );
};

export default CommunitySettings;
