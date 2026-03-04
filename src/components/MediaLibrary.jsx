import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getCommunityMedia,
  uploadCommunityMedia,
  deleteCommunityMedia,
} from "../services/communityMediaService";
import { COLORS } from "../theme/colors";

const MediaLibrary = ({ communityId, userRole }) => {
  const { currentUser } = useAuth();
  const [media, setMedia] = useState([]);
  const [filter, setFilter] = useState("all"); // all, photos, videos
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    loadMedia();
  }, [communityId]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const data = await getCommunityMedia(communityId);
      setMedia(data);
    } catch (error) {
      console.error("Error loading media:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        await uploadCommunityMedia(communityId, currentUser.uid, file);
      }
      loadMedia();
    } catch (error) {
      console.error("Error uploading media:", error);
      alert("Failed to upload media");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId) => {
    if (!confirm("Are you sure you want to delete this media?")) return;

    try {
      await deleteCommunityMedia(communityId, mediaId, currentUser.uid);
      loadMedia();
    } catch (error) {
      console.error("Error deleting media:", error);
      alert("Failed to delete media");
    }
  };

  const filteredMedia = media.filter((item) => {
    if (filter === "all") return true;
    if (filter === "photos") return item.type === "image";
    if (filter === "videos") return item.type === "video";
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter("all")}
              style={{
                backgroundColor:
                  filter === "all" ? COLORS.Dark_Gray : COLORS.Beige,
                color: filter === "all" ? COLORS.Beige : COLORS.Dark_Gray,
              }}
              className="px-4 py-2 rounded-lg font-medium"
            >
              All Media
            </button>
            <button
              onClick={() => setFilter("photos")}
              style={{
                backgroundColor:
                  filter === "photos" ? COLORS.Dark_Gray : COLORS.Beige,
                color: filter === "photos" ? COLORS.Beige : COLORS.Dark_Gray,
              }}
              className="px-4 py-2 rounded-lg font-medium"
            >
              Photos
            </button>
            <button
              onClick={() => setFilter("videos")}
              style={{
                backgroundColor:
                  filter === "videos" ? COLORS.Dark_Gray : COLORS.Beige,
                color: filter === "videos" ? COLORS.Beige : COLORS.Dark_Gray,
              }}
              className="px-4 py-2 rounded-lg font-medium"
            >
              Videos
            </button>
          </div>

          <label
            style={{ backgroundColor: COLORS.Dark_Gray, color: COLORS.Beige }}
            className="cursor-pointer px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            {uploading ? (
              <>
                <div
                  className="animate-spin rounded-full h-5 w-5 border-b-2"
                  style={{ borderColor: COLORS.Beige }}
                ></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span>Upload</span>
              </>
            )}
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {filteredMedia.length} {filter === "all" ? "items" : filter}
        </div>
      </div>

      {/* Media Grid */}
      {filteredMedia.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            No media yet
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upload photos and videos to share with the community
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
            <MediaItem
              key={item.id}
              item={item}
              onDelete={handleDelete}
              onClick={() => setSelectedMedia(item)}
              canDelete={
                item.userId === currentUser.uid || userRole === "admin"
              }
            />
          ))}
        </div>
      )}

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <MediaViewer
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onDelete={handleDelete}
          canDelete={
            selectedMedia.userId === currentUser.uid || userRole === "admin"
          }
        />
      )}
    </div>
  );
};

// Media Item Component
const MediaItem = ({ item, onDelete, onClick, canDelete }) => {
  return (
    <div className="relative group aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer">
      {item.type === "image" ? (
        <img
          src={item.url}
          alt="Media"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          onClick={onClick}
        />
      ) : (
        <div className="relative w-full h-full" onClick={onClick}>
          <video src={item.url} className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <svg
              className="w-12 h-12 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
        </div>
      )}

      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-white truncate">
          {item.createdAt?.toDate?.().toLocaleDateString() || ""}
        </p>
      </div>
    </div>
  );
};

// Media Viewer Modal
const MediaViewer = ({ media, onClose, onDelete, canDelete }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-5xl w-full max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 z-10"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Delete Button */}
        {canDelete && (
          <button
            onClick={() => {
              onDelete(media.id);
              onClose();
            }}
            className="absolute top-4 left-4 text-white bg-red-500 bg-opacity-80 rounded-full px-4 py-2 hover:bg-opacity-100 z-10 flex items-center space-x-2"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Delete</span>
          </button>
        )}

        {/* Media Content */}
        <div className="flex items-center justify-center h-full">
          {media.type === "image" ? (
            <img
              src={media.url}
              alt="Media"
              className="max-w-full max-h-[80vh] object-contain"
            />
          ) : (
            <video
              src={media.url}
              controls
              className="max-w-full max-h-[80vh]"
              autoPlay
            />
          )}
        </div>

        {/* Media Info */}
        <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-4 rounded-lg">
          <p className="text-sm">
            Uploaded {media.createdAt?.toDate?.().toLocaleDateString() || ""}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MediaLibrary;
