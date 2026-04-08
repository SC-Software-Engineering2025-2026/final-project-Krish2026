import { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../services/firebase";
import {
  getMentionSuggestions,
  replaceMention,
  filterUsersForMention,
} from "../utils/mentionUtils";

// FILE LEVEL LOGGING - Should show immediately on import
console.error("🔴 UserTagger.jsx FILE LOADED");

const UserTagger = ({
  value,
  onChange,
  placeholder = "Write something... (use @ to mention users)",
  disabled = false,
  onBlur = null,
}) => {
  // Component function execution logging
  console.error("🔴 UserTagger COMPONENT FUNCTION CALLED - rendering");

  // Immediate logging to verify component is mounting
  if (typeof window !== "undefined") {
    if (!window.__userTaggerDebug) {
      window.__userTaggerDebug = true;
      console.error(
        "🚀 [UserTagger] COMPONENT FIRST RENDER - STATE INITIALIZED",
      );
    }
  }

  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Fetch users based on mention query
  useEffect(() => {
    console.error(
      "🔵 [UserTagger] MENTION EFFECT TRIGGERED - value changed to:",
      value,
    );

    const handleMentionQuery = async () => {
      try {
        if (!textareaRef.current) {
          console.error("[UserTagger] ❌ Textarea ref not available");
          return;
        }

        const cursorPosition = textareaRef.current.selectionStart;
        console.error(
          `🟡 [UserTagger] Textarea value: "${value}", Cursor: ${cursorPosition}`,
        );

        // Call getMentionSuggestions and get results
        const result = getMentionSuggestions(value, cursorPosition);
        console.error(
          "🟢 [UserTagger] getMentionSuggestions returned:",
          result,
        );

        const { query: mentionQuery, hasAtSymbol } = result;

        console.error(
          `🟠 [UserTagger] Mention detection - hasAtSymbol: ${hasAtSymbol}, query: "${mentionQuery}"`,
        );

        if (!hasAtSymbol) {
          console.error("[UserTagger] No valid @ mention detected, clearing");
          setShowSuggestions(false);
          setSuggestions([]);
          setSelectedIndex(-1);
          setCurrentQuery("");
          return;
        }

        // Show suggestions when @ is typed, even if no characters follow yet
        setLoading(true);
        setCurrentQuery(mentionQuery);

        console.error(
          "[UserTagger] ✅ Valid @ detected - Fetching users from Firebase...",
        );

        try {
          // Search for users by username or display name
          const usersRef = collection(db, "users");
          const q = query(usersRef, limit(50)); // Increased limit to get more users
          const snapshot = await getDocs(q);

          console.error(
            `[UserTagger] Found ${snapshot.docs.length} users in database`,
          );

          const allUsers = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              if (!data.username) {
                console.error(
                  "[UserTagger] User has no username, skipping:",
                  doc.id,
                );
                return null;
              }
              console.error(
                `[UserTagger] Processing user: ${data.username} (${data.displayName})`,
              );
              return {
                id: doc.id,
                username: data.username || "",
                displayName: data.displayName || "",
                profilePhotoURL: data.profilePhotoURL || null,
              };
            })
            .filter((user) => user !== null);

          console.error(
            `[UserTagger] After filtering nulls: ${allUsers.length} users`,
          );

          // Filter by mention query (works even if empty)
          const filtered = filterUsersForMention(allUsers, mentionQuery);
          console.error(
            `[UserTagger] After query filter: ${filtered.length} users matching "${mentionQuery}"`,
          );

          setSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
          setSelectedIndex(-1);
        } catch (dbError) {
          console.error("[UserTagger] 💥 Database error:", dbError);
          setSuggestions([]);
          setShowSuggestions(false);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error("[UserTagger] 💥 Error in handleMentionQuery:", error);
        console.error("[UserTagger] Error details:", error.message, error.code);
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedIndex(-1);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(handleMentionQuery, 100);
    return () => clearTimeout(timer);
  }, [value]);

  const handleSelectMention = (user) => {
    if (!textareaRef.current) return;

    const cursorPosition = textareaRef.current.selectionStart;
    const { newText, newCursorPosition } = replaceMention(
      value,
      cursorPosition,
      user.username,
    );

    // Update parent with new text
    onChange({ target: { value: newText } });

    // Reset suggestions immediately
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);

    // Use a callback to ensure cursor is set after the DOM updates
    // We use a longer timeout to account for React's rendering
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Set cursor position after focus
        textareaRef.current.selectionStart = newCursorPosition;
        textareaRef.current.selectionEnd = newCursorPosition;
        console.log(
          `[UserTagger] Cursor set to: ${newCursorPosition}, Text: "${newText}"`,
        );
      }
    }, 50);
  };

  const handleKeyDown = (e) => {
    // If suggestions are not visible, let normal textarea behavior happen
    if (!showSuggestions || suggestions.length === 0) {
      // But still allow Escape to close any open suggestion
      if (e.key === "Escape") {
        setShowSuggestions(false);
        setSuggestions([]);
        setSelectedIndex(-1);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectMention(suggestions[selectedIndex]);
        }
        break;
      case "Tab":
        // Tab should select the current suggestion if one is selected
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSelectMention(suggestions[selectedIndex]);
        } else if (suggestions.length > 0) {
          // If no selection, select first one and continue
          e.preventDefault();
          setSelectedIndex(0);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        setSuggestions([]);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Wrapper for onChange to add logging
  const handleTextAreaChange = (e) => {
    const newValue = e.target.value;
    console.error(
      `🟣 [UserTagger] TEXTAREA ONCHANGE FIRED - New value: "${newValue}", length: ${newValue.length}`,
    );
    onChange(e);
  };

  // Auto-scroll suggestions dropdown
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (textareaRef.current && !textareaRef.current.contains(event.target)) {
        if (
          suggestionsRef.current &&
          !suggestionsRef.current.contains(event.target)
        ) {
          setShowSuggestions(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextAreaChange}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
        rows="4"
      />

      {/* Debug info - showing current state */}
      {value.includes("@") && process.env.NODE_ENV === "development" && (
        <div className="absolute top-0 right-0 mt-0 text-xs text-gray-500 dark:text-gray-400 pointer-events-none z-10">
          <span className="bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded text-xs">
            @detected | {suggestions.length} users | {String(loading)}
          </span>
        </div>
      )}

      {/* Mention Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {suggestions.map((user, index) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelectMention(user)}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left transition ${
                index === selectedIndex
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              {/* User Avatar */}
              <div className="flex-shrink-0">
                {user.profilePhotoURL ? (
                  <img
                    src={user.profilePhotoURL}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {user.displayName || user.username}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  @{user.username}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {showSuggestions === false &&
        !loading &&
        currentQuery.length > 0 &&
        value.includes("@") && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 px-4 py-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              No users found matching "{currentQuery}"
            </span>
          </div>
        )}

      {/* Loading State */}
      {loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="animate-pulse h-2 w-2 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Finding users...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTagger;
