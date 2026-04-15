"use client";

import React, { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { BlogRequest, MediaDetailsRequest } from "@/lib/types/createBlog";
import { toast } from "react-hot-toast";
import { generateUploadSignatureController } from "@/controllers/blog/generateBlogUploadSignature";
import { uploadToCloudinary } from "@/services/cloudinary/upload";
import {
  UploadCloud,
  Loader2,
  X,
  FileImage,
  ChevronUp,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

interface UploadError {
  file: File;
  fileName: string;
  error: string;
  index: number; // position in the preview list
}

interface Props<T extends BlogRequest> {
  accessToken: string | null;
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  onUploadErrorChange?: (hasErrors: boolean) => void;
}

export default function BlogMediaUpload<T extends BlogRequest>({
  accessToken,
  formData,
  setFormData,
  onUploadErrorChange,
}: Props<T>) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previews, setPreviews] = useState<string[]>(
    () => formData.mediaDetails?.map((m) => m.url) ?? []
  );
  const [uploading, setUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<UploadError[]>([]);

  const updateErrors = useCallback(
    (errors: UploadError[]) => {
      setUploadErrors(errors);
      onUploadErrorChange?.(errors.length > 0);
    },
    [onUploadErrorChange]
  );

  const reindexPositions = useCallback(
    (details: MediaDetailsRequest[]): MediaDetailsRequest[] =>
      details.map((item, i) => ({ ...item, position: i })),
    []
  );

  // ── Upload files ──────────────────────────────────────────────
  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!accessToken || files.length === 0) return;

      setUploading(true);
      const newErrors: UploadError[] = [];

      try {
        const response = await generateUploadSignatureController(accessToken, {
          fileNames: files.map((f) => f.name),
        });

        if (!response.success || !response.data) {
          throw new Error("Failed to get upload signatures");
        }

        const signatures = response.data.signatures;
        const newMedia: MediaDetailsRequest[] = [];
        const newPreviews: string[] = [];
        const existingCount = formData.mediaDetails?.length ?? 0;

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

          if (!result.success || !result.data) {
            newErrors.push({
              file,
              fileName: file.name,
              error: result.error ?? "Upload failed",
              index: existingCount + i,
            });
            continue;
          }

          newPreviews.push(result.data.secure_url);
          newMedia.push({
            // mediaId intentionally omitted — backend treats null/undefined as new media
            url: result.data.secure_url,
            mediaType: "IMAGE",
            position: existingCount + newMedia.length,
            width: result.data.width,
            height: result.data.height,
            fileSizeKb: Math.round(result.data.bytes / 1024),
            durationSeconds: null,
            extraMetadata: {
              format: result.data.format,
              publicId: result.data.public_id,
            },
          });
        }

        if (newMedia.length > 0) {
          setFormData((prev) => ({
            ...prev,
            mediaDetails: reindexPositions([
              ...(prev.mediaDetails ?? []),
              ...newMedia,
            ]),
          }));
          setPreviews((prev) => [...prev, ...newPreviews]);
          toast.success(`${newMedia.length} file(s) uploaded`);
        }

        if (newErrors.length > 0) {
          setUploadErrors((prev) => {
            const merged = [...prev, ...newErrors];
            onUploadErrorChange?.(merged.length > 0);
            return merged;
          });
          toast.error(`${newErrors.length} file(s) failed to upload`);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Upload failed";
        // All files failed at signature stage
        files.forEach((file, i) => {
          newErrors.push({
            file,
            fileName: file.name,
            error: msg,
            index: (formData.mediaDetails?.length ?? 0) + i,
          });
        });
        setUploadErrors((prev) => {
          const merged = [...prev, ...newErrors];
          onUploadErrorChange?.(merged.length > 0);
          return merged;
        });
        toast.error(msg);
      } finally {
        setUploading(false);
      }
    },
    [accessToken, formData.mediaDetails, setFormData, reindexPositions, onUploadErrorChange]
  );

  // ── File input handler ────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    // Reset input so re-selecting same files works
    e.target.value = "";
    await uploadFiles(files);
  };

  // ── Retry a failed upload ────────────────────────────────────
  const retryUpload = useCallback(
    async (errorIndex: number) => {
      const errorItem = uploadErrors[errorIndex];
      if (!errorItem) return;
      // Remove from errors before retrying
      const remaining = uploadErrors.filter((_, i) => i !== errorIndex);
      updateErrors(remaining);
      await uploadFiles([errorItem.file]);
    },
    [uploadErrors, updateErrors, uploadFiles]
  );

  // ── Remove media ──────────────────────────────────────────────
  const handleRemoveMedia = (indexToRemove: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
    setFormData((prev) => ({
      ...prev,
      mediaDetails: reindexPositions(
        (prev.mediaDetails ?? []).filter((_, i) => i !== indexToRemove)
      ),
    }));
    toast.success("Media removed.");
  };

  // ── Reorder media ─────────────────────────────────────────────
  const moveMedia = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const media = [...(formData.mediaDetails ?? [])];
    if (targetIndex < 0 || targetIndex >= media.length) return;

    // Swap media
    [media[index], media[targetIndex]] = [media[targetIndex], media[index]];

    // Swap previews
    setPreviews((prev) => {
      const updated = [...prev];
      [updated[index], updated[targetIndex]] = [
        updated[targetIndex],
        updated[index],
      ];
      return updated;
    });

    setFormData((prev) => ({
      ...prev,
      mediaDetails: reindexPositions(media),
    }));
  };

  const mediaCount = formData.mediaDetails?.length ?? 0;

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

      {/* ── Upload Errors ──────────────────────────────────────── */}
      {uploadErrors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {uploadErrors.length} file(s) failed to upload:
          </p>
          {uploadErrors.map((err, i) => (
            <div
              key={`${err.fileName}-${i}`}
              className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-900/30"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-red-700 dark:text-red-300 truncate">
                  {err.fileName}
                </p>
                <p className="text-xs text-red-500/80 dark:text-red-400/70">
                  {err.error}
                </p>
              </div>
              <button
                type="button"
                onClick={() => retryUpload(i)}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                Retry
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Previews with Reorder ──────────────────────────────── */}
      {previews.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-heading mb-3">
            Media ({mediaCount} file{mediaCount !== 1 ? "s" : ""})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {previews.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="relative group aspect-square rounded-xl overflow-hidden border border-border-default"
              >
                {src.startsWith("data:image") || src.startsWith("http") ? (
                  <Image
                    src={src}
                    alt={`media ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  />
                ) : (
                  <div className="w-full h-full bg-cream-300/30 dark:bg-navy-700/40 flex items-center justify-center">
                    <FileImage className="w-6 h-6 text-steel/40 dark:text-sky/30" />
                  </div>
                )}

                {/* Position badge */}
                <span className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-black/60 text-white">
                  {i + 1}
                </span>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveMedia(i)}
                  disabled={uploading}
                  className="absolute top-1.5 right-1.5 z-10 p-0.5 bg-red-600 hover:bg-red-700 rounded-full text-cream-50 opacity-0 group-hover:opacity-100 transition-all shadow-md disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  aria-label="Remove media"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Reorder controls */}
                <div className="absolute bottom-1.5 right-1.5 z-10 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    type="button"
                    onClick={() => moveMedia(i, "up")}
                    disabled={i === 0 || uploading}
                    className="p-0.5 rounded bg-black/60 hover:bg-black/80 text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    aria-label="Move left"
                  >
                    <ChevronUp className="w-3.5 h-3.5 -rotate-90" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveMedia(i, "down")}
                    disabled={i === mediaCount - 1 || uploading}
                    className="p-0.5 rounded bg-black/60 hover:bg-black/80 text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    aria-label="Move right"
                  >
                    <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
