const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/kaleidoscope/api`;

/**
 * UserNotificationPreferencesMapper
 * Maps all API endpoints related to user notification preferences.
 */
export const UserNotificationPreferencesMapper = {

  getAllNotificationPreferencesAdmin: `${BASE_URL}/user-notification-preferences/admin/all?page=0&size=10&sort=createdAt,desc`,

  // Get current user's preferences
  getNotificationPreferences: `${BASE_URL}/user-notification-preferences`,

  // Get preferences by user ID (likely admin use-case)
  getUserPrefsById: (userId: string) =>
    `${BASE_URL}/user-notification-preferences/${userId}`,

  // Reset current user's preferences to defaults
  resetToDefaults: `${BASE_URL}/user-notification-preferences/reset`,

  /*
  |--------------------------------------------------------------------------
  | Update Specific Notification Channel Preferences (PATCH)
  |--------------------------------------------------------------------------
  */
  updateCommentsPreferences: `${BASE_URL}/user-notification-preferences/comments`,
  updateEmailPreferences: `${BASE_URL}/user-notification-preferences/email`,
  updateFollowsPreferences: `${BASE_URL}/user-notification-preferences/follows`,
  updateLikesPreferences: `${BASE_URL}/user-notification-preferences/likes`,
  updatePushPreferences: `${BASE_URL}/user-notification-preferences/push`,
  updateSystemPreferences: `${BASE_URL}/user-notification-preferences/system`,
  updateMentionsPreferences: `${BASE_URL}/user-notification-preferences/mentions`,

  /*
  |--------------------------------------------------------------------------
  | Update All Preferences (PUT)
  |--------------------------------------------------------------------------
  */
  updateNotificationPreferences: `${BASE_URL}/user-notification-preferences`,

  /*
  |--------------------------------------------------------------------------
  | Bulk Notification Toggles (Affect current user)
  |--------------------------------------------------------------------------
  */
  disableAllEmail: `${BASE_URL}/user-notification-preferences/email/disable-all`,
  enableAllEmail: `${BASE_URL}/user-notification-preferences/email/enable-all`,
  disableAllPush: `${BASE_URL}/user-notification-preferences/push/disable-all`,
  enableAllPush: `${BASE_URL}/user-notification-preferences/push/enable-all`
};
