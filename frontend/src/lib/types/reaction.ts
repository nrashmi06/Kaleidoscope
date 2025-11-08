// Reaction types inspired by LinkedIn
export type ReactionType =
  | "LIKE"
  | "CELEBRATE"
  | "SUPPORT"
  | "INSIGHTFUL"
  | "FUNNY"
  | "LOVE";

// Enum-like object for easier mapping in UI (optional)
export const ReactionIcons: Record<ReactionType, string> = {
  LIKE: "👍",
  CELEBRATE: "🎉",
  SUPPORT: "👏",
  INSIGHTFUL: "💡",
  FUNNY: "😂",
  LOVE: "❤️",
};

// Content types that can be reacted to
export type ReactionContentType = "POST" | "COMMENT";

/* -------------------------------------------------------------------------- */
/*                                Request Types                               */
/* -------------------------------------------------------------------------- */

// Request body for adding or changing a reaction
export interface ReactionRequestBody {
  reactionType: ReactionType;
}

// Query params for unreacting (optional)
export interface ReactionRequestParams {
  unreact?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                Response Types                              */
/* -------------------------------------------------------------------------- */

// Core structure of reaction data returned from the backend
export interface ReactionSummary {
  contentId: number;
  contentType: ReactionContentType;
  currentUserReaction: ReactionType | null;
  countsByType: Partial<Record<ReactionType, number>>;
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

// GET response for reactions summary
export type ReactionSummaryResponse = StandardAPIResponse<ReactionSummary>;

// POST response for creating/updating/removing a reaction
export type ReactionUpdateResponse = StandardAPIResponse<ReactionSummary>;
