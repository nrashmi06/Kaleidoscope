"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setInterestSelected } from "@/store/authSlice";
import { getOnboardingCategories, addUserInterestsBulk } from "@/services/onboarding/categories";
import CategoryCard from "@/components/onboarding/CategoryCard";
import { toast } from "react-hot-toast";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

interface Category {
  categoryId: number;
  name: string;
  description: string;
  iconName: string;
  parentId: number | null;
}

interface CategoryGroup {
  name: string;
  description: string;
  categories: Category[];
  minRequired: number;
}

// Define category groups based on common topics
const getCategoryGroups = (categories: Category[]): CategoryGroup[] => {
  const techKeywords = ['technology', 'tech', 'programming', 'coding', 'software', 'computer', 'ai', 'machine learning', 'data', 'web', 'mobile', 'app'];
  const scienceKeywords = ['science', 'biology', 'chemistry', 'physics', 'research', 'laboratory', 'medical', 'health', 'environment'];
  const artsKeywords = ['art', 'music', 'design', 'creative', 'painting', 'drawing', 'photography', 'film', 'literature', 'writing'];
  const businessKeywords = ['business', 'finance', 'marketing', 'entrepreneurship', 'management', 'economics', 'startup', 'investment'];
  const sportsKeywords = ['sports', 'fitness', 'exercise', 'football', 'basketball', 'soccer', 'tennis', 'swimming', 'running', 'gym'];
  const lifestyleKeywords = ['lifestyle', 'travel', 'food', 'cooking', 'fashion', 'beauty', 'home', 'garden', 'hobby'];

  const groups: CategoryGroup[] = [
    { name: "Technology & Programming", description: "Tech, coding, AI, and digital innovation", categories: [], minRequired: 1 },
    { name: "Science & Research", description: "Scientific fields, research, and discoveries", categories: [], minRequired: 1 },
    { name: "Arts & Creativity", description: "Creative arts, music, design, and literature", categories: [], minRequired: 1 },
    { name: "Business & Finance", description: "Business, entrepreneurship, and financial topics", categories: [], minRequired: 1 },
    { name: "Sports & Fitness", description: "Physical activities, sports, and wellness", categories: [], minRequired: 1 },
    { name: "Lifestyle & Hobbies", description: "Personal interests, travel, and everyday life", categories: [], minRequired: 1 }
  ];

  // Categorize each category into appropriate groups
  categories.forEach(category => {
    const categoryText = `${category.name} ${category.description}`.toLowerCase();
    
    if (techKeywords.some(keyword => categoryText.includes(keyword))) {
      groups[0].categories.push(category);
    } else if (scienceKeywords.some(keyword => categoryText.includes(keyword))) {
      groups[1].categories.push(category);
    } else if (artsKeywords.some(keyword => categoryText.includes(keyword))) {
      groups[2].categories.push(category);
    } else if (businessKeywords.some(keyword => categoryText.includes(keyword))) {
      groups[3].categories.push(category);
    } else if (sportsKeywords.some(keyword => categoryText.includes(keyword))) {
      groups[4].categories.push(category);
    } else {
      groups[5].categories.push(category); // Default to lifestyle
    }
  });

  // Filter out empty groups
  return groups.filter(group => group.categories.length > 0);
};

const OnboardingCategoriesPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { accessToken } = useSelector((state: RootState) => state.auth);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [groupSelections, setGroupSelections] = useState<{ [groupIndex: number]: number[] }>({});
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
          const fetchedCategories = response.data.categories;
          setCategories(fetchedCategories);
          
          // Group categories
          const groups = getCategoryGroups(fetchedCategories);
          setCategoryGroups(groups);
          
          // Initialize group selections
          const initialSelections: { [groupIndex: number]: number[] } = {};
          groups.forEach((_, index) => {
            initialSelections[index] = [];
          });
          setGroupSelections(initialSelections);
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
    const newSelections = { ...groupSelections };
    const currentGroupSelections = newSelections[currentGroupIndex] || [];
    
    if (currentGroupSelections.includes(categoryId)) {
      newSelections[currentGroupIndex] = currentGroupSelections.filter(id => id !== categoryId);
    } else {
      newSelections[currentGroupIndex] = [...currentGroupSelections, categoryId];
    }
    
    setGroupSelections(newSelections);
    
    // Update overall selected categories
    const allSelected = Object.values(newSelections).flat();
    setSelectedCategories(allSelected);
  };

  const getCurrentGroupSelections = () => {
    return groupSelections[currentGroupIndex] || [];
  };

  const isCurrentGroupValid = () => {
    const currentGroup = categoryGroups[currentGroupIndex];
    const currentSelections = getCurrentGroupSelections();
    return currentSelections.length >= (currentGroup?.minRequired || 1);
  };

  const handleNext = () => {
    if (!isCurrentGroupValid()) {
      const currentGroup = categoryGroups[currentGroupIndex];
      toast.error(`Please select at least ${currentGroup.minRequired} category from ${currentGroup.name}`);
      return;
    }
    
    if (currentGroupIndex < categoryGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1);
    }
  };

  const handleSubmit = async () => {
    // Validate all groups
    const invalidGroups = categoryGroups.filter((group, index) => {
      const selections = groupSelections[index] || [];
      return selections.length < group.minRequired;
    });

    if (invalidGroups.length > 0) {
      toast.error(`Please complete all category groups. Missing: ${invalidGroups.map(g => g.name).join(', ')}`);
      return;
    }

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
        dispatch(setInterestSelected());
        toast.success("Interests saved successfully! Redirecting to feed...");
        
        setTimeout(() => {
          router.push("/feed");
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (categoryGroups.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No categories available</p>
        </div>
      </div>
    );
  }

  const currentGroup = categoryGroups[currentGroupIndex];
  const currentSelections = getCurrentGroupSelections();
  const isLastGroup = currentGroupIndex === categoryGroups.length - 1;
  const allGroupsCompleted = categoryGroups.every((group, index) => {
    const selections = groupSelections[index] || [];
    return selections.length >= group.minRequired;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Step {currentGroupIndex + 1} of {categoryGroups.length}
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {Math.round(((currentGroupIndex + 1) / categoryGroups.length) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentGroupIndex + 1) / categoryGroups.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {currentGroup.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
            {currentGroup.description}
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <strong>Select at least {currentGroup.minRequired} categor{currentGroup.minRequired === 1 ? 'y' : 'ies'}</strong> from this section to continue
            </p>
          </div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {currentGroup.categories.map((category) => (
            <CategoryCard
              key={category.categoryId}
              category={category}
              isSelected={currentSelections.includes(category.categoryId)}
              onToggle={handleCategoryToggle}
            />
          ))}
        </div>

        {/* Selection Status */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
            {isCurrentGroupValid() ? (
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
            )}
            <span className={`text-sm font-medium ${
              isCurrentGroupValid() 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {currentSelections.length} of {currentGroup.minRequired} minimum selected
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentGroupIndex === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {categoryGroups.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentGroupIndex
                    ? 'bg-blue-600 scale-125'
                    : index < currentGroupIndex
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              ></div>
            ))}
          </div>

          {isLastGroup ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || !allGroupsCompleted}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
                submitting || !allGroupsCompleted
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup
                  <Check className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!isCurrentGroupValid()}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                !isCurrentGroupValid()
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total selected: {selectedCategories.length} categories across {Object.keys(groupSelections).filter(key => groupSelections[parseInt(key)].length > 0).length} groups
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingCategoriesPage;
