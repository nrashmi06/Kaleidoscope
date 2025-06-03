"use client";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/services/auth/reset-password";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";

export default function ResetStage({
  otp,
  setOtp,
  newPassword,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  setStage,
  setMessage,
  setError,
}: {
  otp: string[];
  setOtp: (otp: string[]) => void;
  newPassword: string;
  setPassword: (pwd: string) => void;
  confirmPassword: string;
  setConfirmPassword: (pwd: string) => void;
  setStage: (stage: 1 | 2) => void;
  setMessage: (msg: string) => void;
  setError: (msg: string) => void;
}) {
  const router = useRouter();
  const [showPasswordToast, setShowPasswordToast] = useState(false);

  const getPasswordErrors = (password: string) => {
    const errors: string[] = [];
    if (password.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
    if (!/\d/.test(password)) errors.push("One number");
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) errors.push("One special character");
    return errors;
  };

  const passwordErrors = getPasswordErrors(newPassword);
  const isPasswordStrong = passwordErrors.length === 0;

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!otp.every((digit) => digit.trim().length === 1)) {
      setError("Enter complete 6-digit OTP.");
      return;
    }

    if (!isPasswordStrong || newPassword !== confirmPassword) {
      setError("Passwords must match and meet security requirements.");
      return;
    }

    const result = await resetPassword({
      token: otp.join(""),
      newPassword,
    });

    if (result.success) {
      setMessage(result.message || "Password reset successfully.");
      setStage(1);
      setOtp(Array(6).fill(""));
      setPassword("");
      setConfirmPassword("");
      router.push("/login");
    } else {
      setError(result.message || "Failed to reset password.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (/^\d?$/.test(value)) {
      const updated = [...otp];
      updated[index] = value;
      setOtp(updated);

      if (value && index < otp.length - 1) {
        const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
        nextInput?.focus();
      }
    }
  };

  return (
    <form className="my-8 space-y-6" onSubmit={handleResetSubmit}>
      <div>
        <Label className="mb-2 block text-sm text-indigo-900 dark:text-neutral-200">OTP</Label>
        <div className="flex justify-between gap-2">
          {otp.map((digit, i) => (
            <Input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              className="w-10 h-10 text-center text-lg"
              autoFocus={i === 0}
            />
          ))}
        </div>
      </div>

      <div className={cn("flex w-full flex-col space-y-2")}>
        <Label htmlFor="new-password" className="text-sm font-medium text-indigo-900 dark:text-neutral-200">New Password</Label>
        <Input
          id="new-password"
          type="password"
          placeholder="New password"
          value={newPassword}
          onFocus={() => setShowPasswordToast(true)}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className={cn("flex w-full flex-col space-y-2")}>
        <Label htmlFor="confirm-password" className="text-sm font-medium text-indigo-900 dark:text-neutral-200">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="group/btn relative h-10 w-full rounded-md bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white shadow-lg transition-all hover:brightness-110 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Reset Password
      </button>

      <PasswordHintToast
        show={showPasswordToast}
        errors={passwordErrors}
      />
    </form>
  );
}

const PasswordHintToast = ({
  show,
  errors,
}: {
  show: boolean;
  errors: string[];
}) => {
  if (!show) return null;

  const rules = [
    { label: "At least 8 characters", met: !errors.includes("At least 8 characters") },
    { label: "One uppercase letter", met: !errors.includes("One uppercase letter") },
    { label: "One number", met: !errors.includes("One number") },
    { label: "One special character", met: !errors.includes("One special character") },
  ];

  return (
    <div className="mt-4 rounded-lg bg-indigo-100 p-4 text-sm text-indigo-900 dark:bg-zinc-800 dark:text-indigo-100 border border-indigo-300 dark:border-zinc-700 transition-all">
      <p className="font-semibold mb-2">Password must include:</p>
      <ul className="space-y-1">
        {rules.map((rule, idx) => (
          <li key={idx} className="flex items-center gap-2">
            {rule.met ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <span className={rule.met ? "text-green-700 dark:text-green-400" : ""}>
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
