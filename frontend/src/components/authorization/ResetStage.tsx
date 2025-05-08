"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/services/auth/reset-password";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    

    

    if (!otp.every((digit) => digit.trim().length === 1)) {
      setError("Enter complete 6-digit OTP.");
      return;
    }

    if (newPassword.length < 6 || newPassword !== confirmPassword) {
      setError("Passwords must match and be at least 6 characters.");
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
        <Label className="mb-2 block text-sm">OTP</Label>
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
        <Label htmlFor="new-password">New Password</Label>
        <Input
          id="new-password"
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className={cn("flex w-full flex-col space-y-2")}>
        <Label htmlFor="confirm-password">Confirm Password</Label>
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
        className="block w-full h-10 rounded-md bg-black text-white"
      >
        Reset Password
      </button>
    </form>
  );
}
