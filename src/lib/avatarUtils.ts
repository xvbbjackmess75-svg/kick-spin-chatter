/**
 * Utility functions for handling avatar URLs and prioritizing custom avatars
 */

interface AvatarOptions {
  customAvatar?: string | null;
  kickAvatar?: string | null;
  kickUsername?: string | null;
  fallbackInitials?: string;
}

/**
 * Get the best available avatar URL, prioritizing custom avatars over Kick avatars
 */
export function getBestAvatar(options: AvatarOptions): string | null {
  const { customAvatar, kickAvatar, kickUsername } = options;
  
  // 1. Prioritize custom avatar if it exists
  if (customAvatar) {
    return customAvatar;
  }
  
  // 2. Use provided Kick avatar if available
  if (kickAvatar) {
    return kickAvatar;
  }
  
  // 3. Generate Kick avatar URL from username if available
  if (kickUsername) {
    return `https://files.kick.com/images/user/${kickUsername}/profile_image/conversion/300x300-medium.webp`;
  }
  
  // 4. No avatar available
  return null;
}

/**
 * Get fallback initials from various sources
 */
export function getUserInitials(options: {
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
}): string {
  const { displayName, username, email } = options;
  
  if (displayName) {
    return displayName.slice(0, 2).toUpperCase();
  }
  
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  
  return 'U';
}

/**
 * Complete avatar info with URL and initials
 */
export function getCompleteAvatarInfo(options: AvatarOptions & {
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
}) {
  const avatar = getBestAvatar(options);
  const initials = getUserInitials({
    displayName: options.displayName,
    username: options.username || options.kickUsername,
    email: options.email
  });
  
  return {
    avatar,
    initials
  };
}