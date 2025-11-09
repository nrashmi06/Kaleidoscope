import { StandardAPIResponse } from "@/lib/types/auth";

export interface SuggestedUser {
  userId: number;
  email?: string;
  username: string;
  accountStatus?: string;
  profilePictureUrl?: string | null;
}

export interface SuggestionsPage {
  content: SuggestedUser[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

export type GetSuggestionsResponse = StandardAPIResponse<SuggestionsPage>;

export interface GetSuggestionsParams {
  userId?: number | null;
  page?: number;
  size?: number;
  sort?: string;
}
