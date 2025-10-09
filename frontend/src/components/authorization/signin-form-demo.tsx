"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { loginUser } from "@/services/auth/login";
import { useAppDispatch } from "@/hooks/appDispatch";
import { useRouter } from "next/navigation";

export default function SigninForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const credentials = { email, password };
    const result = await loginUser(credentials, dispatch);

    if (result.success) {
      setSuccess(result.message);
      router.push("/feed");
    } else {
      setError(result.message);
    }
  };

  return (
    <div className=" mx-auto w-full max-w-md  p-4">
      <h2 className="text-2xl text-center font-bold text-indigo-900 dark:text-indigo-300">
        Welcome to KaleidoScope
      </h2>
      <p className="mt-2 text-center text-sm font-semibold text-zinc-500 dark:text-neutral-400">
  Please log in to continue
</p>


      <form className="my-8" onSubmit={handleSubmit}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email" className="text-indigo-900 dark:text-neutral-200">
            Email Address
          </Label>
          <Input
            id="email"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-50 dark:bg-zinc-900 border border-indigo-300 dark:border-indigo-600 focus:ring-2 focus:ring-indigo-500"
          />
        </LabelInputContainer>

        <LabelInputContainer className="mb-6">
          <Label htmlFor="password" className="text-indigo-900 dark:text-neutral-200">
            Password
          </Label>
          <Input
            id="password"
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-gray-50 dark:bg-zinc-900 border border-indigo-300 dark:border-indigo-600 focus:ring-2 focus:ring-indigo-500"
          />
        </LabelInputContainer>

        <button
          className="group/btn relative h-10 w-full rounded-md bg-gradient-to-r from-indigo-700 via-indigo-800 to-indigo-900 text-white shadow-lg transition-all hover:brightness-110"
          type="submit"
        >
          Log in &rarr;
          <BottomGradient />
        </button>

        <div className="my-6 h-[1px] w-full bg-gradient-to-r from-transparent via-indigo-300 to-transparent dark:via-neutral-600" />

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

      {error && <p className="mt-4 text-center text-sm text-red-600 dark:text-red-400">{error}</p>}
      {success && <p className="mt-4 text-center text-sm text-green-600 dark:text-green-400">{success}</p>}
    </div>
  );
}

const BottomGradient = () => (
  <>
    <span className="absolute inset-x-0 -bottom-px block h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
    <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
  </>
);

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
