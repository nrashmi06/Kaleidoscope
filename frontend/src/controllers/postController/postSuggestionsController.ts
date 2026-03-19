import { getPostSuggestionsService } from "@/services/post/postSuggestions";

export async function getPostSuggestionsController(
  accessToken: string,
  page: number = 0,
  size: number = 10
) {
  if (!accessToken) {
    return {
      success: false,
      message: "Authentication token is missing.",
      data: null,
      errors: ["Authentication token is missing."],
      timestamp: Date.now(),
      path: "/api/posts/suggestions",
    };
  }
  return getPostSuggestionsService(accessToken, page, size);
}
