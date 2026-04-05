"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccessToken } from "@/hooks/useAccessToken";
import { useAppSelector } from "@/hooks/useAppSelector";
import { sendMassEmailController } from "@/controllers/admin/sendMassEmailController";
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
} from "lucide-react";
import { toast } from "react-hot-toast";

const recipientOptions = [
  { value: "", label: "All Users", icon: Globe, description: "Send to every registered user" },
  { value: "ACTIVE", label: "Active Users", icon: Users, description: "Users who logged in recently" },
  { value: "ADMIN", label: "Admins Only", icon: ShieldAlert, description: "Administrative accounts only" },
] as const;

export default function MassEmailPage() {
  const router = useRouter();
  const accessToken = useAccessToken();
  const role = useAppSelector((state) => state.auth.role);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipientFilter, setRecipientFilter] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (role !== "ADMIN") {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/40 mb-4">
            <ShieldAlert className="w-7 h-7 text-red-500 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-navy dark:text-cream mb-2">Access Denied</h2>
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

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required.");
      return;
    }
    setSending(true);
    setResult(null);

    const res = await sendMassEmailController(
      { subject, body, recipientFilter: recipientFilter || undefined },
      accessToken!
    );

    setResult(res);
    if (res.success) {
      toast.success(res.message);
      setSubject("");
      setBody("");
      setRecipientFilter("");
    } else {
      toast.error(res.message);
    }
    setSending(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 py-6 relative">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-steel/[0.04] dark:bg-steel/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-[10%] w-80 h-80 bg-sky/[0.05] dark:bg-sky/[0.02] rounded-full blur-[80px]" />
      </div>

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-steel dark:text-sky hover:text-steel-600 dark:hover:text-sky/80 transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-steel to-sky shadow-sm shadow-steel/20 dark:shadow-sky/15">
            <Mail className="w-5 h-5 text-cream-50" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy dark:text-cream">
              Mass Email
            </h1>
            <p className="text-xs text-steel/60 dark:text-sky/40">
              Send emails to all users on the platform
            </p>
          </div>
          <span className="ml-auto px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            ADMIN ONLY
          </span>
        </div>
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-cream-400/30 dark:via-navy-700/40 to-transparent" />
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Recipient Filter */}
        <div className="p-6 rounded-2xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40 space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-navy dark:text-cream">
            <Users className="w-4 h-4 text-steel dark:text-sky" />
            Recipients
          </label>
          <div className="grid grid-cols-3 gap-2">
            {recipientOptions.map((opt) => {
              const isActive = recipientFilter === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRecipientFilter(opt.value)}
                  className={`relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-center transition-all cursor-pointer border ${
                    isActive
                      ? "bg-steel/10 dark:bg-sky/10 border-steel/40 dark:border-sky/40 shadow-sm"
                      : "bg-cream-100/40 dark:bg-navy-700/20 border-cream-300/40 dark:border-navy-700/40 hover:border-steel/20 dark:hover:border-sky/20"
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? "bg-steel/15 dark:bg-sky/15" : "bg-cream-300/30 dark:bg-navy-600/30"}`}>
                    <Icon className={`w-4 h-4 ${isActive ? "text-steel dark:text-sky" : "text-steel/50 dark:text-sky/40"}`} />
                  </div>
                  <span className={`text-xs font-semibold ${isActive ? "text-navy dark:text-cream" : "text-steel/60 dark:text-sky/40"}`}>
                    {opt.label}
                  </span>
                  <span className={`text-[10px] leading-tight ${isActive ? "text-steel/70 dark:text-sky/50" : "text-steel/40 dark:text-sky/25"}`}>
                    {opt.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject */}
        <div className="p-6 rounded-2xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40 space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-navy dark:text-cream">
            <Mail className="w-4 h-4 text-steel dark:text-sky" />
            Subject *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject line"
            className="w-full h-11 px-4 rounded-xl border border-cream-300 dark:border-navy-700 bg-white dark:bg-navy-700/40 text-navy dark:text-cream text-sm placeholder:text-steel/40 dark:placeholder:text-sky/30 focus:outline-none focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all"
          />
        </div>

        {/* Body */}
        <div className="p-6 rounded-2xl bg-cream-50/80 dark:bg-navy-700/30 border border-cream-300/40 dark:border-navy-700/40 space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-navy dark:text-cream">
            Email Body *
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write the email content here... Supports plain text."
            rows={10}
            className="w-full px-4 py-3 rounded-xl border border-cream-300 dark:border-navy-700 bg-white dark:bg-navy-700/40 text-navy dark:text-cream text-sm placeholder:text-steel/40 dark:placeholder:text-sky/30 focus:outline-none focus:ring-2 focus:ring-steel/30 dark:focus:ring-sky/30 focus:border-steel dark:focus:border-sky transition-all resize-none"
          />
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
          disabled={sending || !subject.trim() || !body.trim()}
          className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-cream-50 bg-gradient-to-r from-steel to-steel-600 hover:from-steel-600 hover:to-steel dark:from-sky dark:to-sky/80 dark:hover:from-sky/90 dark:hover:to-sky dark:text-navy shadow-md shadow-steel/20 dark:shadow-sky/15 transition-all cursor-pointer disabled:opacity-50"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Send Mass Email
            </>
          )}
        </button>
      </div>
    </div>
  );
}
