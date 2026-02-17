import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  updateUserProfile,
  uploadProfileImage,
  uploadCoverImages,
  uploadBannerImage,
  removeCoverImage,
  removeBannerImage,
  addProfileLink,
  removeProfileLink,
  isUsernameAvailable,
} from "../services/profileService";
import {
  XMarkIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import ImageCropper from "./ImageCropper";
import { getCroppedImg } from "../utils/cropImage";

const EditProfile = ({ profile, onSave, onCancel }) => {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    displayName: profile.displayName || "",
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    username: profile.username || "",
    bio: profile.bio || "",
    email: profile.email || currentUser?.email || "",
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(
    profile.profileImage,
  );
  const [bannerImageFile, setBannerImageFile] = useState(null);
  const [bannerImagePreview, setBannerImagePreview] = useState(
    profile.bannerImage,
  );
  const [coverImageFiles, setCoverImageFiles] = useState([]);
  const [coverImagePreviews, setCoverImagePreviews] = useState(
    profile.coverImages || [],
  );
  const [links, setLinks] = useState(profile.links || []);
  const [newLink, setNewLink] = useState({ title: "", url: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usernameError, setUsernameError] = useState(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [cropperImage, setCropperImage] = useState(null);
  const [cropperFile, setCropperFile] = useState(null);
  const [cropperType, setCropperType] = useState(null); // 'banner' or 'cover'

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData({ ...formData, [name]: value });

    // Check username availability
    if (name === "username") {
      checkUsername(value);
    }
  };

  const checkUsername = async (username) => {
    if (!username || username === profile.username) {
      setUsernameError(null);
      return;
    }

    setUsernameChecking(true);
    try {
      const available = await isUsernameAvailable(username, currentUser.uid);
      setUsernameError(available ? null : "Username is already taken");
    } catch (err) {
      console.error("Error checking username:", err);
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      // Show cropper for profile
      setCropperFile(file);
      setCropperImage(URL.createObjectURL(file));
      setCropperType("profile");
    }
  };

  const handleBannerImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    // Show cropper for banner
    setCropperFile(file);
    setCropperImage(URL.createObjectURL(file));
    setCropperType("banner");
  };

  const handleRemoveBannerImage = async () => {
    try {
      // If it's an existing banner image (URL), remove from Firestore
      if (bannerImagePreview && bannerImagePreview.startsWith("http")) {
        await removeBannerImage(currentUser.uid);
      }

      // Clear preview and file
      setBannerImageFile(null);
      setBannerImagePreview(null);
    } catch (err) {
      console.error("Error removing banner image:", err);
      alert("Failed to remove banner image");
    }
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (coverImagePreviews.length >= 5) {
      alert("Maximum 5 cover images allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    // Show cropper for cover
    setCropperFile(file);
    setCropperImage(URL.createObjectURL(file));
    setCropperType("cover");
  };

  const handleCropComplete = async (croppedAreaPixels) => {
    try {
      const croppedBlob = await getCroppedImg(cropperImage, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], cropperFile.name, {
        type: "image/jpeg",
      });

      if (cropperType === "profile") {
        setProfileImageFile(croppedFile);
        setProfileImagePreview(URL.createObjectURL(croppedFile));
      } else if (cropperType === "banner") {
        setBannerImageFile(croppedFile);
        setBannerImagePreview(URL.createObjectURL(croppedFile));
      } else if (cropperType === "cover") {
        setCoverImageFiles([...coverImageFiles, croppedFile]);
        setCoverImagePreviews([
          ...coverImagePreviews,
          URL.createObjectURL(croppedFile),
        ]);
      }

      // Close cropper
      setCropperImage(null);
      setCropperFile(null);
      setCropperType(null);
    } catch (err) {
      console.error("Error cropping image:", err);
      alert("Failed to crop image");
    }
  };

  const handleCropCancel = () => {
    setCropperImage(null);
    setCropperFile(null);
    setCropperType(null);
  };

  const handleRemoveCoverImage = async (index) => {
    const imageUrl = coverImagePreviews[index];

    // Remove from preview
    const newPreviews = coverImagePreviews.filter((_, i) => i !== index);
    setCoverImagePreviews(newPreviews);

    // If it's an existing image (URL), remove from Firestore
    if (imageUrl.startsWith("http")) {
      try {
        await removeCoverImage(currentUser.uid, imageUrl);
      } catch (err) {
        console.error("Error removing cover image:", err);
      }
    } else {
      // If it's a new file, remove from files array
      const newFiles = coverImageFiles.filter((_, i) => i !== index);
      setCoverImageFiles(newFiles);
    }
  };

  const handleAddLink = () => {
    if (newLink.title && newLink.url) {
      if (
        !newLink.url.startsWith("http://") &&
        !newLink.url.startsWith("https://")
      ) {
        alert("URL must start with http:// or https://");
        return;
      }
      setLinks([...links, newLink]);
      setNewLink({ title: "", url: "" });
    }
  };

  const handleRemoveLink = async (index) => {
    const linkToRemove = links[index];
    setLinks(links.filter((_, i) => i !== index));

    // If it's an existing link, remove from Firestore
    if (profile.links?.includes(linkToRemove)) {
      try {
        await removeProfileLink(currentUser.uid, linkToRemove);
      } catch (err) {
        console.error("Error removing link:", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (usernameError) {
      alert("Please fix the username error before saving");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload profile image if changed
      if (profileImageFile) {
        await uploadProfileImage(currentUser.uid, profileImageFile);
      }

      // Upload banner image if changed
      if (bannerImageFile) {
        await uploadBannerImage(currentUser.uid, bannerImageFile);
      }

      // Upload new cover images
      if (coverImageFiles.length > 0) {
        await uploadCoverImages(currentUser.uid, coverImageFiles);
      }

      // Update profile data
      await updateUserProfile(currentUser.uid, {
        displayName: formData.displayName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        bio: formData.bio,
        email: formData.email,
        links: links,
      });

      // Add new links
      const existingLinks = profile.links || [];
      const newLinks = links.filter((link) => !existingLinks.includes(link));
      for (const link of newLinks) {
        await addProfileLink(currentUser.uid, link);
      }

      onSave();
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Image Cropper Modal */}
      {cropperImage && (
        <ImageCropper
          image={cropperImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={
            cropperType === "banner"
              ? 16 / 3
              : cropperType === "profile"
                ? 1
                : 3 / 4
          }
          cropShape={cropperType === "profile" ? "round" : "rect"}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
            <button
              onClick={onCancel}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PhotoIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                  Change Photo
                </label>
              </div>
            </div>

            {/* Banner Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Image
              </label>
              <div className="space-y-4">
                {bannerImagePreview && (
                  <div className="relative group w-full h-48 rounded-lg overflow-hidden bg-gray-200">
                    <img
                      src={bannerImagePreview}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveBannerImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerImageChange}
                    className="hidden"
                  />
                  {bannerImagePreview ? "Change Banner" : "Add Banner"}
                </label>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>

            {/* First Name */}
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="First name"
              />
            </div>

            {/* Last Name */}
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Last name"
              />
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    usernameError ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="username"
                />
                {usernameChecking && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  </div>
                )}
                {!usernameChecking &&
                  formData.username &&
                  formData.username !== profile.username &&
                  !usernameError && (
                    <CheckIcon className="absolute right-3 top-3 h-5 w-5 text-green-600" />
                  )}
              </div>
              {usernameError && (
                <p className="text-red-500 text-sm mt-1">{usernameError}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@example.com"
              />
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Tell us about yourself..."
                maxLength={150}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.bio.length}/150 characters
              </p>
            </div>

            {/* Cover Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Images (Max 5)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {coverImagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <div className="rounded-lg overflow-hidden bg-gray-200 aspect-[3/4]">
                      <img
                        src={preview}
                        alt={`Cover ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCoverImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              {coverImagePreviews.length < 5 && (
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                    className="hidden"
                  />
                  <PlusIcon className="h-5 w-5" />
                  <span>Add Cover Image</span>
                </label>
              )}
            </div>

            {/* Links */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Links
              </label>
              <div className="space-y-2 mb-4">
                {links.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900">{link.title}</p>
                      <p className="text-sm text-gray-600 truncate">
                        {link.url}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Link */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={newLink.title}
                  onChange={(e) =>
                    setNewLink({ ...newLink, title: e.target.value })
                  }
                  placeholder="Link title (e.g., Website, Instagram)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newLink.url}
                    onChange={(e) =>
                      setNewLink({ ...newLink, url: e.target.value })
                    }
                    placeholder="https://example.com"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || usernameError}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditProfile;
