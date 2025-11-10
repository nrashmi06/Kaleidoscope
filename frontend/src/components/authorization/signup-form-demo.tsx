"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { registerUserWithProfile } from "@/services/auth/register";
import { verifyEmail } from "@/services/auth/verifyEmailResend";
import { RegistrationLoader } from "./RegistrationLoader";
import type { RegisterFormState } from "@/lib/types/auth";
import UsernameCheckInput from "../auth/UsernameCheckInput";
import { X, CheckCircle, Loader2 } from "lucide-react";

export default function SignupForm() {
  const [formState, setFormState] = useState<RegisterFormState>({
    email: "",
    password: "",
    username: "",
    designation: "",
    summary: "",
    confirmPassword: "",
    profilePicture: null,
  });

  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" | "" }>({
    message: "",
    type: "",
  });

  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState("");

  /** Password validation **/
  const getPasswordErrors = (password: string) => {
    const errors: string[] = [];
    if (password.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
    if (!/\d/.test(password)) errors.push("One number");
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) errors.push("One special character");
    return errors;
  };

  const isPasswordStrong = (password: string) => getPasswordErrors(password).length === 0;

  const handleAvailabilityChange = (isAvailable: boolean, message: string) => {
    setIsUsernameAvailable(isAvailable);
    setUsernameMessage(message);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback({ message: "", type: "" });

    const { email, password, confirmPassword, username, designation, summary, profilePicture } =
      formState;

    if (password !== confirmPassword)
      return setFeedback({ message: "Passwords do not match.", type: "error" });

    if (!isPasswordStrong(password))
      return setFeedback({
        message: `Password does not meet requirements: ${getPasswordErrors(password).join(", ")}`,
        type: "error",
      });

    if (!isUsernameAvailable)
      return setFeedback({
        message: usernameMessage || "Please choose an available username.",
        type: "error",
      });

    if (!profilePicture)
      return setFeedback({ message: "Please upload a profile picture.", type: "error" });

    setIsRegistering(true);

    try {
      const result = await registerUserWithProfile(
        { email, password, username, designation, summary },
        profilePicture
      );

      if (result.success) {
        setFeedback({ message: result.message, type: "success" });
        setEmailSubmitted(true);
      } else {
        setFeedback({ message: result.message, type: "error" });
      }
    } catch {
      setFeedback({ message: "An unexpected error occurred. Please try again.", type: "error" });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleResendEmail = async () => {
    const result = await verifyEmail({ email: formState.email });
    setFeedback({
      message: result.success ? "Verification email resent." : result.message,
      type: result.success ? "success" : "error",
    });
  };

  if (emailSubmitted) {
    return (
      <>
        <RegistrationLoader isLoading={isRegistering} />
        <section className="mx-auto mt-20 flex w-full max-w-md flex-col items-center rounded-xl border border-blue-400 bg-white p-8 shadow-md dark:bg-neutral-900">
          <CheckCircle className="w-10 h-10 text-blue-500 mb-3" />
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Registration Successful
          </h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 text-center">
            Please check your email at <b>{formState.email}</b> to verify your account.
          </p>
          <button
            type="button"
            onClick={handleResendEmail}
            className="mt-5 rounded-md bg-blue-600 px-5 py-2 text-white text-sm font-semibold hover:bg-blue-700 transition-all"
          >
            Resend Verification Email
          </button>
          {feedback.message && (
            <Toast {...feedback} onClose={() => setFeedback({ message: "", type: "" })} />
          )}
        </section>
      </>
    );
  }

  return (
    <>
      <RegistrationLoader isLoading={isRegistering} />
      <section className="mx-auto mt-10 mb-20 w-full max-w-md rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-8 shadow-md">
        <h1 className="text-center text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Create your account
        </h1>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <LabelInputContainer>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formState.email}
              onChange={(e) => setFormState({ ...formState, email: e.target.value })}
              required
            />
          </LabelInputContainer>

          {/* Username with availability check */}
          <LabelInputContainer>
            <UsernameCheckInput
              value={formState.username}
              onChange={(username) => setFormState({ ...formState, username })}
              onAvailabilityChange={handleAvailabilityChange}
            />
            {formState.username.length > 0 && (
              <p
                className={cn(
                  "mt-1 text-xs flex items-center gap-1",
                  isUsernameAvailable
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {isUsernameAvailable ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                {usernameMessage}
              </p>
            )}
          </LabelInputContainer>

          {/* Password */}
          <LabelInputContainer>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formState.password}
              onChange={(e) => setFormState({ ...formState, password: e.target.value })}
              required
            />
            {formState.password && (
              <div className="mt-1 space-y-1">
                {getPasswordErrors(formState.password).map((err, i) => (
                  <p key={i} className="text-xs text-red-500 flex items-center gap-1">
                    <X className="w-3 h-3" /> {err}
                  </p>
                ))}
                {isPasswordStrong(formState.password) && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Strong password.
                  </p>
                )}
              </div>
            )}
          </LabelInputContainer>

          {/* Confirm Password */}
          <LabelInputContainer>
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formState.confirmPassword}
              onChange={(e) => setFormState({ ...formState, confirmPassword: e.target.value })}
              required
            />
            {formState.confirmPassword &&
              formState.password !== formState.confirmPassword && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <X className="w-3 h-3" /> Passwords do not match.
                </p>
              )}
          </LabelInputContainer>

          {/* Profile Info */}
          <LabelInputContainer>
            <Label htmlFor="designation">Designation</Label>
            <Input
              id="designation"
              type="text"
              placeholder="Software Engineer, etc."
              value={formState.designation}
              onChange={(e) => setFormState({ ...formState, designation: e.target.value })}
            />
          </LabelInputContainer>

          <LabelInputContainer>
            <Label htmlFor="summary">Summary</Label>
            <Input
              id="summary"
              type="text"
              placeholder="Short bio (max 150 chars)"
              value={formState.summary}
              onChange={(e) => setFormState({ ...formState, summary: e.target.value })}
            />
          </LabelInputContainer>

          {/* Profile Picture */}
          <LabelInputContainer>
            <Label htmlFor="profilePicture">Profile Picture *</Label>
            <Input
              id="profilePicture"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFormState({ ...formState, profilePicture: e.target.files?.[0] || null })
              }
              required
              className="file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 file:rounded-md file:border-0 file:py-1 file:px-3"
            />
          </LabelInputContainer>

          {/* Submit */}
          <button
            type="submit"
            disabled={isRegistering || !isUsernameAvailable}
            className={cn(
              "relative mt-6 h-11 w-full rounded-lg text-white font-semibold text-base transition-all",
              isRegistering || !isUsernameAvailable
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {isRegistering ? <Loader2 className="w-5 h-5 mx-auto animate-spin" /> : "Sign Up →"}
          </button>
        </form>

        {feedback.message && (
          <Toast {...feedback} onClose={() => setFeedback({ message: "", type: "" })} />
        )}
      </section>
    </>
  );
}

/* Toast */
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error" | "";
  onClose: () => void;
}) =>
  message && (
    <div
      role="alert"
      className={`fixed top-4 right-4 z-50 rounded-md px-4 py-3 text-sm text-white shadow-lg ${
        type === "success" ? "bg-green-500" : "bg-red-500"
      }`}
    >
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="ml-3 text-lg font-bold">
          &times;
        </button>
      </div>
    </div>
  );

/* Label + Input wrapper */
const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("flex flex-col space-y-1", className)}>{children}</div>;
