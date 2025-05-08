"use client";
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { registerUserWithProfile } from "@/services/auth/register";

export default function SignupForm() {
  const [formState, setFormState] = useState({
    email: "",
    password: "",
    username: "",
    designation: "",
    summary: "",
    confirmPassword: "",
    profilePicture: null as File | null,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formState.password !== formState.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!formState.profilePicture) {
      setError("Please upload a profile picture.");
      return;
    }

    const userData = {
      email: formState.email,
      password: formState.password,
      username: formState.username || "DefaultUser",
      designation: formState.designation || "Member",
      summary: formState.summary || "",
    };

    const result = await registerUserWithProfile(userData, formState.profilePicture);
    if (result.success) {
      setSuccess(result.message);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
      <h2 className="text-xl text-center font-bold pt-20 text-neutral-800 dark:text-neutral-200">
        Welcome to KelideoScope
      </h2>
      <form className="my-8" onSubmit={handleSubmit}>
        <LabelInputContainer>
          <Label>Email Address</Label>
          <Input
            type="email"
            value={formState.email}
            onChange={(e) => setFormState({ ...formState, email: e.target.value })}
          />
        </LabelInputContainer>

        <LabelInputContainer>
          <Label>Username</Label>
          <Input
            type="username"
            value={formState.username}
            onChange={(e) => setFormState({ ...formState, username: e.target.value })}
          />
        </LabelInputContainer>

        <LabelInputContainer>
          <Label>Password</Label>
          <Input
            type="password"
            value={formState.password}
            onChange={(e) => setFormState({ ...formState, password: e.target.value })}
          />
        </LabelInputContainer>

        <LabelInputContainer>
          <Label>Confirm Password</Label>
          <Input
            type="password"
            value={formState.confirmPassword}
            onChange={(e) => setFormState({ ...formState, confirmPassword: e.target.value })}
          />
        </LabelInputContainer>

        <LabelInputContainer>
          <Label>Profile Picture</Label>
          <Input
            type="file"
            onChange={(e) =>
              setFormState({ ...formState, profilePicture: e.target.files?.[0] || null })
            }
          />
        </LabelInputContainer>

        <button
          className="group/btn relative mt-4 block h-10 w-full rounded-md bg-black text-white"
          type="submit"
        >
          Sign up &rarr;
          <BottomGradient />
        </button>

        {error && (
          <p className="mt-4 text-center text-sm text-red-500">{error}</p>
        )}
        {success && (
          <p className="mt-4 text-center text-sm text-green-500">{success}</p>
        )}
      </form>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
