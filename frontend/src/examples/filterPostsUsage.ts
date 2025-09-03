// Example usage of the filter posts API

import { filterPostsController } from "@/controllers/postController/filterPosts";
import { useAccessToken } from "@/hooks/useAccessToken";

// Basic usage - get all posts
const getAllPosts = async () => {
  const result = await filterPostsController(accessToken, {
    page: 0,
    size: 10,
    sort: "createdAt,desc"
  });
  
  if (result.success) {
    console.log("Posts:", result.data?.data.content);
  }
};

// Filter by user
const getPostsByUser = async (userId: number) => {
  const result = await filterPostsController(accessToken, {
    userId: userId,
    page: 0,
    size: 20,
    sort: "createdAt,desc"
  });
  
  if (result.success) {
    console.log("User posts:", result.data?.data.content);
  }
};

// Filter by category
const getPostsByCategory = async (categoryId: number) => {
  const result = await filterPostsController(accessToken, {
    categoryId: categoryId,
    visibility: "PUBLIC",
    status: "PUBLISHED",
    sort: "createdAt,desc"
  });
};

// Search posts
const searchPosts = async (searchQuery: string) => {
  const result = await filterPostsController(accessToken, {
    q: searchQuery,
    visibility: "PUBLIC",
    status: "PUBLISHED",
    page: 0,
    size: 15
  });
};

// Get only public posts
const getPublicPosts = async () => {
  const result = await filterPostsController(accessToken, {
    visibility: "PUBLIC",
    status: "PUBLISHED",
    sort: "createdAt,desc",
    page: 0,
    size: 10
  });
};

// Get posts by multiple filters
const getFilteredPosts = async () => {
  const result = await filterPostsController(accessToken, {
    categoryId: 1,           // Posts in category 1
    visibility: "PUBLIC",    // Only public posts
    status: "PUBLISHED",     // Only published posts
    q: "travel",            // Search for "travel" in content
    sort: "createdAt,desc", // Sort by newest first
    page: 0,
    size: 20
  });
  
  if (result.success) {
    console.log("Filtered posts:", result.data?.data.content);
    console.log("Total results:", result.data?.data.totalElements);
    console.log("Total pages:", result.data?.data.totalPages);
  } else {
    console.error("Filter failed:", result.error);
  }
};

export {
  getAllPosts,
  getPostsByUser,
  getPostsByCategory,
  searchPosts,
  getPublicPosts,
  getFilteredPosts
};
