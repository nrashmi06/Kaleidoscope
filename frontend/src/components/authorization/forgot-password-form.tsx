"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function ForgotPasswordForm() {
  const [stage, setStage] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes("@")) {
      // Simulate sending OTP
      setStage(2);
    } else {
      alert("Please enter a valid email.");
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.every((digit) => digit.trim().length === 1)) {
      alert("Enter complete 6-digit OTP.");
      return;
    }
    if (password.length < 6 || password !== confirmPassword) {
      alert("Passwords must match and be at least 6 characters.");
      return;
    }

    // Final submission
    console.log("Resetting password with:", { email, otp, password });
  };

  const handleOtpChange = (index: number, value: string) => {
    if (/^\d?$/.test(value)) {
      const updated = [...otp];
      updated[index] = value;
      setOtp(updated);

      // Automatically move focus to next input when current input is filled
      if (value && index < otp.length - 1) {
        const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
        nextInput?.focus();
      }
    }
  };

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
      <h2 className="text-xl text-center font-bold text-neutral-800 dark:text-neutral-200">
        Forgot Password
      </h2>
      <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-300">
        {stage === 1
          ? "Enter your email to receive a reset code."
          : "Enter the OTP and set a new password."}
      </p>

      <form className="my-8 space-y-6" onSubmit={stage === 1 ? handleEmailSubmit : handleResetSubmit}>
        {stage === 1 && (
          <LabelInputContainer>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              className="mt-4 block w-full h-10 rounded-md bg-black text-white"
            >
              Send OTP
            </button>
          </LabelInputContainer>
        )}

        {stage === 2 && (
          <>
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
                    autoFocus={i === 0} // Focus on the first input initially
                  />
                ))}
              </div>
            </div>

            <LabelInputContainer>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </LabelInputContainer>

            <LabelInputContainer>
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </LabelInputContainer>

            <button
              type="submit"
              className="block w-full h-10 rounded-md bg-black text-white"
            >
              Reset Password
            </button>
          </>
        )}
      </form>
    </div>
  );
}

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex w-full flex-col space-y-2", className)}>{children}</div>
);
