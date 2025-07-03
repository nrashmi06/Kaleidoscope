// ✅ Generic API response wrapper
export interface StandardAPIResponse<T> {
  success: boolean;
  message: string;
  data: T | null; // null in case of failure or empty response
  errors: string[]; // extendable to more structured errors
  timestamp: number;
  path: string;
}

// ✅ Full category structure with optional subcategories for flexibility
export interface Category {
  categoryId: number;
  name: string;
  description: string;
  iconName: string; // e.g., "cpu", "bot"
  parentId: number | null;
  subcategories?: Category[]; // Present only in some responses
}

// ✅ Flat category (used in parent category list response)
export interface FlatCategory {
  categoryId: number;
  name: string;
  description: string;
  iconName: string;
  parentId: number | null;
}

// ✅ Request body: get a category by ID
export interface GetCategoryByIdData {
  categoryId: number;
}

// ✅ Request body: create a new category
export interface CreateCategoryData {
  name: string;
  description: string;
  iconName: string;
  parentId: number | null;
}

// ✅ Request body: update an existing category
export interface UpdateCategoryData {
  name: string;
  description: string;
  iconName: string;
  parentId: number | null;
}

// ✅ Request body: delete a category by ID
export interface DeleteCategoryData {
  categoryId: number;
}

// -------------------------------
// ✅ Response Types (Grouped Below)
// -------------------------------

// ✅ Response for retrieving all parent categories (flat, no subcategories)
export type ParentCategoriesResponse = StandardAPIResponse<{
  categories: FlatCategory[];
}>;

// ✅ Response for retrieving a full list of categories by parent ID or ID in general
export type CategoryListResponse = StandardAPIResponse<Category>;

// Response for updating a category
export type UpdateCategoryResponse = StandardAPIResponse<Category>;

//Response for creating a new category
export type CreateCategoryResponse = StandardAPIResponse<Category>;

// Response for deleting a category
export type DeleteCategoryResponse = StandardAPIResponse<string>;