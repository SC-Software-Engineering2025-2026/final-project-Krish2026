import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getCommunity,
  updateHomePageSections,
} from "../services/communityService";
import ImageCropper from "./ImageCropper";
import { getCroppedImg } from "../utils/cropImage";

const MAX_WELCOME_IMAGES = 6;

const InfoCommunityHome = ({
  communityId,
  userRole,
  isMember = true,
  onJoin,
  joining = false,
}) => {
  const { currentUser } = useAuth();
  const [community, setCommunity] = useState(null);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [bio, setBio] = useState("");
  const [images, setImages] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cropperImage, setCropperImage] = useState(null);
  const [cropperFile, setCropperFile] = useState(null);
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);

  const isAdmin = userRole === "admin";

  useEffect(() => {
    loadCommunity();
  }, [communityId]);

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
        <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Join {community?.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Become a member to access posts and communicate with admins
          </p>
          <button
            onClick={onJoin}
            disabled={joining}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {joining ? "Joining..." : "Join Community"}
          </button>
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
                <span>{community?.memberCount} members</span>
                <span>•</span>
                <span>{community?.isPublic ? "Public" : "Private"}</span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Informational</span>
                </span>
              </div>
            </div>
          </div>

          {isAdmin && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
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
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-200">
                Informational Community
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                This is an informational community. Only admins can edit this
                page and create posts. You can view content and comment on
                posts.
              </p>
            </div>
          </div>
        </div>
      )}

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
