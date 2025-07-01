const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_BACKEND_URL}/kaleidoscope/api`;

export const CategoryMapper = {
  getAllCategories: `${BASE_URL}/categories`, //returns top 10 categories
  getCategoryById: (id: string) => `${BASE_URL}/categories/${id}`,
  createCategory: `${BASE_URL}/categories`, //FOR ADMIN ROLES ONLY 
  updateCategory: (id: string) => `${BASE_URL}/categories/${id}`,
  deleteCategory: (id: string) => `${BASE_URL}/categories/${id}`,
};