"use client";

import React, { useState, useEffect, useRef } from "react";
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
  const debouncedUsername = useDebounce(value, 500);
  const firstRender = useRef(true);
  const onAvailabilityChangeRef = useRef(onAvailabilityChange);
  onAvailabilityChangeRef.current = onAvailabilityChange;

  /** --- Debounced effect (only re-runs when debouncedUsername changes) --- **/
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (!debouncedUsername || debouncedUsername.trim().length < 3) {
      setStatus("initial");
      onAvailabilityChangeRef.current(false, "");
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,}$/.test(debouncedUsername)) {
      setStatus("invalid");
      onAvailabilityChangeRef.current(
        false,
        "Username must contain only letters, numbers, or underscores (min 3 chars)."
      );
      return;
    }

    let cancelled = false;

    const checkAvailability = async () => {
      setStatus("loading");
      try {
        const res = await checkUsernameController(debouncedUsername);
        if (cancelled) return;

        if (res.success && res.data?.available) {
          setStatus("available");
          onAvailabilityChangeRef.current(true, "");
        } else if (res.data?.available === false) {
          setStatus("taken");
          onAvailabilityChangeRef.current(false, res.message || "That username is taken.");
        } else {
          setStatus("error");
          onAvailabilityChangeRef.current(false, res.message || "Unable to check availability.");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Error checking username:", err);
        setStatus("error");
        onAvailabilityChangeRef.current(false, "Network error during username check.");
      }
    };

    checkAvailability();

    return () => { cancelled = true; };
  }, [debouncedUsername]);

  /** --- UI: status icon --- **/
  const getStatusIcon = (currentStatus: Status) => {
    switch (currentStatus) {
      case "loading":
        return <Loader2 className="w-4 h-4 animate-spin text-steel dark:text-sky" />;
      case "available":
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case "taken":
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case "invalid":
        return <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />;
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
        className="text-navy dark:text-cream font-medium"
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
          required
          className={`
            pr-10 text-sm transition-all duration-200
            bg-cream-50/60 dark:bg-navy-700/30
            border ${
              status === "taken" || status === "invalid" || status === "error"
                ? "border-red-400 focus:ring-red-400"
                : status === "available"
                ? "border-green-400 focus:ring-green-400"
                : "border-cream-300/40 dark:border-navy-700/40 focus:ring-steel/30 dark:focus:ring-sky/30"
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
              : "text-steel/50 dark:text-sky/40"
          }`}
        >
          {statusMessage()}
        </p>
      )}
    </div>
  );
}
