"use client";

import React, { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { loginUser } from "@/services/auth/login";
import { useAppDispatch } from "@/hooks/appDispatch";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SigninForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError("");
      setSuccess("");
      setIsLoading(true);

      const credentials = { email, password };
      const result = await loginUser(credentials, dispatch);

      setIsLoading(false);
      if (result.success) {
        setSuccess(result.message);
        router.push("/feed");
      } else {
        setError(result.message);
      }
    },
    [email, password, dispatch, router]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto w-full max-w-md p-6 sm:p-8 rounded-2xl bg-white/90 dark:bg-zinc-950/80 backdrop-blur-md shadow-xl border border-indigo-200 dark:border-indigo-800"
    >
      {/* Title */}
      <h2 className="text-2xl text-center font-bold text-indigo-900 dark:text-indigo-300">
        Welcome to KaleidoScope
      </h2>
      <p className="mt-2 text-center text-sm font-semibold text-zinc-500 dark:text-neutral-400">
        Please log in to continue
      </p>

      {/* Form */}
      <form className="my-8" onSubmit={handleSubmit} aria-label="Login form">
        {/* Email Input */}
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email" className="text-indigo-900 dark:text-neutral-200">
            Email Address
          </Label>
          <Input
            id="email"
            placeholder="you@example.com"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            required
            className="transition-all duration-200 bg-gray-50 dark:bg-zinc-900 border border-indigo-300 dark:border-indigo-600 focus:ring-2 focus:ring-indigo-500"
          />
        </LabelInputContainer>

        {/* Password Input */}
        <LabelInputContainer className="mb-6">
          <Label htmlFor="password" className="text-indigo-900 dark:text-neutral-200">
            Password
          </Label>
          <Input
            id="password"
            placeholder="••••••••"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            required
            className="transition-all duration-200 bg-gray-50 dark:bg-zinc-900 border border-indigo-300 dark:border-indigo-600 focus:ring-2 focus:ring-indigo-500"
          />
        </LabelInputContainer>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "group/btn relative h-10 w-full rounded-md bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white font-semibold shadow-lg transition-all hover:brightness-110",
            isLoading && "opacity-70 cursor-not-allowed"
          )}
        >
          {isLoading ? "Logging in..." : "Log in →"}
          <BottomGradient />
        </button>

        {/* Divider */}
        <div className="my-6 h-[1px] w-full bg-gradient-to-r from-transparent via-indigo-300 to-transparent dark:via-neutral-600" />

        {/* Links */}
        <div className="text-center text-sm text-neutral-700 dark:text-neutral-300 space-y-2">
          <p>
            <a
              href="/forgot-password"
              className="font-semibold text-indigo-900 underline dark:text-indigo-300"
            >
              Forgot your password?
            </a>
          </p>
          <p>
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="font-semibold text-indigo-900 underline dark:text-indigo-300"
            >
              Sign up
            </a>
          </p>
        </div>
      </form>

      {/* Alerts */}
      {error && (
        <div
          aria-live="polite"
          className="mt-4 rounded-md bg-red-50 p-2 text-center text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          aria-live="polite"
          className="mt-4 rounded-md bg-green-50 p-2 text-center text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400"
        >
          {success}
        </div>
      )}
    </motion.div>
  );
}

const BottomGradient = React.memo(function BottomGradient() {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
});

const LabelInputContainer = React.memo( function LabelInputContainer(
  {
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) {
  return <div className={cn("flex w-full flex-col space-y-2", className)}>{children}</div>;
});
