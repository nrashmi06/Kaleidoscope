// src/components/user/EditUserProfileForm.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { updateUserProfileController } from "@/controllers/userController/updateUserProfileController";
import { UserProfileUpdateRequest, UserProfileUpdateUserData } from "@/lib/types/userProfileUpdate";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useUserData } from "@/hooks/useUserData";
import { User, Briefcase, Info, Camera, Loader2, RefreshCw, Image as ImageIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { getUserProfileController } from "@/controllers/userController/getUserProfileController";
import { MappedUserProfile } from "@/lib/types/userProfile";

const DEFAULT_PROFILE_PIC = "/person.png";
const DEFAULT_COVER_PHOTO = "/default-cover.jpg";


// Helper for file preview
function getFilePreviewUrl(file: File | null): string {
  if (file) {
    return URL.createObjectURL(file);
  }
  return '';
}

/**
 * Form component for editing the authenticated user's profile details and photos.
 */
export function EditUserProfileForm() {
  const accessToken = useAccessToken();
  const currentUser = useUserData(); 

  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true); 
  
  const [fetchedProfile, setFetchedProfile] = useState<MappedUserProfile | null>(null);

  const [form, setForm] = useState<UserProfileUpdateUserData>({
    username: "",
    designation: "",
    summary: "",
  });
  
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);

  // --- 1. Data Fetching and Initialization ---
  const fetchProfileData = useCallback(async () => {
    if (!currentUser.userId || !accessToken) {
        setIsRefreshing(false);
        return;
    }

    setIsRefreshing(true);
    try {
        const result = await getUserProfileController(currentUser.userId, accessToken);

        if (result.success && result.data) {
            const profile = result.data;
            setFetchedProfile(profile);
            
            // Initialize form state using fetched data (source of truth)
            setForm({
                username: profile.username || '',
                designation: profile.designation || '',
                summary: profile.summary || '',
            });
        } else {
            // Fallback: Manually construct the MappedUserProfile object 
            const defaultMappedProfile: MappedUserProfile = {
                userId: currentUser.userId,
                username: currentUser.username,
                profilePictureUrl: currentUser.profilePictureUrl || DEFAULT_PROFILE_PIC,
                coverPhotoUrl: DEFAULT_COVER_PHOTO, 
                designation: '',
                summary: '',
                followerCount: 0, 
                followingCount: 0,
                isPrivate: false,
                followStatus: "NOT_FOLLOWING",
                posts: { content: [], page: 0, size: 0, totalPages: 0, totalElements: 0, first: true, last: true },
            };
            
            setFetchedProfile(defaultMappedProfile);
            toast.error(result.message || "Failed to load profile details.");
        }
    } catch (err) {
        console.error("[EditUserProfileForm] Error fetching profile data:", err);
    } finally {
        setIsRefreshing(false);
    }
  }, [currentUser, accessToken]);

  useEffect(() => {
    if (currentUser.userId && accessToken) {
        fetchProfileData();
    }
  }, [currentUser.userId, accessToken, fetchProfileData]);


  // 2. Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (profilePictureFile) URL.revokeObjectURL(getFilePreviewUrl(profilePictureFile));
      if (coverPhotoFile) URL.revokeObjectURL(getFilePreviewUrl(coverPhotoFile));
    };
  }, [profilePictureFile, coverPhotoFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setForm(prev => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'profilePicture' | 'coverPhoto') => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("File size must be under 5MB.");
        e.target.value = '';
        return;
    }
    
    if (field === 'profilePicture') {
      if (profilePictureFile) URL.revokeObjectURL(getFilePreviewUrl(profilePictureFile));
      setProfilePictureFile(file);
    } else {
      if (coverPhotoFile) URL.revokeObjectURL(getFilePreviewUrl(coverPhotoFile));
      setCoverPhotoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      toast.error("You must be logged in to update your profile.");
      return;
    }
    
    if (!form.username.trim() || form.summary.length > 500) {
        toast.error("Please ensure username is not empty and summary is under 500 characters.");
        return;
    }

    setIsLoading(true);
    
    const requestData: UserProfileUpdateRequest = {
        profilePicture: profilePictureFile,
        coverPhoto: coverPhotoFile,
        userData: form,
    };
    
    try {
      const result = await updateUserProfileController(requestData, accessToken);
      
      if (result.success) {
        toast.success(result.message);
        
        setProfilePictureFile(null);
        setCoverPhotoFile(null);

        // Re-fetch data to sync all component state with Redux/Server
        await fetchProfileData();

      } else {
        toast.error(result.errors.join(", ") || result.message);
      }

    } catch (error) {
      console.error("[EditUserProfileForm] Unexpected error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Image Preview Logic (using fetchedProfile) ---
  const currentProfilePicUrl = profilePictureFile 
    ? getFilePreviewUrl(profilePictureFile) 
    : fetchedProfile?.profilePictureUrl || DEFAULT_PROFILE_PIC;
  
  const currentCoverPhotoSource = coverPhotoFile
    ? getFilePreviewUrl(coverPhotoFile)
    : fetchedProfile?.coverPhotoUrl;

  const showCoverPlaceholder = !currentCoverPhotoSource;


  if (isRefreshing || !fetchedProfile) {
    return (
        <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-800">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /> 
            <p className="text-gray-600 dark:text-neutral-400 mt-3">Loading current profile data...</p>
        </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-neutral-800">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
        {/* Use fetchProfileData directly for refresh */}
        <button type="button" onClick={fetchProfileData} className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-neutral-400 hover:text-blue-500 transition-colors inline-flex items-center gap-1 border border-gray-200 dark:border-neutral-700 rounded-full hover:bg-gray-50 dark:hover:bg-neutral-800">
            <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Form Content */}
      <div className="p-6 space-y-8">
        
        {/* --- 1. Photos Section (Uploads) --- */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2"><Camera className="w-5 h-5 text-blue-500" /> Photos</h3>
          
          {/* Cover Photo Upload */}
          <div className="relative h-40 w-full rounded-lg overflow-hidden border border-dashed border-gray-400 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-800 group">
            
            {/* Conditional Rendering for Cover Photo Preview/Placeholder */}
            {showCoverPlaceholder ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-neutral-400">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <p className="text-sm">No Cover Photo Set</p>
                </div>
            ) : (
                <Image 
                    src={currentCoverPhotoSource} 
                    alt="Cover Preview" 
                    fill 
                    className="object-cover transition-opacity duration-300 group-hover:opacity-60" 
                    sizes="(max-width: 768px) 100vw, 800px" 
                    unoptimized={!!coverPhotoFile} 
                />
            )}
            
            {/* Label/Click Overlay */}
            <label 
                htmlFor="coverPhoto" 
                className={`absolute inset-0 flex items-center justify-center text-white cursor-pointer transition-all z-10 
                    ${!showCoverPlaceholder && 'opacity-0 group-hover:opacity-100 bg-black/40'}`}
            >
                <span className={`text-lg font-medium px-4 py-2 rounded-full transition-colors 
                    ${showCoverPlaceholder ? 'text-blue-600 bg-blue-100/70 dark:bg-blue-900/40 border border-blue-300' : 'bg-black/60'}`}>
                    {showCoverPlaceholder ? 'Add Cover Photo' : 'Change Cover'}
                </span>
                <input id="coverPhoto" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'coverPhoto')} className="sr-only" disabled={isLoading} />
            </label>
            
            {coverPhotoFile && <span className="absolute bottom-2 right-2 text-xs bg-red-600/90 text-white px-2 py-0.5 rounded z-20">NEW FILE</span>}
          </div>

          {/* Profile Picture Upload */}
          <div className="flex items-end justify-center -mt-16">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-neutral-900 shadow-xl bg-gray-300 dark:bg-neutral-700 group">
              <Image 
                src={currentProfilePicUrl} 
                alt="Profile Preview" 
                width={112} 
                height={112} 
                className="object-cover transition-opacity duration-300 group-hover:opacity-60" 
                unoptimized={!!profilePictureFile} 
              />
              
              <label htmlFor="profilePicture" className="absolute inset-0 flex items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/40">
                <Camera className="w-6 h-6" />
                <input id="profilePicture" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'profilePicture')} className="sr-only" disabled={isLoading} />
              </label>
              {profilePictureFile && <span className="absolute top-0 right-0 w-max text-xs bg-red-600 px-2 py-0.5 rounded-bl">NEW</span>}
            </div>
          </div>
        </div>

        {/* --- 2. Text Details Section --- */}
        <div className="space-y-6 pt-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2"><User className="w-5 h-5 text-blue-500" /> Account Details</h3>
          
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 inline-flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Username *</label>
            <input id="username" type="text" value={form.username} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" disabled={isLoading} />
          </div>

          {/* Designation */}
          <div>
            <label htmlFor="designation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 inline-flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Designation</label>
            <input id="designation" type="text" value={form.designation} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" disabled={isLoading} />
          </div>
          
          {/* Summary */}
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 inline-flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Summary (Bio)</label>
            <textarea id="summary" value={form.summary} onChange={handleChange} rows={4} maxLength={500} className="w-full px-4 py-3 border border-gray-300 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none" disabled={isLoading} />
            <span className="text-xs text-gray-500 dark:text-neutral-400 mt-1 block text-right">{form.summary.length}/500</span>
          </div>
        </div>
        
        {/* --- Submit Button --- */}
        <div className="pt-4 border-t border-gray-200 dark:border-neutral-800">
          <button
            type="submit"
            disabled={isLoading || isRefreshing}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Saving Changes...
              </>
            ) : (
              "Update Profile"
            )}
          </button>
        </div>

      </div>
    </form>
  );
}