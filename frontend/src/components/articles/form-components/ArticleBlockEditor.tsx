"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import NextImage from "next/image";
import { BlogRequest, MediaDetailsRequest } from "@/lib/types/createBlog";
import { toast } from "react-hot-toast";
import { generateUploadSignatureController } from "@/controllers/blog/generateBlogUploadSignature";
import { uploadToCloudinary } from "@/services/cloudinary/upload";
import {
  Plus,
  ImageIcon,
  Loader2,
  Trash2,
  Type,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

// ── Block types ─────────────────────────────────────────────
export type ContentBlock =
  | { type: "text"; id: string; content: string }
  | { type: "image"; id: string; mediaIndex: number; url: string; width?: number; height?: number };

// ── Marker format used in the body string ───────────────────
const IMG_MARKER_RE = /\{\{img:(\d+)\}\}/g;

/** Serialize blocks → body string + mediaDetails array */
export function serializeBlocks(
  blocks: ContentBlock[],
  existingMedia: MediaDetailsRequest[]
): { body: string; mediaDetails: MediaDetailsRequest[] } {
  const bodyParts: string[] = [];
  const orderedMedia: MediaDetailsRequest[] = [];
  let mediaPosition = 0;

  for (const block of blocks) {
    if (block.type === "text") {
      const trimmed = block.content.trim();
      if (trimmed) bodyParts.push(trimmed);
    } else {
      bodyParts.push(`{{img:${mediaPosition}}}`);
      const existing = existingMedia.find((m) => m.url === block.url);
      if (existing) {
        orderedMedia.push({ ...existing, position: mediaPosition });
      }
      mediaPosition++;
    }
  }

  return {
    body: bodyParts.join("\n\n"),
    mediaDetails: orderedMedia,
  };
}

/** Deserialize body string + mediaDetails → blocks */
export function deserializeBlocks(
  body: string,
  media: MediaDetailsRequest[]
): ContentBlock[] {
  const sortedMedia = [...media].sort((a, b) => a.position - b.position);

  if (IMG_MARKER_RE.test(body)) {
    IMG_MARKER_RE.lastIndex = 0;
    const blocks: ContentBlock[] = [];
    let lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = IMG_MARKER_RE.exec(body)) !== null) {
      const textBefore = body.slice(lastIndex, match.index).trim();
      if (textBefore) {
        blocks.push({ type: "text", id: genId(), content: textBefore });
      }
      const imgIdx = parseInt(match[1], 10);
      const m = sortedMedia[imgIdx];
      if (m) {
        blocks.push({
          type: "image",
          id: genId(),
          mediaIndex: imgIdx,
          url: m.url,
          width: m.width,
          height: m.height,
        });
      }
      lastIndex = match.index + match[0].length;
    }
    const remaining = body.slice(lastIndex).trim();
    if (remaining) {
      blocks.push({ type: "text", id: genId(), content: remaining });
    }
    if (blocks.length === 0 || blocks[blocks.length - 1].type !== "text") {
      blocks.push({ type: "text", id: genId(), content: "" });
    }
    return blocks;
  }

  if (sortedMedia.length === 0) {
    return [{ type: "text", id: genId(), content: body }];
  }

  const paragraphs = body.split(/\n\n+/).filter((p) => p.trim());
  const blocks: ContentBlock[] = [];
  const imageCount = sortedMedia.length;
  const totalSections = imageCount + 1;
  const parasPerSection = Math.max(1, Math.floor(paragraphs.length / totalSections));

  for (let i = 0; i < totalSections; i++) {
    const start = i * parasPerSection;
    const end = i === totalSections - 1 ? paragraphs.length : start + parasPerSection;
    const chunk = paragraphs.slice(start, end).join("\n\n");
    if (chunk.trim()) {
      blocks.push({ type: "text", id: genId(), content: chunk });
    }
    if (i < imageCount) {
      blocks.push({
        type: "image",
        id: genId(),
        mediaIndex: i,
        url: sortedMedia[i].url,
        width: sortedMedia[i].width,
        height: sortedMedia[i].height,
      });
    }
  }

  for (let i = blocks.filter((b) => b.type === "image").length; i < imageCount; i++) {
    blocks.push({
      type: "image",
      id: genId(),
      mediaIndex: i,
      url: sortedMedia[i].url,
      width: sortedMedia[i].width,
      height: sortedMedia[i].height,
    });
  }

  if (blocks.length === 0 || blocks[blocks.length - 1].type !== "text") {
    blocks.push({ type: "text", id: genId(), content: "" });
  }

  return blocks;
}

let _idCounter = 0;
function genId() {
  return `blk_${Date.now()}_${++_idCounter}`;
}

// ── Props ───────────────────────────────────────────────────
interface ArticleBlockEditorProps {
  accessToken: string | null;
  formData: BlogRequest;
  setFormData: React.Dispatch<React.SetStateAction<BlogRequest>>;
  onUploadErrorChange?: (hasErrors: boolean) => void;
}

export default function ArticleBlockEditor({
  accessToken,
  formData,
  setFormData,
  onUploadErrorChange,
}: ArticleBlockEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(() =>
    deserializeBlocks(formData.body, formData.mediaDetails ?? [])
  );
  const [uploading, setUploading] = useState(false);
  const [, setUploadingBlockId] = useState<string | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [activeInsertIdx, setActiveInsertIdx] = useState<number | null>(null);
  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const insertAfterIdxRef = useRef<number>(0);

  // Ref to hold the latest mediaDetails for the sync effect
  const mediaRef = useRef(formData.mediaDetails ?? []);
  mediaRef.current = formData.mediaDetails ?? [];

  // Skip the initial render for the sync effect
  const isInitialMount = useRef(true);

  // Sync blocks → formData via useEffect (avoids setState-in-render)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const { body, mediaDetails } = serializeBlocks(blocks, mediaRef.current);
    setFormData((prev) => {
      if (prev.body === body && prev.mediaDetails === mediaDetails) return prev;
      return { ...prev, body, mediaDetails };
    });
  }, [blocks, setFormData]);

  // ── Text block change ──────────────────────────────────────
  const handleTextChange = useCallback(
    (blockId: string, content: string) => {
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === blockId && b.type === "text" ? { ...b, content } : b
        )
      );
    },
    []
  );

  // ── Auto-resize textarea ───────────────────────────────────
  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // ── Insert image trigger ───────────────────────────────────
  const triggerImageUpload = useCallback((insertAfterIdx: number) => {
    insertAfterIdxRef.current = insertAfterIdx;
    fileInputRef.current?.click();
  }, []);

  // ── Handle file selected ───────────────────────────────────
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !accessToken) return;
      const file = e.target.files[0];
      e.target.value = "";
      if (!file) return;

      const insertIdx = insertAfterIdxRef.current;

      const placeholderId = genId();
      setUploading(true);
      setUploadingBlockId(placeholderId);
      setActiveInsertIdx(null);

      setBlocks((prev) => {
        const updated = [...prev];
        const placeholderBlock: ContentBlock = {
          type: "image",
          id: placeholderId,
          mediaIndex: -1,
          url: "",
          width: 0,
          height: 0,
        };
        updated.splice(insertIdx + 1, 0, placeholderBlock);
        if (
          insertIdx + 2 >= updated.length ||
          updated[insertIdx + 2]?.type !== "text"
        ) {
          updated.splice(insertIdx + 2, 0, {
            type: "text",
            id: genId(),
            content: "",
          });
        }
        return updated;
      });

      try {
        const sigResponse = await generateUploadSignatureController(accessToken, {
          fileNames: [file.name],
        });

        if (!sigResponse.success || !sigResponse.data) {
          throw new Error("Failed to get upload signature");
        }

        const sig = sigResponse.data.signatures[0];
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
          throw new Error(result.error ?? "Upload failed");
        }

        const newMediaDetail: MediaDetailsRequest = {
          url: result.data.secure_url,
          mediaType: "IMAGE",
          position: 0,
          width: result.data.width,
          height: result.data.height,
          fileSizeKb: Math.round(result.data.bytes / 1024),
          durationSeconds: null,
          extraMetadata: {
            format: result.data.format,
            publicId: result.data.public_id,
          },
        };

        // Add media to the ref so next sync picks it up
        mediaRef.current = [...mediaRef.current, newMediaDetail];

        // Also push it into formData directly so it persists
        setFormData((prevForm) => ({
          ...prevForm,
          mediaDetails: [...(prevForm.mediaDetails ?? []), newMediaDetail],
        }));

        // Update the placeholder block with real data
        setBlocks((prev) =>
          prev.map((b) =>
            b.id === placeholderId
              ? {
                  ...b,
                  url: result.data!.secure_url,
                  width: result.data!.width,
                  height: result.data!.height,
                  mediaIndex: 0,
                } as ContentBlock
              : b
          )
        );

        toast.success("Image uploaded");
      } catch (err) {
        setBlocks((prev) => prev.filter((b) => b.id !== placeholderId));
        toast.error(err instanceof Error ? err.message : "Upload failed");
        onUploadErrorChange?.(true);
      } finally {
        setUploading(false);
        setUploadingBlockId(null);
      }
    },
    [accessToken, setFormData, onUploadErrorChange]
  );

  // ── Remove image block ─────────────────────────────────────
  const removeImageBlock = useCallback(
    (blockId: string) => {
      setBlocks((prev) => {
        const block = prev.find((b) => b.id === blockId);
        if (!block || block.type !== "image") return prev;

        // Remove from media ref
        mediaRef.current = mediaRef.current.filter((m) => m.url !== block.url);
        setFormData((prevForm) => ({
          ...prevForm,
          mediaDetails: (prevForm.mediaDetails ?? []).filter((m) => m.url !== block.url),
        }));

        return prev.filter((b) => b.id !== blockId);
      });
      toast.success("Image removed");
    },
    [setFormData]
  );

  // ── Move block ─────────────────────────────────────────────
  const moveBlock = useCallback(
    (blockId: string, direction: "up" | "down") => {
      setBlocks((prev) => {
        const idx = prev.findIndex((b) => b.id === blockId);
        if (idx === -1) return prev;
        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= prev.length) return prev;

        const updated = [...prev];
        [updated[idx], updated[targetIdx]] = [updated[targetIdx], updated[idx]];
        return updated;
      });
    },
    []
  );

  // ── Handle Enter key to split text blocks ──────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>, blockId: string) => {
      if (e.key === "Enter" && !e.shiftKey) {
        const textarea = e.currentTarget;
        const { selectionStart, value } = textarea;
        const before = value.slice(0, selectionStart);
        const after = value.slice(selectionStart);

        if (before.endsWith("\n")) {
          e.preventDefault();
          const newBlockId = genId();
          setBlocks((prev) => {
            const idx = prev.findIndex((b) => b.id === blockId);
            if (idx === -1) return prev;
            const updated = [...prev];
            updated[idx] = { ...updated[idx], content: before.slice(0, -1) } as ContentBlock;
            updated.splice(idx + 1, 0, {
              type: "text",
              id: newBlockId,
              content: after,
            });
            return updated;
          });
          setTimeout(() => {
            const el = textareaRefs.current.get(newBlockId);
            if (el) {
              el.focus();
              el.setSelectionRange(0, 0);
            }
          }, 0);
        }
      }

      if (e.key === "Backspace") {
        const textarea = e.currentTarget;
        if (textarea.selectionStart === 0 && textarea.selectionEnd === 0) {
          setBlocks((prev) => {
            const idx = prev.findIndex((b) => b.id === blockId);
            if (idx <= 0) return prev;
            const currentBlock = prev[idx];
            if (currentBlock.type !== "text") return prev;

            if (!currentBlock.content) {
              e.preventDefault();
              const updated = prev.filter((_, i) => i !== idx);
              const prevTextBlock = [...updated].reverse().find(
                (b, i) => b.type === "text" && updated.length - 1 - i < idx
              );
              if (prevTextBlock) {
                setTimeout(() => {
                  const el = textareaRefs.current.get(prevTextBlock.id);
                  if (el) {
                    el.focus();
                    el.setSelectionRange(el.value.length, el.value.length);
                  }
                }, 0);
              }
              return updated;
            }

            const prevBlock = prev[idx - 1];
            if (prevBlock.type === "text") {
              e.preventDefault();
              const mergedContent = prevBlock.content + currentBlock.content;
              const cursorPos = prevBlock.content.length;
              const updated = prev.filter((_, i) => i !== idx);
              updated[idx - 1] = { ...prevBlock, content: mergedContent };
              setTimeout(() => {
                const el = textareaRefs.current.get(prevBlock.id);
                if (el) {
                  el.focus();
                  el.setSelectionRange(cursorPos, cursorPos);
                }
              }, 0);
              return updated;
            }
            return prev;
          });
        }
      }
    },
    []
  );

  // Auto-resize on mount/change
  useEffect(() => {
    textareaRefs.current.forEach((el) => autoResize(el));
  }, [blocks, autoResize]);

  // ── Word/char count (text blocks only) ─────────────────────
  const allText = blocks
    .filter((b): b is ContentBlock & { type: "text" } => b.type === "text")
    .map((b) => b.content)
    .join(" ");
  const wordCount = allText.trim() ? allText.trim().split(/\s+/).length : 0;
  const charCount = allText.length;
  const imageCount = blocks.filter((b) => b.type === "image").length;

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="sr-only"
        accept="image/png,image/jpeg,image/jpg"
        disabled={uploading}
      />

      {/* Editor area */}
      <div className="relative min-h-[300px]">
        {blocks.map((block, idx) => (
          <React.Fragment key={block.id}>
            {/* Insert line at top */}
            {idx === 0 && (
              <InsertLine
                idx={0}
                isActive={activeInsertIdx === 0}
                onToggle={() => setActiveInsertIdx(activeInsertIdx === 0 ? null : 0)}
                onInsertImage={() => triggerImageUpload(-1)}
                onInsertText={() => {
                  const newId = genId();
                  setBlocks((prev) => {
                    const updated = [...prev];
                    updated.splice(0, 0, { type: "text", id: newId, content: "" });
                    return updated;
                  });
                  setActiveInsertIdx(null);
                  setTimeout(() => {
                    const el = textareaRefs.current.get(newId);
                    el?.focus();
                  }, 0);
                }}
                uploading={uploading}
              />
            )}

            {/* ── Text Block ── */}
            {block.type === "text" && (
              <div className="relative">
                <textarea
                  ref={(el) => {
                    if (el) {
                      textareaRefs.current.set(block.id, el);
                      autoResize(el);
                    } else {
                      textareaRefs.current.delete(block.id);
                    }
                  }}
                  value={block.content}
                  onChange={(e) => {
                    handleTextChange(block.id, e.target.value);
                    autoResize(e.target);
                  }}
                  onFocus={() => setFocusedBlockId(block.id)}
                  onBlur={() => setFocusedBlockId(null)}
                  onKeyDown={(e) => handleKeyDown(e, block.id)}
                  placeholder={
                    idx === 0
                      ? "Tell your story..."
                      : "Continue writing..."
                  }
                  className="w-full resize-none border-0 bg-transparent text-navy/85 dark:text-cream/85 placeholder:text-faint focus:ring-0 focus:outline-none font-display text-[18px] sm:text-[20px] leading-[1.8] py-2"
                  style={{ minHeight: "2.5em", overflow: "hidden" }}
                />
              </div>
            )}

            {/* ── Image Block ── */}
            {block.type === "image" && (
              <div className="group relative my-8 -mx-4 sm:mx-0">
                {block.url ? (
                  <div className="relative overflow-hidden rounded-none sm:rounded-2xl bg-navy/[0.03] dark:bg-cream/[0.03]">
                    <NextImage
                      src={block.url}
                      alt="Article image"
                      width={block.width || 800}
                      height={block.height || 500}
                      className="w-full h-auto"
                    />
                    {/* Overlay controls */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        type="button"
                        onClick={() => moveBlock(block.id, "up")}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 disabled:opacity-30 transition-all cursor-pointer"
                        title="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(block.id, "down")}
                        disabled={idx === blocks.length - 1}
                        className="p-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 disabled:opacity-30 transition-all cursor-pointer"
                        title="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImageBlock(block.id)}
                        className="p-1.5 rounded-lg bg-red-600/80 backdrop-blur-sm text-white hover:bg-red-600 transition-all cursor-pointer"
                        title="Remove image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 rounded-none sm:rounded-2xl border-2 border-dashed border-steel/15 dark:border-sky/10 bg-navy/[0.02] dark:bg-cream/[0.02]">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-muted" />
                      <span className="text-sm text-muted">Uploading image...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Insert line after block */}
            <InsertLine
              idx={idx + 1}
              isActive={activeInsertIdx === idx + 1}
              onToggle={() =>
                setActiveInsertIdx(activeInsertIdx === idx + 1 ? null : idx + 1)
              }
              onInsertImage={() => triggerImageUpload(idx)}
              onInsertText={() => {
                const newId = genId();
                setBlocks((prev) => {
                  const updated = [...prev];
                  updated.splice(idx + 1, 0, {
                    type: "text",
                    id: newId,
                    content: "",
                  });
                  return updated;
                });
                setActiveInsertIdx(null);
                setTimeout(() => {
                  const el = textareaRefs.current.get(newId);
                  el?.focus();
                }, 0);
              }}
              uploading={uploading}
            />
          </React.Fragment>
        ))}
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between pt-6 pb-2 text-xs text-muted">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span>{charCount.toLocaleString()} chars</span>
          <span>
            {imageCount} image{imageCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 text-faint">
          <span>**bold** · *italic* · # heading</span>
        </div>
      </div>
    </div>
  );
}

// ── Insert Line Component ────────────────────────────────────
function InsertLine({
  idx,
  isActive,
  onToggle,
  onInsertImage,
  onInsertText,
  uploading,
}: {
  idx: number;
  isActive: boolean;
  onToggle: () => void;
  onInsertImage: () => void;
  onInsertText: () => void;
  uploading: boolean;
}) {
  return (
    <div className="relative flex items-center justify-center group/insert py-1">
      <div className="absolute inset-x-0 top-1/2 h-px bg-transparent group-hover/insert:bg-border-subtle transition-colors" />

      <button
        type="button"
        onClick={onToggle}
        disabled={uploading}
        className={`relative z-10 flex items-center justify-center w-7 h-7 rounded-full border transition-all duration-200 cursor-pointer ${
          isActive
            ? "border-steel/40 dark:border-sky/30 bg-cream-50 dark:bg-navy-700 text-steel dark:text-sky rotate-45 scale-110"
            : "border-transparent text-transparent group-hover/insert:border-steel/15 group-hover/insert:dark:border-sky/10 group-hover/insert:text-muted hover:border-steel/40 hover:dark:border-sky/30 hover:text-steel hover:dark:text-sky"
        }`}
      >
        <Plus className="w-4 h-4" />
      </button>

      {isActive && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-30 flex items-center gap-1 p-1 rounded-xl bg-cream-50 dark:bg-navy-700 border border-border-default shadow-lg shadow-black/[0.06] dark:shadow-black/20">
          <button
            type="button"
            onClick={onInsertImage}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-sub hover:text-heading hover:bg-surface-hover transition-colors cursor-pointer disabled:opacity-40"
          >
            <ImageIcon className="w-4 h-4" />
            <span>Image</span>
          </button>
          <div className="w-px h-6 bg-border-default" />
          <button
            type="button"
            onClick={onInsertText}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-sub hover:text-heading hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <Type className="w-4 h-4" />
            <span>Text</span>
          </button>
        </div>
      )}
    </div>
  );
}
