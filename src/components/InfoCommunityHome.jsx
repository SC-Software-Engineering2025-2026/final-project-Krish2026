import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getCommunity,
  updateHomePageSections,
  leaveCommunity,
  sendJoinRequest,
  hasPendingJoinRequest,
  cancelJoinRequest,
} from "../services/communityService";
import ImageCropper from "./ImageCropper";
import { getCroppedImg } from "../utils/cropImage";
import COLORS from "../theme/colors";

const MAX_WELCOME_IMAGES = 6;

const InfoCommunityHome = ({
  communityId,
  userRole,
  isMember = true,
  isBanned = false,
  isPrivate = false,
  onJoin,
  joining = false,
  onRequestAccess,
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [bio, setBio] = useState("");
  const [images, setImages] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cropperImage, setCropperImage] = useState(null);
  const [cropperFile, setCropperFile] = useState(null);
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [cancelingRequest, setCancelingRequest] = useState(false);
  const dropdownRef = useRef(null);

  const isAdmin = userRole === "admin";

  useEffect(() => {
    loadCommunity();
  }, [communityId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check for pending join request when not a member and community is private
  useEffect(() => {
    const checkPendingRequest = async () => {
      if (!isMember && isPrivate && currentUser?.uid) {
        try {
          const has = await hasPendingJoinRequest(communityId, currentUser.uid);
          setHasPendingRequest(has);
        } catch (error) {
          console.error("Error checking request status:", error);
        }
      }
    };

    checkPendingRequest();
  }, [isMember, isPrivate, communityId, currentUser?.uid]);

  const loadCommunity = async () => {
    try {
      setLoading(true);
      const data = await getCommunity(communityId);
      setCommunity(data);

      const defaultWelcomeMessage = `Welcome to ${data.name || "this community"}`;
      const sections = data.homePageSections || {};

      setWelcomeMessage(sections.welcomeMessage || defaultWelcomeMessage);
      setBio(sections.bio || "");
      setImages(
        (sections.imageUrls || []).map((url) => ({ url, isNew: false })),
      );
    } catch (error) {
      console.error("Error loading community:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await updateHomePageSections(communityId, {
        welcomeMessage:
          welcomeMessage?.trim() ||
          `Welcome to ${community?.name || "this community"}`,
        bio,
        orderedImages: images,
      });

      setIsEditing(false);
      await loadCommunity();
    } catch (error) {
      console.error("Error saving content:", error);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const defaultWelcomeMessage = `Welcome to ${community?.name || "this community"}`;
    const sections = community?.homePageSections || {};

    setWelcomeMessage(sections.welcomeMessage || defaultWelcomeMessage);
    setBio(sections.bio || "");
    setImages((sections.imageUrls || []).map((url) => ({ url, isNew: false })));
    setIsEditing(false);
  };

  const handleRequestAccess = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      setRequestingAccess(true);
      await onRequestAccess();
      setHasPendingRequest(true);
    } catch (error) {
      console.error("Error requesting access:", error);
      alert(error.message || "Failed to send request");
    } finally {
      setRequestingAccess(false);
    }
  };

  const handleCancelRequest = async () => {
    try {
      setCancelingRequest(true);
      await cancelJoinRequest(communityId, currentUser.uid);
      setHasPendingRequest(false);
    } catch (error) {
      console.error("Error canceling join request:", error);
      alert(error.message || "Failed to cancel request");
    } finally {
      setCancelingRequest(false);
    }
  };

  const handleAddImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    if (images.length >= MAX_WELCOME_IMAGES) {
      alert(`You can add up to ${MAX_WELCOME_IMAGES} images`);
      return;
    }

    setCropperFile(file);
    setCropperImage(URL.createObjectURL(file));
  };

  const handleCropComplete = async (croppedAreaPixels) => {
    try {
      const croppedBlob = await getCroppedImg(cropperImage, croppedAreaPixels);
      const fileName = cropperFile?.name || `welcome-image-${Date.now()}.jpg`;
      const croppedFile = new File([croppedBlob], fileName, {
        type: "image/jpeg",
      });

      setImages((prev) => [
        ...prev,
        {
          url: URL.createObjectURL(croppedFile),
          isNew: true,
          file: croppedFile,
        },
      ]);

      setCropperImage(null);
      setCropperFile(null);
    } catch (error) {
      console.error("Error cropping image:", error);
      alert("Failed to crop image");
    }
  };

  const handleCropCancel = () => {
    setCropperImage(null);
    setCropperFile(null);
  };

  const removeImageAtIndex = (index) => {
    setImages((prev) => prev.filter((_, imageIndex) => imageIndex !== index));
  };

  const handleImageDragStart = (index) => {
    setDraggedImageIndex(index);
  };

  const handleImageDrop = (dropIndex) => {
    if (draggedImageIndex === null || draggedImageIndex === dropIndex) return;

    setImages((prev) => {
      const reordered = [...prev];
      const [draggedItem] = reordered.splice(draggedImageIndex, 1);
      reordered.splice(dropIndex, 0, draggedItem);
      return reordered;
    });

    setDraggedImageIndex(null);
  };

  const handleImageDragEnd = () => {
    setDraggedImageIndex(null);
  };

  const handleLeaveCommunity = async () => {
    // Check if user is the creator
    if (community?.createdBy === currentUser.uid) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {!isMember && (
        <div
          className={`border-2 rounded-lg p-6 mb-6 text-center ${
            isBanned
              ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700"
              : "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700"
          }`}
        >
          {isBanned ? (
            <>
              <h2 className="text-2xl font-bold text-red-900 dark:text-red-200 mb-2">
                Banned from Community
              </h2>
              <p className="text-red-800 dark:text-red-300">
                You are banned from {community?.name} and cannot join this
                community.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isPrivate ? "Request Access" : "Join"} {community?.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {isPrivate
                  ? "This is a private community. Send a request to the admins for access."
                  : "Become a member to access posts and communicate with admins"}
              </p>
              {hasPendingRequest ? (
                <div className="flex items-center justify-between px-8 py-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700">
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Your request is pending admin approval
                  </p>
                  <button
                    onClick={handleCancelRequest}
                    disabled={cancelingRequest}
                    className="ml-4 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-red-600 dark:text-red-400 font-bold text-xl"
                    title="Cancel join request"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={isPrivate ? handleRequestAccess : onJoin}
                  disabled={joining || requestingAccess}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {isPrivate
                    ? requestingAccess
                      ? "Sending Request..."
                      : "Request Access"
                    : joining
                      ? "Joining..."
                      : "Join Community"}
                </button>
              )}
            </>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {community?.imageUrl && (
              <img
                src={community.imageUrl}
                alt={community.name}
                className="w-20 h-20 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {community?.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {community?.description}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>
                  {
                    new Set([
                      ...(community?.members || []),
                      ...(community?.admins || []),
                    ]).size
                  }{" "}
                  members
                </span>
                <span>•</span>
                <span>{community?.isPublic ? "Public" : "Private"}</span>
                {community?.categories?.some((cat) => cat) && (
                  <span className="flex flex-wrap gap-2">
                    {community.categories
                      .slice(0, 3)
                      .filter((cat) => cat)
                      .map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 bg-gray-800 dark:bg-beige-700 text-gray-100 dark:text-beige-100 text-xs font-medium rounded-full border border-gray-900 dark:border-beige-800"
                        >
                          {cat}
                        </span>
                      ))}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isAdmin && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-lg flex items-center space-x-2"
                style={{
                  backgroundColor: COLORS.Dark_Gray,
                  color: COLORS.Beige,
                }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>Edit Page</span>
              </button>
            )}

            {/* Three-dot menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <svg
                  className="w-6 h-6 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      handleLeaveCommunity();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Leave Community</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {isEditing ? (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Edit Home Page
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update the welcome message, bio, and images for this page
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Welcome Message
                </label>
                <input
                  type="text"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder={`Welcome to ${community?.name || "this community"}`}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={6}
                  placeholder="Add a short bio for your community"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    Images ({images.length}/{MAX_WELCOME_IMAGES})
                  </label>
                  <label className="px-4 py-2 rounded-lg cursor-pointer text-sm bg-blue-600 text-white hover:bg-blue-700">
                    Add Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAddImage}
                    />
                  </label>
                </div>

                {images.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {images.map((image, index) => (
                      <div
                        key={`${image.url}-${index}`}
                        className="relative"
                        draggable
                        onDragStart={() => handleImageDragStart(index)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handleImageDrop(index)}
                        onDragEnd={handleImageDragEnd}
                      >
                        <img
                          src={image.url}
                          alt={`Welcome image ${index + 1}`}
                          className="w-full h-44 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                        <span className="absolute top-2 left-2 px-2 py-1 rounded-md text-xs bg-black/60 text-white">
                          Drag
                        </span>
                        <button
                          type="button"
                          onClick={() => removeImageAtIndex(index)}
                          className="absolute top-2 right-2 px-2 py-1 rounded-md text-xs bg-red-600 text-white"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No images added yet.
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            {welcomeMessage || bio || images.length > 0 ? (
              <div className="space-y-6 community-home-content">
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white break-words">
                    {welcomeMessage ||
                      `Welcome to ${community?.name || "this community"}`}
                  </h2>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Bio
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                    {bio || "No bio added yet."}
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Images
                  </h3>
                  {images.length > 0 ? (
                    <div className="columns-1 sm:columns-2 gap-4">
                      {images.map((image, index) => (
                        <div
                          key={`${image.url}-${index}`}
                          className="mb-4 break-inside-avoid"
                        >
                          <img
                            src={image.url}
                            alt={`Community image ${index + 1}`}
                            className="w-full h-auto rounded-lg"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No images added yet.
                    </p>
                  )}
                </section>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                  No content yet
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {isAdmin
                    ? "Click 'Edit Page' to add content to your community home page"
                    : "The community admins haven't added any content yet"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {cropperImage && (
        <ImageCropper
          image={cropperImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={4 / 3}
          allowRatioChange={true}
        />
      )}
    </div>
  );
};

export default InfoCommunityHome;
