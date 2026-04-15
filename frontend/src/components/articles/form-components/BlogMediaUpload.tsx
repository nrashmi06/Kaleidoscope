"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { BlogRequest, MediaDetailsRequest } from "@/lib/types/createBlog";
import { toast } from "react-hot-toast";
import { generateUploadSignatureController } from "@/controllers/blog/generateBlogUploadSignature";
import { uploadToCloudinary } from "@/services/cloudinary/upload";
import { UploadCloud, Loader2, X, FileImage } from "lucide-react";

interface Props<T extends BlogRequest> {
  accessToken: string | null;
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
}

export default function BlogMediaUpload<T extends BlogRequest>({
  accessToken,
  formData,
  setFormData,
}: Props<T>) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !accessToken) return;

    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setMediaPreview((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });

    try {
      setUploading(true);
      const response = await generateUploadSignatureController(accessToken, {
        fileNames: files.map((f) => f.name),
      });

      if (!response.success || !response.data)
        throw new Error("Failed to get upload signature");

      const signatures = response.data.signatures;
      const newMediaDetails: MediaDetailsRequest[] = [];
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
          mediaId: Date.now() + i,
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

  const handleRemoveMedia = async (indexToRemove: number) => {
    setMediaPreview((prev) => prev.filter((_, i) => i !== indexToRemove));

    setFormData((prev) => ({
      ...prev,
      mediaDetails: (prev.mediaDetails || [])
        .filter((_, i) => i !== indexToRemove)
        .map((item, newIndex) => ({
          ...item,
          position: newIndex,
        })),
    }));

    toast.success("Media removed.");
  };

  return (
    <div className="w-full space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        className="sr-only"
        id="blog-file-upload"
        accept="image/*"
        disabled={uploading}
      />

      <label
        htmlFor="blog-file-upload"
        className={`flex flex-col items-center justify-center w-full p-8 py-10 border-2 border-dashed rounded-xl transition-colors ${
          uploading
            ? "border-cream-300/40 bg-cream-50/50 dark:border-navy-700/40 dark:bg-navy-700/30"
            : "border-cream-400 dark:border-navy-600 cursor-pointer hover:border-steel/50 hover:bg-steel/5 dark:hover:border-sky/40 dark:hover:bg-sky/5"
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-8 h-8 mb-3 text-steel dark:text-sky animate-spin" />
            <span className="font-medium text-heading">
              Uploading files...
            </span>
            <span className="text-sm text-steel/60 dark:text-sky/50">
              Please wait.
            </span>
          </>
        ) : (
          <>
            <UploadCloud className="w-8 h-8 mb-3 text-steel/50 dark:text-sky/40" />
            <span className="font-medium text-heading">
              Click to upload or drag and drop
            </span>
            <span className="text-sm text-steel/60 dark:text-sky/50">
              PNG, JPG or JPEG
            </span>
          </>
        )}
      </label>

      {mediaPreview.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-heading mb-3">
            Previews
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {mediaPreview.map((src, i) => (
              <div
                key={i}
                className="relative group aspect-square rounded-xl overflow-hidden border border-border-default"
              >
                {src.startsWith("data:image") || src.startsWith("http") ? (
                  <Image
                    src={src}
                    alt={`preview ${i}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
                  />
                ) : (
                  <div className="w-full h-full bg-cream-300/30 dark:bg-navy-700/40 flex items-center justify-center">
                    <FileImage className="w-6 h-6 text-steel/40 dark:text-sky/30" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveMedia(i)}
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
