export interface StandardAPIResponse<T> {
  success: boolean;
  message: string;
  data: T | null; // Allow null for cases where no data is returned
  errors: string[];
  timestamp: number;
  path: string;
}

// Admin-specific request
export interface GetUserPreferencesByIdAdminData {
  userId: number;
}

// Update specific fields
export interface UpdateLanguageData {
  language: string; // e.g., "en-US", "es-ES"
}

export interface UpdateThemeData {
  theme: "DARK" | "LIGHT" | "SYSTEM"; // DB constraint confirmed
}

export interface UpdatePrivacySettingsData {
  showEmail: boolean;
  showPhone: boolean;
  showOnlineStatus: boolean;
  searchDiscoverable: boolean;
}

export interface UpdateVisibilitySettingsData {
  profileVisibility: "PUBLIC" | "FRIENDS_ONLY" | "NO_ONE"; // removed "PRIVATE"
  allowMessages: "PUBLIC" | "FRIENDS_ONLY" | "NO_ONE";      // matches DB check
  allowTagging: "PUBLIC" | "FRIENDS_ONLY" | "NO_ONE";       // confirmed
  viewActivity: "PUBLIC" | "FRIENDS_ONLY" | "NO_ONE";       // confirmed
}

// Full user preferences update
export interface UpdateUserPreferencesData {
  theme: "DARK" | "LIGHT" | "SYSTEM";
  language: string;
  profileVisibility: "PUBLIC" | "FRIENDS_ONLY" | "NO_ONE";
  allowMessages: "PUBLIC" | "FRIENDS_ONLY" | "NO_ONE";
  allowTagging: "PUBLIC" | "FRIENDS_ONLY" | "NO_ONE";
  viewActivity: "PUBLIC" | "FRIENDS_ONLY" | "NO_ONE";
  showEmail: boolean;
  showPhone: boolean;
  showOnlineStatus: boolean;
  searchDiscoverable: boolean;
}

// Response payload for user preferences
// This is used in the `data` field of StandardAPIResponse
// and should match the structure returned by the API.
// It includes all fields that can be updated or retrieved.

export interface UserPreferencesResponsePayload {
  preferenceId: number;
  userId: number;
  theme: "DARK" | "LIGHT" | "SYSTEM";
  language: string;
  profileVisibility: "PUBLIC" | "FRIENDS_ONLY" | "NO_ONE";
  allowMessages: "PUBLIC" | "FRIENDS_ONLY" | "NO_ONE";
  allowTagging: "PUBLIC" | "FRIENDS_ONLY" | "NO_ONE";
  viewActivity: "PUBLIC" | "FRIENDS_ONLY" | "NO_ONE";
  showEmail: boolean;
  showPhone: boolean;
  showOnlineStatus: boolean;
  searchDiscoverable: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserPreferencesAPIResponse = StandardAPIResponse<UserPreferencesResponsePayload>;
