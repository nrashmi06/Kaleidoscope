"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccessToken } from "@/hooks/useAccessToken";
import { PostCreateRequestDTO, LocationOption } from "@/lib/types/post";
import { createPostController } from "@/controllers/postController/createPost";
import { generateUploadSignatureController } from "@/controllers/postController/uploadSignature";
import { uploadToCloudinary } from "@/services/cloudinary/upload";
import { LocationSearch } from "@/components/post/LocationSearch";
import { getParentCategoriesController } from "@/controllers/categoryController/getParentCategories";
import { searchUsersController } from "@/controllers/userController/searchUsers";
import { toast } from "react-hot-toast";
import { 
  ArrowLeft, 
  Upload, 
  X, 
  MapPin, 
  Tag, 
  Users, 
  Image as ImageIcon,
  Plus,
  Loader2
} from "lucide-react";
import Image from "next/image";

export default function CreatePostPage() {
  const router = useRouter();
  const accessToken = useAccessToken();
  
  // Form state
  const [formData, setFormData] = useState<PostCreateRequestDTO>({
    title: "",
    body: "",
    summary: "",
    visibility: "PUBLIC",
    locationId: null,
    categoryIds: [],
    mediaDetails: [],
    taggedUserIds: [],
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [uploading, setUploading] = useState(false);

  // Load initial data
  useEffect(() => {
    if (accessToken) {
      loadCategories();
    }
  }, [accessToken]);

  // Search users when query changes
  useEffect(() => {
    if (userSearchQuery.trim() && accessToken) {
      const timeoutId = setTimeout(() => {
        searchUsersController(accessToken, userSearchQuery).then((response) => {
          if (response.success && response.data?.content) {
            setUsers(response.data.content);
          }
        });
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setUsers([]);
    }
  }, [userSearchQuery, accessToken]);

  const loadCategories = async () => {
    const response = await getParentCategoriesController(accessToken);
    if (response.success && response.data?.content) {
      setCategories(response.data.content);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleCategoryToggle = (categoryId: number) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
  };

  const handleUserToggle = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      taggedUserIds: prev.taggedUserIds?.includes(userId)
        ? prev.taggedUserIds.filter(id => id !== userId)
        : [...(prev.taggedUserIds || []), userId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error("Title and body are required");
      return;
    }

    if (formData.categoryIds.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    setLoading(true);
    setUploading(true);

    try {
      let uploadedMediaDetails = [];

      // Upload files to Cloudinary if any are selected
      if (selectedFiles.length > 0) {
        toast.loading("Uploading media...");
        
        // Get upload signatures for all files at once
        const fileNames = selectedFiles.map(file => file.name);
        console.log('Requesting upload signatures for files:', fileNames);
        
        const signatureResponse = await generateUploadSignatureController(accessToken, {
          fileNames: fileNames,
        });

        console.log('Signature response:', signatureResponse);

        if (!signatureResponse.success || !signatureResponse.data) {
          throw new Error(`Failed to get upload signatures: ${signatureResponse.error || 'Unknown error'}`);
        }

        // Upload each file to Cloudinary
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const fileName = file.name;
          setUploadProgress(prev => ({ ...prev, [i]: 0 }));

          // Get signature data for this specific file
          const fileSignatureData = signatureResponse.data[fileName];
          if (!fileSignatureData) {
            throw new Error(`No signature data found for ${fileName}`);
          }

          const { signature, timestamp, cloudName, apiKey, folder, publicId, uploadUrl } = fileSignatureData;

          // Upload to Cloudinary
          const uploadResponse = await uploadToCloudinary(
            file,
            uploadUrl,
            signature,
            timestamp,
            apiKey,
            folder,
            publicId
          );

          if (!uploadResponse.success || !uploadResponse.data) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          const cloudinaryResult = uploadResponse.data;

          // Create media detail object according to API spec
          uploadedMediaDetails.push({
            url: cloudinaryResult.secure_url,
            mediaType: (cloudinaryResult.resource_type === "video" ? "VIDEO" : "IMAGE") as "IMAGE" | "VIDEO",
            position: i,
            width: cloudinaryResult.width,
            height: cloudinaryResult.height,
            fileSizeKb: Math.round(cloudinaryResult.bytes / 1024),
            durationSeconds: cloudinaryResult.duration || null,
            extraMetadata: {
              format: cloudinaryResult.format,
              publicId: cloudinaryResult.public_id,
            },
          });

          setUploadProgress(prev => ({ ...prev, [i]: 100 }));
        }
        
        toast.dismiss();
        toast.success("Media uploaded successfully!");
      }

      // Create the post with uploaded media details
      const postData = {
        ...formData,
        mediaDetails: uploadedMediaDetails,
      };

      const response = await createPostController(postData, accessToken);

      if (response.success) {
        toast.success("Post created successfully!");
        router.push("/feed");
      } else {
        toast.error(response.errors?.[0] || "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Failed to create post");
    } finally {
      setLoading(false);
      setUploading(false);
      setUploadProgress({});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create New Post
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Share your thoughts with the world
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter your post title..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Body Textarea */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Body *
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Write your post content..."
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              required
            />
          </div>

          {/* Summary Input */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Summary
            </label>
            <input
              type="text"
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Brief summary of your post..."
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {formData.summary.length}/500 characters
            </div>
          </div>

          {/* Visibility Select */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Visibility
            </label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as any }))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="PUBLIC">Public</option>
              <option value="FOLLOWERS_ONLY">Followers Only</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>

          {/* Location Select */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="w-4 h-4" />
              Location
            </label>
            <LocationSearch
              selectedLocation={selectedLocation}
              onLocationSelect={(location) => {
                setSelectedLocation(location);
                setFormData(prev => ({ 
                  ...prev, 
                  locationId: location.locationId || null 
                }));
              }}
              placeholder="Search for a location..."
            />
          </div>

          {/* Categories Multiselect */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              <Tag className="w-4 h-4" />
              Categories *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((category) => (
                <label
                  key={category.categoryId}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.categoryIds.includes(category.categoryId)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.categoryIds.includes(category.categoryId)}
                    onChange={() => handleCategoryToggle(category.categoryId)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      formData.categoryIds.includes(category.categoryId)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {formData.categoryIds.includes(category.categoryId) && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {category.name}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Media Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              <ImageIcon className="w-4 h-4" />
              Media Upload
            </label>
            
            <div className="space-y-4">
              {/* Upload Button */}
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Click to upload images or videos
                </span>
              </label>

              {/* Media Preview */}
              {mediaPreview.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {mediaPreview.map((preview, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                          width={200}
                          height={200}
                        />
                        
                        {/* Upload Progress Overlay */}
                        {uploading && uploadProgress[index] !== undefined && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                              <div className="text-white text-xs font-medium">
                                {uploadProgress[index]}%
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {!uploading && (
                        <button
                          type="button"
                          onClick={() => removeMedia(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tag Users */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              <Users className="w-4 h-4" />
              Tag Users
            </label>
            
            <div className="space-y-4">
              {/* Search Input */}
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search users to tag..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />

              {/* Search Results */}
              {users.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                  {users.map((user) => (
                    <label
                      key={user.userId}
                      className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        formData.taggedUserIds?.includes(user.userId) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.taggedUserIds?.includes(user.userId) || false}
                        onChange={() => handleUserToggle(user.userId)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          @{user.username}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Selected Users */}
              {formData.taggedUserIds && formData.taggedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.taggedUserIds.map((userId) => {
                    const user = users.find(u => u.userId === userId);
                    if (!user) return null;
                    
                    return (
                      <span
                        key={userId}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                      >
                        @{user.username}
                        <button
                          type="button"
                          onClick={() => handleUserToggle(userId)}
                          className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.body.trim() || formData.categoryIds.length === 0}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? "Uploading Media..." : loading ? "Creating..." : "Create Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
