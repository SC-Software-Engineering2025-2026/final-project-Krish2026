import { useNavigate } from "react-router-dom";
import { parseTextWithMentions } from "../utils/mentionUtils";

const MentionDisplay = ({ text, className = "" }) => {
  const navigate = useNavigate();

  if (!text) {
    return <span className={className}></span>;
  }

  const segments = parseTextWithMentions(text);

  const handleMentionClick = (e, username) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/profile/${username}`);
  };

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === "mention") {
          return (
            <button
              key={index}
              onClick={(e) => handleMentionClick(e, segment.content)}
              className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer transition"
            >
              @{segment.content}
            </button>
          );
        } else {
          return (
            <span key={index}>
              {segment.content.split("\n").map((line, lineIndex) => (
                <span key={lineIndex}>
                  {line}
                  {lineIndex < segment.content.split("\n").length - 1 && <br />}
                </span>
              ))}
            </span>
          );
        }
      })}
    </span>
  );
};

export default MentionDisplay;
