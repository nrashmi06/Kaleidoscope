// Reaction types inspired by LinkedIn
export type ReactionType =
  | "LIKE"
  | "CELEBRATE"
  | "SUPPORT"
  | "INSIGHTFUL"
  | "FUNNY"
  | "CURIOUS";

// Enum-like object for easier mapping in UI (optional)
export const ReactionIcons: Record<ReactionType, string> = {
  LIKE: "👍",
  CELEBRATE: "🎉",
  SUPPORT: "👏",
  INSIGHTFUL: "💡",
  FUNNY: "😂",
  CURIOUS: "🤔",
};

// Content types that can be reacted to
export type ReactionContentType = "POST" | "COMMENT";

// Request body for adding or changing a reaction
export interface ReactionRequest {
  contentId: number;               // ID of the post or comment
  contentType: ReactionContentType; // "POST" or "COMMENT"
  reactionType: ReactionType;       // Selected reaction type
}

// Response type from GET /api/posts/{postId}/reactions
export interface ReactionSummary {
  contentId: number;
  contentType: ReactionContentType;
  currentUserReaction: ReactionType | null; // What current user reacted with (if any)
  countsByType: Partial<Record<ReactionType, number>>; // Count of each reaction
  totalReactions: number;
}

// Standard API response wrapper
export interface StandardAPIResponse<T> {
  success: boolean;
  message?: string;
  data?: T | null;
  errors?: string[];
  timestamp?: number;
  path?: string;
}

// API response for reaction summary
export type ReactionSummaryResponse = StandardAPIResponse<ReactionSummary>;

// API response for reaction update (POST / DELETE)
export type ReactionUpdateResponse = StandardAPIResponse<{
  contentId: number;
  contentType: ReactionContentType;
  reactionType: ReactionType;
}>;
