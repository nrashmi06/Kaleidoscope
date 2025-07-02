const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/kaleidoscope/api`;

export const UserPreferencesMapper = {
    getUserPreferencesByIdAdmin: (userId: string) => `${BASE_URL}/user-preferences/${userId}`, // Get user preferences by user ID for admin
    getUserPreferences: `${BASE_URL}/user-preferences`, // Get user preferences for the current user // NOT WORKING UNLESS THE PREFERENCES ARE SET SO BETTER USE THE BELOW API CALL WHERE WE SEND THE CURRENT USERS ID TO FETCH THE DETAILS
    updateLanguage: `${BASE_URL}/user-preferences/language`, // Update user's language preference
    updatePrivacy: `${BASE_URL}/user-preferences/privacy`, // Update user's privacy settings
    updateTheme: `${BASE_URL}/user-preferences/theme`, // Update user's theme preference
    updateUserPreferences: `${BASE_URL}/user-preferences`, // Update all user preferences
    updateVisibility: `${BASE_URL}/user-preferences/visibility`, // Update user's visibility settings
};