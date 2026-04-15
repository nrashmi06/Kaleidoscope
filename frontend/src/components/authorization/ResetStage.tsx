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
  const [resetError, setResetError] = useState("");

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
    setResetError("");

    if (!otp.every((digit) => digit.trim().length === 1)) {
      const msg = "Enter complete 6-digit OTP.";
      setError(msg);
      setResetError(msg);
      return;
    }

    if (!isPasswordStrong || newPassword !== confirmPassword) {
      const msg = "Passwords must match and meet security requirements.";
      setError(msg);
      setResetError(msg);
      return;
    }

    const result = await resetPassword({
      token: otp.join(""),
      newPassword,
    });

    if (result.success) {
      setMessage(result.message || "Password reset successfully.");
      setResetError("");
      setStage(1);
      setOtp(Array(6).fill(""));
      setPassword("");
      setConfirmPassword("");
      router.push("/login");
    } else {
      const msg = result.message || "Failed to reset password.";
      setError(msg);
      setResetError(msg);
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

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const updated = [...otp];
      if (otp[index]) {
        updated[index] = "";
        setOtp(updated);
      } else if (index > 0) {
        updated[index - 1] = "";
        setOtp(updated);
        const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
        prevInput?.focus();
      }
    }
  };

  return (
    <form className="my-8 space-y-6" onSubmit={handleResetSubmit}>
      <div>
        <Label className="mb-2 block text-sm text-navy dark:text-cream">OTP</Label>
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
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              className="w-10 h-10 text-center text-lg"
              autoFocus={i === 0}
            />
          ))}
        </div>
        {resetError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{resetError}</p>
        )}
      </div>

      <div className={cn("flex w-full flex-col space-y-2")}>
        <Label htmlFor="new-password" className="text-sm font-medium text-navy dark:text-cream">New Password</Label>
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
        <Label htmlFor="confirm-password" className="text-sm font-medium text-navy dark:text-cream">Confirm Password</Label>
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
        className="group/btn relative h-10 w-full rounded-md bg-gradient-to-r from-steel to-steel-600 dark:from-sky dark:to-sky/80 text-cream-50 dark:text-navy shadow-lg shadow-steel/20 dark:shadow-sky/15 transition-all hover:brightness-110 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="mt-4 rounded-lg bg-steel/10 dark:bg-sky/10 p-4 text-sm text-navy dark:text-cream border border-steel/20 dark:border-sky/20 transition-all">
      <p className="font-semibold mb-2">Password must include:</p>
      <ul className="space-y-1">
        {rules.map((rule, idx) => (
          <li key={idx} className="flex items-center gap-2">
            {rule.met ? (
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
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
