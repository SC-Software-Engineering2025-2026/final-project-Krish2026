/**
 * Utility functions for handling user mentions (@username)
 */

/**
 * Extract all mentions from text
 * @param {string} text - The text to extract mentions from
 * @returns {string[]} Array of usernames (without @)
 */
export const extractMentions = (text) => {
  if (!text) return [];
  const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
  const matches = text.match(mentionRegex);
  return matches ? matches.map((mention) => mention.substring(1)) : [];
};

/**
 * Get unique mentioned usernames
 * @param {string} text - The text to extract mentions from
 * @returns {string[]} Array of unique usernames (without @)
 */
export const getUniqueMentionedUsernames = (text) => {
  const mentions = extractMentions(text);
  return [...new Set(mentions)];
};

/**
 * Get mention suggestions at cursor position
 * @param {string} text - Full text content
 * @param {number} cursorPosition - Current cursor position
 * @returns {object} { query: string, hasAtSymbol: boolean }
 */
export const getMentionSuggestions = (text, cursorPosition) => {
  console.error(
    `[getMentionSuggestions] ⭐ START - text="${text}", cursor=${cursorPosition}`,
  );

  if (!text || cursorPosition < 0) {
    console.error(
      "[getMentionSuggestions] ❌ Invalid input - no text or negative cursor",
    );
    return { query: "", hasAtSymbol: false };
  }

  const textBeforeCursor = text.substring(0, cursorPosition);
  const lastAtIndex = textBeforeCursor.lastIndexOf("@");

  console.error(
    `[getMentionSuggestions] textBeforeCursor="${textBeforeCursor}" | lastAtIndex=${lastAtIndex}`,
  );

  if (lastAtIndex === -1) {
    console.error("[getMentionSuggestions] ❌ No @ found in text");
    return { query: "", hasAtSymbol: false };
  }

  // Get text from @ to cursor
  const between = textBeforeCursor.substring(lastAtIndex + 1);
  console.error(
    `[getMentionSuggestions] between @ and cursor: "${between}" (length: ${between.length})`,
  );

  // Check if there's ANY whitespace between @ and cursor
  // If there is, the user has moved on from typing a mention
  if (/\s/.test(between)) {
    console.error(
      "[getMentionSuggestions] ❌ Found whitespace between @ and cursor - mention complete",
    );
    return { query: "", hasAtSymbol: false };
  }

  // Valid mention - @ is found and no whitespace between @ and cursor
  const query = between.toLowerCase();
  console.error(
    `[getMentionSuggestions] ✅ VALID mention detected - query="${query}"`,
  );
  return { query, hasAtSymbol: true };
};

/**
 * Replace mention selection with username
 * @param {string} text - Original text
 * @param {number} cursorPosition - Current cursor position
 * @param {string} username - Username to insert
 * @returns {object} { newText: string, newCursorPosition: number }
 */
export const replaceMention = (text, cursorPosition, username) => {
  const textBeforeCursor = text.substring(0, cursorPosition);
  const lastAtIndex = textBeforeCursor.lastIndexOf("@");

  if (lastAtIndex === -1) {
    return { newText: text, newCursorPosition: cursorPosition };
  }

  const textBefore = text.substring(0, lastAtIndex);
  const textAfter = text.substring(cursorPosition);
  const newText = `${textBefore}@${username} ${textAfter}`;
  const newCursorPosition = lastAtIndex + username.length + 2; // @ + username + space

  return { newText, newCursorPosition };
};

/**
 * Parse text and return JSX-ready content with mention markers
 * Returns an array of text segments and mention objects
 * @param {string} text - Text to parse
 * @returns {array} Array of { type: "text"|"mention", content: string }
 */
export const parseTextWithMentions = (text) => {
  if (!text) return [];

  const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.substring(lastIndex, match.index),
      });
    }

    // Add mention
    segments.push({
      type: "mention",
      content: match[1], // username without @
      fullMatch: match[0], // @username
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.substring(lastIndex),
    });
  }

  return segments;
};

/**
 * Filter users based on mention query
 * @param {array} users - Array of user objects with at least { username, displayName, profilePhotoURL }
 * @param {string} query - Search query (empty string shows all users)
 * @returns {array} Array of filtered user objects
 */
export const filterUsersForMention = (users, query) => {
  if (!users || users.length === 0) {
    return [];
  }

  // If empty query, return all users (show all when @ is typed)
  if (!query || query.trim().length === 0) {
    return users;
  }

  const lowerQuery = query.toLowerCase().trim();
  const filtered = users.filter((user) => {
    if (!user.username) return false;

    const usernameMatch = user.username.toLowerCase().includes(lowerQuery);
    const displayNameMatch =
      user.displayName && user.displayName.toLowerCase().includes(lowerQuery);

    return usernameMatch || displayNameMatch;
  });

  // Sort by username match first, then by display name match
  return filtered.sort((a, b) => {
    const aUsernameExact = a.username.toLowerCase() === lowerQuery;
    const bUsernameExact = b.username.toLowerCase() === lowerQuery;

    if (aUsernameExact && !bUsernameExact) return -1;
    if (!aUsernameExact && bUsernameExact) return 1;

    const aUsernameStartsWith = a.username.toLowerCase().startsWith(lowerQuery);
    const bUsernameStartsWith = b.username.toLowerCase().startsWith(lowerQuery);

    if (aUsernameStartsWith && !bUsernameStartsWith) return -1;
    if (!aUsernameStartsWith && bUsernameStartsWith) return 1;

    return 0;
  });
};
