"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useAppSelector } from "@/hooks/useAppSelector";
import { sendMassEmailController } from "@/controllers/admin/sendMassEmailController";
import dynamic from "next/dynamic";
import {
  Mail,
  ArrowLeft,
  Send,
  Loader2,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  Users,
  Globe,
  Paperclip,
  X,
  FileIcon,
} from "lucide-react";
import { toast } from "react-hot-toast";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const ALL_ROLES = ["USER", "MODERATOR", "ADMIN"];

const recipientOptions = [
  { roles: ["USER", "MODERATOR", "ADMIN"], label: "All Users", icon: Globe, description: "Send to every registered user" },
  { roles: ["USER"], label: "Users Only", icon: Users, description: "Standard user accounts" },
  { roles: ["ADMIN"], label: "Admins Only", icon: ShieldAlert, description: "Administrative accounts only" },
] as const;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MassEmailPage() {
  const router = useRouter();
  const accessToken = useAccessToken();
  const role = useAppSelector((state) => state.auth.role);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [targetRoles, setTargetRoles] = useState<string[]>(ALL_ROLES);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        ["link", "image"],
        ["clean"],
      ],
    }),
    []
  );

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "align",
    "blockquote",
    "code-block",
    "link",
    "image",
  ];

  if (role !== "ADMIN") {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/40 mb-4">
            <ShieldAlert className="w-7 h-7 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-heading mb-2">Access Denied</h2>
          <p className="text-sm text-steel/60 dark:text-sky/40 mb-6">
            You need admin privileges to access this page.
          </p>
          <button
            onClick={() => router.push("/feed")}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-steel text-cream-50 dark:bg-sky dark:text-navy cursor-pointer"
          >
            Go to Feed
          </button>
        </div>
      </div>
    );
  }

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    setAttachments((prev) => [...prev, ...newFiles]);
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Strip HTML tags to check if body has content
  const isBodyEmpty = !body || body.replace(/<[^>]*>/g, "").trim().length === 0;

  const handleSend = async () => {
    if (!subject.trim() || isBodyEmpty) {
      toast.error("Subject and body are required.");
      return;
    }
    setSending(true);
    setResult(null);

    const res = await sendMassEmailController(
      {
        subject,
        body,
        targetRoles,
        attachments: attachments.length > 0 ? attachments : undefined,
      },
      accessToken!
    );

    setResult(res);
    if (res.success) {
      toast.success(res.message);
      setSubject("");
      setBody("");
      setTargetRoles(ALL_ROLES);
      setAttachments([]);
    } else {
      toast.error(res.message);
    }
    setSending(false);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="pt-6 pb-5 px-1">
        <h1 className="text-2xl font-display font-bold text-heading tracking-tight">
          Mass Email
        </h1>
        <p className="mt-1 text-sm text-steel/50 dark:text-sky/35">
          Send emails to all users on the platform
        </p>
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Recipient Filter */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-heading">
            Recipients
          </label>
          <div className="inline-flex p-1 rounded-full bg-cream-300/50 dark:bg-navy-700/50">
            {recipientOptions.map((opt) => {
              const isActive = JSON.stringify(targetRoles) === JSON.stringify(opt.roles);
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setTargetRoles([...opt.roles])}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-navy text-cream dark:bg-cream dark:text-navy shadow-sm"
                      : "text-navy/50 dark:text-cream/50 hover:text-navy dark:hover:text-cream"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-heading">
            Subject *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject line"
            className="w-full h-10 px-4 rounded-xl bg-cream-300/30 dark:bg-navy-700/30 border-0 text-heading text-sm placeholder:text-steel/40 dark:placeholder:text-sky/25 focus:outline-none focus:ring-2 focus:ring-steel/20 dark:focus:ring-sky/20 transition-all"
          />
        </div>

        {/* Body — Rich Text Editor */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-heading">
            Email Body *
          </label>
          <div className="quill-wrapper rounded-2xl overflow-hidden bg-cream-300/20 dark:bg-navy-700/20">
            <ReactQuill
              theme="snow"
              value={body}
              onChange={setBody}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Write the email content here..."
              className="[&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-cream-300/40 dark:[&_.ql-toolbar]:border-navy-700/40 [&_.ql-toolbar]:bg-cream-300/20 dark:[&_.ql-toolbar]:bg-navy-700/20 [&_.ql-container]:border-none [&_.ql-container]:min-h-[200px] [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-sm [&_.ql-editor]:text-navy dark:[&_.ql-editor]:text-cream [&_.ql-editor.ql-blank::before]:text-steel/40 dark:[&_.ql-editor.ql-blank::before]:text-sky/25"
            />
          </div>
        </div>

        {/* Attachments */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-heading">
            <Paperclip className="w-4 h-4 text-steel dark:text-sky" />
            Attachments
          </label>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileAdd}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-dashed border-cream-400 dark:border-navy-600 bg-cream-100/40 dark:bg-navy-700/20 text-steel dark:text-sky/60 hover:border-steel/30 dark:hover:border-sky/30 hover:bg-cream-200/40 dark:hover:bg-navy-600/20 transition-all cursor-pointer"
          >
            <Paperclip className="w-3.5 h-3.5" />
            Add Files
          </button>

          {attachments.length > 0 && (
            <div className="space-y-2 mt-2">
              {attachments.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-cream-100/60 dark:bg-navy-600/20 border border-border-subtle"
                >
                  <FileIcon className="w-4 h-4 text-steel/50 dark:text-sky/40 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-heading truncate">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-steel/50 dark:text-sky/35">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-100/50 dark:hover:bg-red-900/20 text-steel/40 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Result message */}
        {result && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${
            result.success
              ? "bg-steel/5 dark:bg-sky/5 border border-steel/15 dark:border-sky/15"
              : "bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-900/30"
          }`}>
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-steel dark:text-sky shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            )}
            <p className={`text-sm font-medium ${result.success ? "text-steel dark:text-sky" : "text-red-600 dark:text-red-400"}`}>
              {result.message}
            </p>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={sending || !subject.trim() || isBodyEmpty}
          className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold text-cream-50 bg-navy hover:bg-navy/80 dark:bg-cream dark:text-navy dark:hover:bg-cream/80 transition-all cursor-pointer disabled:opacity-50"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Send Mass Email
              {attachments.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-cream-50/20 dark:bg-navy/20">
                  {attachments.length} file{attachments.length > 1 ? "s" : ""}
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
