"use client";
import React, { useRef, useState } from "react";
import Image from "next/image";
import { PostCreateRequestDTO, MediaUploadRequestDTO } from "@/lib/types/post";
import { toast } from "react-hot-toast";
import { generateUploadSignatureController } from "@/controllers/postController/uploadSignature";
import { uploadToCloudinary } from "@/services/cloudinary/upload";

interface Props {
  accessToken: string | null;
  formData: PostCreateRequestDTO;
  setFormData: React.Dispatch<React.SetStateAction<PostCreateRequestDTO>>;
}

export default function MediaUpload({ accessToken, formData, setFormData }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !accessToken) return;

    const files = Array.from(e.target.files);

    // Previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setMediaPreview(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });

    try {
      setUploading(true);
      // Get upload signatures
      const response = await generateUploadSignatureController(accessToken, { fileNames: files.map(f => f.name) });
      if (!response.success || !response.data) throw new Error("Failed to get upload signature");

      const signatures = response.data.data.signatures;

      const newMediaDetails: MediaUploadRequestDTO[] = [];
      const existingLength = formData.mediaDetails?.length || 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sig = signatures[i];
        const result = await uploadToCloudinary(file, sig.cloudName, sig.signature, sig.timestamp, sig.apiKey, sig.folder, sig.publicId);
        if (!result.success || !result.data) continue;

        newMediaDetails.push({
          url: result.data.secure_url,
          mediaType: "IMAGE",
          position: existingLength + i,
          width: result.data.width,
          height: result.data.height,
          fileSizeKb: Math.round(result.data.bytes / 1024),
          durationSeconds: result.data.duration || null,
          extraMetadata: { format: result.data.format, publicId: result.data.public_id },
        });
      }

      setFormData(prev => ({
        ...prev,
        mediaDetails: [...(prev.mediaDetails || []), ...newMediaDetails]
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

  return (
    <div>
      <input type="file" ref={fileInputRef} multiple onChange={handleFileChange} className="sr-only" />
      <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-600 text-white rounded">
        Upload Media
      </button>
      <div className="flex gap-2 mt-2 overflow-x-auto">
        {mediaPreview.map((src, i) => (
          <Image key={i} src={src} alt={`preview ${i}`} width={80} height={80} className="rounded" />
        ))}
      </div>
      {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
    </div>
  );
}
