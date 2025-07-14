export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 1000) {
    return "just now";
  } else if (diff < 60000) {
    return `${Math.floor(diff / 1000)} seconds ago`;
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} minutes ago`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} hours ago`;
  } else {
    return new Date(timestamp).toLocaleDateString();
  }
};
