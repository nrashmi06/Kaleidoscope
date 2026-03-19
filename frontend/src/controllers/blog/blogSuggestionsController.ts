import { getBlogSuggestionsService } from "@/services/blog/blogSuggestions";
import { BlogFilterResponse } from "@/lib/types/blogFilter.types";

export async function getBlogSuggestionsController(
  accessToken: string,
  page: number = 0,
  size: number = 10
): Promise<BlogFilterResponse> {
  if (!accessToken) {
    return {
      success: false,
      message: "Authentication token is missing.",
      data: null,
      errors: ["Authentication token is missing."],
      timestamp: Date.now(),
      path: "/api/blogs/suggestions",
    };
  }
  return getBlogSuggestionsService(accessToken, page, size);
}
