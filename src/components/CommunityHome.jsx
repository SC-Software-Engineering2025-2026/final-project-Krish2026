import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getCommunity,
  updateHomePageContent,
} from "../services/communityService";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const CommunityHome = ({ communityId, userRole }) => {
  const { currentUser } = useAuth();
  const [community, setCommunity] = useState(null);
  const [content, setContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const quillRef = useRef(null);

  const isAdmin = userRole === "admin";

  useEffect(() => {
    loadCommunity();
  }, [communityId]);

  const loadCommunity = async () => {
    try {
      setLoading(true);
      const data = await getCommunity(communityId);
      setCommunity(data);
      setContent(data.homePageContent || "");
    } catch (error) {
      console.error("Error loading community:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateHomePageContent(communityId, content);
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
    setContent(community?.homePageContent || "");
    setIsEditing(false);
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ["link", "image", "video"],
      ["clean"],
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
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
              <h1 className="text-3xl font-bold text-gray-900">
                {community?.name}
              </h1>
              <p className="text-gray-600 mt-1">{community?.description}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>{community?.memberCount} members</span>
                <span>•</span>
                <span>{community?.isPublic ? "Public" : "Private"}</span>
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

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow p-6">
        {isEditing ? (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Edit Home Page</h2>
              <p className="text-sm text-gray-600">
                Use the editor below to customize your community's home page
              </p>
            </div>

            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              className="bg-white"
              style={{ minHeight: "300px" }}
            />

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
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            {content ? (
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No content yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {isAdmin
                    ? "Click 'Edit Page' to add content to your community home page"
                    : "The community admins haven't added any content yet"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityHome;
