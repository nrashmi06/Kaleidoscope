"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { checkUsernameController } from "@/controllers/auth/checkUsernameController";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UsernameCheckInputProps {
  value: string;
  onChange: (value: string) => void;
  onAvailabilityChange: (isAvailable: boolean, message: string) => void;
}

type Status = "initial" | "loading" | "available" | "taken" | "invalid" | "error";

export default function UsernameCheckInput({
  value,
  onChange,
  onAvailabilityChange,
}: UsernameCheckInputProps) {
  const [status, setStatus] = useState<Status>("initial");
  const [isFocused, setIsFocused] = useState(false);
  const debouncedUsername = useDebounce(value, 1000); // ✅ 1-second debounce
  const firstRender = useRef(true);

  /** --- Client-side validation --- **/
  const isValidFormat = /^[a-zA-Z0-9_]{3,}$/.test(value);
  const isLongEnough = value.length >= 3;

  /** --- API check --- **/
  const checkAvailability = useCallback(
    async (username: string) => {
      if (!username || username.trim().length < 3) {
        setStatus("initial");
        onAvailabilityChange(false, "");
        return;
      }

      if (!isValidFormat) {
        setStatus("invalid");
        onAvailabilityChange(
          false,
          "Username must contain only letters, numbers, or underscores (min 3 chars)."
        );
        return;
      }

      setStatus("loading");
      try {
        const res = await checkUsernameController(username);

        if (res.success && res.data?.available) {
          setStatus("available");
          onAvailabilityChange(true, "");
        } else if (res.data?.available === false) {
          setStatus("taken");
          onAvailabilityChange(false, res.message || "That username is taken.");
        } else {
          setStatus("error");
          onAvailabilityChange(false, res.message || "Unable to check availability.");
        }
      } catch (err) {
        console.error("Error checking username:", err);
        setStatus("error");
        onAvailabilityChange(false, "Network error during username check.");
      }
    },
    [isValidFormat, onAvailabilityChange]
  );

  /** --- Debounced effect (runs ONLY when user is typing in username field) --- **/
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (!isFocused) return; // ✅ Only check when typing in username field

    if (debouncedUsername && isLongEnough) {
      checkAvailability(debouncedUsername);
    } else {
      setStatus("initial");
      onAvailabilityChange(false, "");
    }
  }, [debouncedUsername, isFocused, checkAvailability, isLongEnough, onAvailabilityChange]);

  /** --- UI: status icon --- **/
  const getStatusIcon = (currentStatus: Status) => {
    switch (currentStatus) {
      case "loading":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "available":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "taken":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "invalid":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  /** --- UI: status message --- **/
  const statusMessage = () => {
    if (value.length > 0 && value.length < 3)
      return "Username must be at least 3 characters.";
    switch (status) {
      case "taken":
        return "That username is already taken.";
      case "invalid":
        return "Invalid format — only letters, numbers, and underscores allowed.";
      case "error":
        return "Something went wrong. Try again.";
      default:
        return "";
    }
  };

  return (
    <div className="flex w-full flex-col space-y-2">
      <Label
        htmlFor="username-check"
        className="text-gray-800 dark:text-neutral-200 font-medium"
      >
        Username <span className="text-red-500">*</span>
      </Label>

      <div className="relative">
        <Input
          id="username-check"
          placeholder="Choose a unique username"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required
          className={`
            pr-10 text-sm transition-all duration-200 
            bg-gray-50 dark:bg-zinc-900 
            border ${
              status === "taken" || status === "invalid" || status === "error"
                ? "border-red-400 focus:ring-red-400"
                : status === "available"
                ? "border-green-400 focus:ring-green-400"
                : "border-gray-300 dark:border-neutral-700 focus:ring-indigo-500"
            }
            focus:ring-2 focus:outline-none rounded-md
          `}
        />

        {/* Inline status icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {getStatusIcon(status)}
        </div>
      </div>

      {/* Inline feedback message */}
      {value && status !== "available" && (
        <p
          className={`text-xs mt-1 ${
            status === "taken" || status === "invalid" || status === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {statusMessage()}
        </p>
      )}
    </div>
  );
}
