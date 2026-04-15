const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/api`;

/**
 * UserNotificationPreferencesMapper
 * Maps all API endpoints related to user notification preferences.
 *
 * Backend endpoints (UserNotificationPreferencesController):
 *   GET    /api/user-notification-preferences           — current user's prefs
 *   GET    /api/user-notification-preferences/{userId}  — specific user (admin)
 *   GET    /api/user-notification-preferences/admin/all — all users (admin)
 *   PUT    /api/user-notification-preferences           — full update (all fields required)
 *   PATCH  /api/user-notification-preferences           — partial update (any subset of fields)
 *   POST   /api/user-notification-preferences/reset     — reset to defaults
 */
export const UserNotificationPreferencesMapper = {
  getNotificationPreferences: `${BASE_URL}/user-notification-preferences`,
  getUserPrefsById: (userId: string) =>
    `${BASE_URL}/user-notification-preferences/${userId}`,
  getAllNotificationPreferencesAdmin: `${BASE_URL}/user-notification-preferences/admin/all`,
  updateNotificationPreferences: `${BASE_URL}/user-notification-preferences`,
  partialUpdateNotificationPreferences: `${BASE_URL}/user-notification-preferences`,
  resetToDefaults: `${BASE_URL}/user-notification-preferences/reset`,
};
