"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { forgotPassword } from "@/services/auth/forgot-password";
import { cn } from "@/lib/utils";

export default function EmailStage({
  email,
  setEmail,
  setStage,
  setMessage,
  setError,
}: {
  email: string;
  setEmail: (email: string) => void;
  setStage: (stage: 1 | 2) => void;
  setMessage: (msg: string) => void;
  setError: (msg: string) => void;
}) {
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }

    const result = await forgotPassword({ email });

    if (result.success) {
      setMessage(result.message || "Check your email for the OTP.");
      setStage(2);
    } else {
      setError(result.message || "Something went wrong.");
    }
  };

  return (
    <form className="my-8 space-y-6" onSubmit={handleEmailSubmit}>
      <div className={cn("flex w-full flex-col space-y-2")}>
        <Label htmlFor="email"
        className="text-sm font-medium text-indigo-900 dark:text-neutral-300">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          className="group/btn relative h-10 w-full rounded-md bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white shadow-lg transition-all hover:brightness-110 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!email || !email.includes("@")}
        >
          Send OTP
        </button>
      </div>
    </form>
  );
}
