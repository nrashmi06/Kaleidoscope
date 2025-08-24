"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { registerUserWithProfile } from "@/services/auth/register";
import { RegisterFormState } from "@/lib/types/auth";
import { verifyEmail } from "@/services/auth/verifyEmailResend";
import { RegistrationLoader } from "./RegistrationLoader";

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

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const getPasswordErrors = (password: string) => {
    const errors: string[] = [];
    if (password.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
    if (!/\d/.test(password)) errors.push("One number");
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) errors.push("One special character");
    return errors;
  };

  const isPasswordStrong = (password: string) => getPasswordErrors(password).length === 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formState.password !== formState.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isPasswordStrong(formState.password)) {
      setError(
        `Password does not meet requirements: ${getPasswordErrors(
          formState.password
        ).join(", ")}`
      );
      return;
    }

    if (!formState.profilePicture) {
      setError("Please upload a profile picture.");
      return;
    }

    // Start the loading animation
    setIsRegistering(true);

    try {
      const result = await registerUserWithProfile(
        {
          email: formState.email,
          password: formState.password,
          username: formState.username,
          designation: formState.designation,
          summary: formState.summary,
        },
        formState.profilePicture
      );

      if (result.success) {
        setSuccess(result.message);
        setEmailSubmitted(true);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsRegistering(false);
    }

    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 5000);
  };

  const handleResendEmail = async () => {
    const result = await verifyEmail({ email: formState.email });
    if (result.success) {
      setSuccess("Verification email resent.");
    } else {
      setError(result.message);
    }

    setTimeout(() => {
      setError("");
      setSuccess("");
    }, 5000);
  };

  if (emailSubmitted) {
    return (
      <>
        <RegistrationLoader isLoading={isRegistering} />
        <div className="mx-auto my-auto w-full max-w-md rounded-md bg-white mt-20 flex-col justify-center text-center dark:bg-black">
        <h2 className="text-xl font-semibold text-indigo-900 dark:text-neutral-100">
          Registration Successful
        </h2>
        <p className="mt-2 text-sm text-indigo-700 dark:text-neutral-300">
          Please check your email and verify your account.
        </p>
        <button
          className="mt-4 group/btn relative h-10 w-1/2 rounded-md bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white shadow-lg transition-all hover:brightness-110"
          onClick={handleResendEmail}
        >
          Resend Verification Email
        </button>
        {(error || success) && (
          <Toast
            message={error || success}
            type={error ? "error" : "success"}
            onClose={() => {
              setError("");
              setSuccess("");
            }}
          />
        )}
        </div>
      </>
    );
  }

  return (
    <>
      <RegistrationLoader isLoading={isRegistering} />
      <div className="shadow-input mx-auto mt-20 w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
      <h2 className="text-xl text-center font-bold text-black dark:text-neutral-200">
        Welcome to Kaleidoscope
      </h2>
      <form className="my-8" onSubmit={handleSubmit}>
        <LabelInputContainer>
          <Label>Email Address <span className="text-red-500">*</span></Label>
          <Input
            type="email"
            value={formState.email}
            onChange={(e) =>
              setFormState({ ...formState, email: e.target.value })
            }
          />
        </LabelInputContainer>

        <LabelInputContainer>
          <Label>Username <span className="text-red-500">*</span></Label>
          <Input
            type="text"
            value={formState.username}
            onChange={(e) =>
              setFormState({ ...formState, username: e.target.value })
            }
          />
        </LabelInputContainer>

        <LabelInputContainer>
          <Label className="flex items-center space-x-1 group relative">
  <span>Password <span className="text-red-500">*</span></span>
  <span
    className="cursor-pointer rounded-full border border-blue-600 px-1.5 text-blue-600 font-bold dark:text-blue-400 dark:border-blue-400"
    aria-label="Password requirements"
  >
    ?
    <div className="absolute bottom-full left-1/2 mb-2 w-64 -translate-x-1/2 rounded-md bg-blue-300 px-3 py-2 text-xs text-white opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto whitespace-pre-line z-50">
      Password must include:
      {"\n"}- At least 8 characters
      {"\n"}- One uppercase letter
      {"\n"}- One number
      {"\n"}- One special character
    </div>
  </span>
</Label>

          <Input
            type="password"
            value={formState.password}
            onChange={(e) =>
              setFormState({ ...formState, password: e.target.value })
            }
          />
        </LabelInputContainer>

        <LabelInputContainer>
          <Label>Confirm Password <span className="text-red-500">*</span></Label>
          <Input
            type="password"
            value={formState.confirmPassword}
            onFocus={() => {
              if (!isPasswordStrong(formState.password)) {
                setError(
                  `Password does not meet requirements: ${getPasswordErrors(
                    formState.password
                  ).join(", ")}`
                );
              }
            }}
            onChange={(e) =>
              setFormState({
                ...formState,
                confirmPassword: e.target.value,
              })
            }
          />
        </LabelInputContainer>

        <LabelInputContainer>
          <Label>Designation</Label>
          <Input
            type="text"
            value={formState.designation}
            onChange={(e) =>
              setFormState({ ...formState, designation: e.target.value })
            }
          />
        </LabelInputContainer>

        <LabelInputContainer>
          <Label>Summary</Label>
          <Input
            type="text"
            value={formState.summary}
            onChange={(e) =>
              setFormState({ ...formState, summary: e.target.value })
            }
          />
        </LabelInputContainer>

        <LabelInputContainer>
          <Label>Profile Picture <span className="text-red-500">*</span></Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setFormState({
                ...formState,
                profilePicture: e.target.files?.[0] || null,
              })
            }
          />
        </LabelInputContainer>

        <button
          disabled={isRegistering}
          className={`mt-4 group/btn relative h-10 w-full rounded-md text-white shadow-lg transition-all ${
            isRegistering
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800 hover:brightness-110"
          }`}
          type="submit"
        >
          {isRegistering ? "Creating Account..." : "Sign up →"}
          <BottomGradient />
        </button>
      </form>

      

      {(error || success) && (
        <Toast
          message={error || success}
          type={error ? "error" : "success"}
          onClose={() => {
            setError("");
            setSuccess("");
          }}
        />
      )}
      </div>
    </>
  );
}

// Toast popup
const Toast = ({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) => (
  <div
    className={`fixed top-4 right-4 z-50 rounded-md px-4 py-3 shadow-lg transition-all
      ${type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
  >
    <div className="flex items-center justify-between space-x-4">
      <span>{message}</span>
      <button
        className="text-white text-lg font-bold focus:outline-none"
        onClick={onClose}
      >
        &times;
      </button>
    </div>
  </div>
);

// // Password rules toast
// const PasswordHintToast = ({
//   show,
//   errors,
//   onClose,
// }: {
//   show: boolean;
//   errors: string[];
//   onClose: () => void;
// }) => {
//   if (!show) return null;

//   const rules = [
//     "At least 8 characters",
//     "One uppercase letter",
//     "One number",
//     "One special character",
//   ];

//   return (
//     <div className="fixed top-20 right-4 z-50 w-80 rounded-md border border-indigo-300 bg-indigo-50 p-4 text-sm shadow-lg dark:border-blue-600/50 dark:bg-zinc-800 dark:text-blue-200">
//       <div className="flex justify-between items-start">
//         <div>
//           <p className="font-semibold mb-2">Password must include:</p>
//           <ul className="space-y-1">
//             {rules.map((rule, idx) => {
//               const valid = !errors.includes(rule);
//               return (
//                 <li key={idx} className="flex items-center gap-2">
//                   {valid ? (
//                     <CheckCircle className="h-4 w-4 text-green-600" />
//                   ) : (
//                     <XCircle className="h-4 w-4 text-red-500" />
//                   )}
//                   <span className={valid ? "text-green-700" : "text-red-500"}>
//                     {rule}
//                   </span>
//                 </li>
//               );
//             })}
//           </ul>
//         </div>
//         <button className="text-lg font-bold ml-2" onClick={onClose}>
//           &times;
//         </button>
//       </div>
//     </div>
//   );
// };

// Bottom gradient
const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
);

// Label + input wrapper
const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex w-full flex-col space-y-2", className)}>{children}</div>
);
