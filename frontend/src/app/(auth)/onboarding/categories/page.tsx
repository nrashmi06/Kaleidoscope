"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setInterestSelected } from "@/store/authSlice";
import { getOnboardingCategories, addUserInterestsBulk } from "@/services/onboarding/categories";
import CategoryCard from "@/components/onboarding/CategoryCard";
import { toast } from "react-hot-toast";

interface Category {
  categoryId: number;
  name: string;
  description: string;
  iconName: string;
  parentId: number | null;
}

const OnboardingCategoriesPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { accessToken } = useSelector((state: RootState) => state.auth);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      router.push("/auth/login");
      return;
    }

    const fetchCategories = async () => {
      try {
        const response = await getOnboardingCategories(accessToken);
        if (response.success && response.data?.categories) {
          setCategories(response.data.categories);
        } else {
          toast.error("Failed to load categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [accessToken, router]);

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    if (!accessToken) {
      toast.error("Authentication required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await addUserInterestsBulk(accessToken, selectedCategories);
      if (response.success) {
        // Update Redux state to indicate interests have been selected
        dispatch(setInterestSelected());
        toast.success("Interests saved successfully! Redirecting to home...");
        
        // Redirect to main app after a short delay
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        toast.error(response.message || "Failed to save interests");
      }
    } catch (error) {
      console.error("Error saving interests:", error);
      toast.error("Failed to save interests");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Choose Your Interests
          </h1>
          <p className="text-gray-600">
            Select categories that interest you to personalize your experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {categories.map((category) => (
            <CategoryCard
              key={category.categoryId}
              category={category}
              isSelected={selectedCategories.includes(category.categoryId)}
              onToggle={handleCategoryToggle}
            />
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Selected {selectedCategories.length} categories
          </p>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedCategories.length === 0}
            className={`
              px-8 py-3 rounded-lg font-semibold transition-colors duration-200
              ${submitting || selectedCategories.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {submitting ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingCategoriesPage;
