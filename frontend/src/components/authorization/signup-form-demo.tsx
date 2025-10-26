"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { registerUserWithProfile } from "@/services/auth/register";
import { verifyEmail } from "@/services/auth/verifyEmailResend";
import { RegistrationLoader } from "./RegistrationLoader";
import type { RegisterFormState } from "@/lib/types/auth";

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

  /** --- Password Validation --- **/
  const getPasswordErrors = (password: string) => {
    const errors: string[] = [];
    if (password.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
    if (!/\d/.test(password)) errors.push("One number");
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) errors.push("One special character");
    return errors;
  };

  const isPasswordStrong = (password: string) => getPasswordErrors(password).length === 0;

  /** --- Submit Handler --- **/
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback({ message: "", type: "" });

    const { email, password, confirmPassword, username, designation, summary, profilePicture } =
      formState;

    if (password !== confirmPassword) {
      return setFeedback({ message: "Passwords do not match.", type: "error" });
    }

    if (!isPasswordStrong(password)) {
      return setFeedback({
        message: `Password does not meet requirements: ${getPasswordErrors(password).join(", ")}`,
        type: "error",
      });
    }

    if (!profilePicture) {
      return setFeedback({ message: "Please upload a profile picture.", type: "error" });
    }

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

  /** --- Resend Verification Email --- **/
  const handleResendEmail = async () => {
    const result = await verifyEmail({ email: formState.email });
    setFeedback({
      message: result.success ? "Verification email resent." : result.message,
      type: result.success ? "success" : "error",
    });
  };

  /** --- Registration Success Page --- **/
  if (emailSubmitted) {
    return (
      <>
        <RegistrationLoader isLoading={isRegistering} />
        <section
          className="mx-auto mt-20 flex w-full max-w-md flex-col items-center justify-center rounded-md bg-white p-8 text-center shadow-lg dark:bg-black"
          aria-live="polite"
        >
          <h1 className="text-xl font-semibold text-indigo-900 dark:text-neutral-100">
            Registration Successful
          </h1>
          <p className="mt-2 text-sm text-indigo-700 dark:text-neutral-300">
            Please check your email and verify your account.
          </p>
          <button
            type="button"
            className="mt-4 rounded-md bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 px-6 py-2 text-white shadow-lg transition-all hover:brightness-110"
            onClick={handleResendEmail}
          >
            Resend Verification Email
          </button>

          {feedback.message && <Toast {...feedback} onClose={() => setFeedback({ message: "", type: "" })} />}
        </section>
      </>
    );
  }

  /** --- Main Signup Form --- **/
  return (
    <>
      <RegistrationLoader isLoading={isRegistering} />

      <section
        className="mx-auto mt-20 w-full max-w-md rounded-2xl border border-blue-500 bg-white p-8 shadow-lg dark:bg-black"
        aria-labelledby="signup-title"
      >
        <h1 id="signup-title" className="text-center text-xl font-bold text-black dark:text-neutral-200">
          Welcome to Kaleidoscope
        </h1>

        <form className="my-8 space-y-4" onSubmit={handleSubmit} noValidate>
          {[
            { label: "Email Address", type: "email", key: "email", required: true },
            { label: "Username", type: "text", key: "username", required: true },
          ].map(({ label, type, key, required }) => (
            <LabelInputContainer key={key}>
              <Label>
                {label} {required && <span className="text-red-500">*</span>}
              </Label>
              <Input
                type={type}
                value={formState[key as keyof RegisterFormState] as string}
                onChange={(e) => setFormState({ ...formState, [key]: e.target.value })}
                required={required}
              />
            </LabelInputContainer>
          ))}

          <LabelInputContainer>
            <Label>Password <span className="text-red-500">*</span></Label>
            <Input
              type="password"
              value={formState.password}
              onChange={(e) => setFormState({ ...formState, password: e.target.value })}
              required
            />
          </LabelInputContainer>

          <LabelInputContainer>
            <Label>Confirm Password <span className="text-red-500">*</span></Label>
            <Input
              type="password"
              value={formState.confirmPassword}
              onChange={(e) => setFormState({ ...formState, confirmPassword: e.target.value })}
              required
            />
          </LabelInputContainer>

          <LabelInputContainer>
            <Label>Designation</Label>
            <Input
              type="text"
              value={formState.designation}
              onChange={(e) => setFormState({ ...formState, designation: e.target.value })}
            />
          </LabelInputContainer>

          <LabelInputContainer>
            <Label>Summary</Label>
            <Input
              type="text"
              value={formState.summary}
              onChange={(e) => setFormState({ ...formState, summary: e.target.value })}
            />
          </LabelInputContainer>

          <LabelInputContainer>
            <Label>Profile Picture <span className="text-red-500">*</span></Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFormState({ ...formState, profilePicture: e.target.files?.[0] || null })
              }
              required
            />
          </LabelInputContainer>

          <button
            disabled={isRegistering}
            className={cn(
              "relative mt-4 h-10 w-full rounded-md text-white shadow-lg transition-all",
              isRegistering
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-800 hover:brightness-110"
            )}
            type="submit"
          >
            {isRegistering ? "Creating Account..." : "Sign up →"}
            <BottomGradient />
          </button>
        </form>

        {feedback.message && (
          <Toast {...feedback} onClose={() => setFeedback({ message: "", type: "" })} />
        )}
      </section>
    </>
  );
}

/* Toast Notification */
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
      aria-live="assertive"
      className={`fixed top-4 right-4 z-50 rounded-md px-4 py-3 text-sm text-white shadow-lg ${
        type === "success" ? "bg-green-500" : "bg-red-500"
      }`}
    >
      <div className="flex items-center justify-between space-x-4">
        <span>{message}</span>
        <button
          type="button"
          aria-label="Close"
          className="text-lg font-bold focus:outline-none"
          onClick={onClose}
        >
          ×
        </button>
      </div>
    </div>
  );

/* Button Gradient */
const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
);

/* Label + Input Wrapper */
const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={cn("flex w-full flex-col space-y-2", className)}>{children}</div>;
