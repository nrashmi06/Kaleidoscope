"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { PostCreateRequestDTO, MediaUploadRequestDTO } from "@/lib/types/post";
import { toast } from "react-hot-toast";
import { generateUploadSignatureController } from "@/controllers/postController/uploadSignature";
import { uploadToCloudinary } from "@/services/cloudinary/upload";
import { UploadCloud, Loader2, X, FileImage } from "lucide-react";

// TODO: You will need to create this controller.
// It's a server-side function that securely calls Cloudinary's 'destroy' API.
// import { deleteMediaController } from "@/controllers/postController/deleteMedia";

interface Props {
  accessToken: string | null;
  formData: PostCreateRequestDTO;
  setFormData: React.Dispatch<React.SetStateAction<PostCreateRequestDTO>>;
}

export default function MediaUpload({
  accessToken,
  formData,
  setFormData,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const initializedRef = useRef(false);

  // Initialize previews from existing media URLs (for edit mode)
  useEffect(() => {
    if (
      !initializedRef.current &&
      formData.mediaDetails &&
      formData.mediaDetails.length > 0 &&
      mediaPreview.length === 0
    ) {
      const existingUrls = formData.mediaDetails
        .filter((m) => m.url && !m.url.startsWith("data:"))
        .map((m) => m.url);
      if (existingUrls.length > 0) {
        setMediaPreview(existingUrls);
        initializedRef.current = true;
      }
    }
  }, [formData.mediaDetails, mediaPreview.length]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... (All existing logic remains exactly the same) ...
    if (!e.target.files || !accessToken) return;

    const files = Array.from(e.target.files);

    // Previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setMediaPreview((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });

    try {
      setUploading(true);
      // Get upload signatures
      const response = await generateUploadSignatureController(accessToken, {
        fileNames: files.map((f) => f.name),
      });
      if (!response.success || !response.data)
        throw new Error("Failed to get upload signature");

      const signatures = response.data.data.signatures;

      const newMediaDetails: MediaUploadRequestDTO[] = [];
      const existingLength = formData.mediaDetails?.length || 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sig = signatures[i];
        const result = await uploadToCloudinary(
          file,
          sig.cloudName,
          sig.signature,
          sig.timestamp,
          sig.apiKey,
          sig.folder,
          sig.publicId
        );
        if (!result.success || !result.data) continue;

        newMediaDetails.push({
          url: result.data.secure_url,
          mediaType: "IMAGE", 
          position: existingLength + i,
          width: result.data.width,
          height: result.data.height,
          fileSizeKb: Math.round(result.data.bytes / 1024),
          durationSeconds: result.data.duration || null,
          extraMetadata: {
            format: result.data.format,
            publicId: result.data.public_id,
          },
        });
      }

      setFormData((prev) => ({
        ...prev,
        mediaDetails: [...(prev.mediaDetails || []), ...newMediaDetails],
      }));

      toast.success(`${newMediaDetails.length} file(s) uploaded`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "Upload failed");
      } else {
        toast.error("Upload failed");
      }
    } finally {
      setUploading(false);
    }
  };

  // --- [NEW] Implemented Remove Logic ---
  const handleRemoveMedia = async (indexToRemove: number) => {
    // 1. Get the public_id of the file to be deleted from Cloudinary
    const itemToRemove = formData.mediaDetails?.[indexToRemove];
    const publicId = itemToRemove?.extraMetadata?.publicId;

    // 2. Optimistically update the UI: Remove from mediaPreview state
    setMediaPreview((prev) => prev.filter((_, i) => i !== indexToRemove));

    // 3. Update the form data: Remove from formData.mediaDetails
    // We also re-map the 'position' property to keep it sequential.
    setFormData((prev) => ({
      ...prev,
      mediaDetails: (prev.mediaDetails || [])
        .filter((_, i) => i !== indexToRemove)
        .map((item, newIndex) => ({
          ...item,
          position: newIndex,
        })),
    }));

    toast.success("Media removed from post.");

    // 4. [IMPORTANT] Call the server to delete the file from Cloudinary
    if (publicId && accessToken) {
      try {
        /*
        // TODO: Create a `deleteMediaController` that takes the
        // accessToken and publicId. This server-side function must
        // securely use your Cloudinary API_SECRET to destroy the asset.
        
        const response = await deleteMediaController(accessToken, publicId);

        if (response.success) {
          toast.success("File deleted from cloud.");
        } else {
          throw new Error(response.message || "Failed to delete from cloud.");
        }
        */
        console.log(
          `TODO: Implement server-side deletion for public_id: ${publicId}`
        );
      } catch (err: unknown) {
        // If deletion fails, the file is removed from the post but
        // remains in Cloudinary. We just log the error for now.
        const message =
          err instanceof Error ? err.message : "Cloud deletion failed.";
        console.error("Cloudinary deletion error:", message);
        toast.error(message);
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* --- Hidden File Input --- */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        className="sr-only"
        id="file-upload"
        accept="image/*,video/*" // Good to specify accepted types
        disabled={uploading}
      />

      {/* --- Modern Dropzone --- */}
      <label
        htmlFor="file-upload"
        className={`flex flex-col items-center justify-center w-full p-8 py-10 border-2 border-dashed rounded-xl transition-colors
        ${
          uploading
            ? "border-cream-300/40 bg-cream-50/50 dark:border-navy-700/40 dark:bg-navy-700/30"
            : "border-cream-400 dark:border-navy-600 cursor-pointer hover:border-steel/50 hover:bg-steel/5 dark:hover:border-sky/40 dark:hover:bg-sky/5"
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 mb-3 text-steel dark:text-sky animate-spin" />
            <span className="font-medium text-navy dark:text-cream">
              Uploading files...
            </span>
            <span className="text-sm text-steel/60 dark:text-sky/50">
              Please wait.
            </span>
          </>
        ) : (
          <>
            <UploadCloud className="w-8 h-8 mb-3 text-steel/50 dark:text-sky/40" />
            <span className="font-medium text-navy dark:text-cream">
              Click to upload or drag and drop
            </span>
            <span className="text-sm text-steel/60 dark:text-sky/50">
              PNG, JPG or JPEG
            </span>
          </>
        )}
      </label>

      {/* --- Preview Grid --- */}
      {mediaPreview.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-navy dark:text-cream mb-3">
            Previews
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {mediaPreview.map((src, i) => (
              <div
                key={i} // Note: Using index as key is okay here because the list is append-only
                className="relative group aspect-square rounded-xl overflow-hidden border border-cream-300/40 dark:border-navy-700/40"
              >
                {/* Check if it's a video or image for preview */}
                {src.startsWith("data:image") || src.startsWith("https://") || src.startsWith("http://") ? (
                  <Image
                    src={src}
                    alt={`preview ${i}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                  />
                ) : src.startsWith("data:video") ? (
                  <video
                    src={src}
                    muted
                    loop
                    playsInline
                    className="object-cover w-full h-full"
                  />
                ) : (
                  // Fallback for unknown types
                  <div className="w-full h-full bg-cream-300/30 dark:bg-navy-700/40 flex items-center justify-center">
                    <FileImage className="w-6 h-6 text-steel/40 dark:text-sky/30" />
                  </div>
                )}

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(i)} // Pass index to handler
                  disabled={uploading}
                  className="absolute top-1.5 right-1.5 z-10 p-0.5 bg-red-600 hover:bg-red-700 rounded-full text-cream-50 opacity-0 group-hover:opacity-100 transition-all shadow-md disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  aria-label="Remove media"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}