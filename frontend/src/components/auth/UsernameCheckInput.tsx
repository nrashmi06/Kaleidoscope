// src/components/auth/UsernameCheckInput.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
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

  // Client-side validation: must be 3+ chars, alphanumeric/underscore
  const clientSideValid = /^[a-zA-Z0-9_]{3,}$/.test(value);
  const isValidLength = value.length >= 3;

  const checkAvailability = useCallback(async (username: string) => {
    if (!username || username.trim() === "") {
      setStatus("initial");
      onAvailabilityChange(false, "");
      return;
    }
    
    if (!clientSideValid) {
        setStatus("invalid");
        onAvailabilityChange(false, "Username must be 3+ chars and contain only letters, numbers, or underscores.");
        return;
    }

    setStatus("loading");
    try {
      const res = await checkUsernameController(username);

      // Server returns success:true and data:{available:false} if username is taken but format is valid.
      if (res.success && res.data?.available) {
        setStatus("available");
        onAvailabilityChange(true, "Username is available!");
      } else if (res.data?.available === false) { 
        // Covers success:true/false where available:false is returned (taken or invalid format)
        setStatus("taken");
        onAvailabilityChange(false, res.message || "That username is taken.");
      } 
      else {
        // Catch-all for API error or unknown failure
        setStatus("error");
        onAvailabilityChange(false, res.message || "Could not check availability. Try again.");
      }
    } catch (err) {
      setStatus("error");
      console.error("Error checking username availability:", err);
      onAvailabilityChange(false, "Network error during check.");
    }
  }, [clientSideValid, onAvailabilityChange]);

  // Trigger check when debounced value becomes valid
  useEffect(() => {
    if (value && isValidLength) {
      checkAvailability(debouncedUsername);
    } else {
      setStatus("initial");
      onAvailabilityChange(false, "");
    }
  }, [debouncedUsername, isValidLength, onAvailabilityChange, value, checkAvailability]);

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

  const statusMessage = () => {
      if (value.length > 0 && value.length < 3) return "Username must be at least 3 characters.";
      
      switch (status) {
          case "available": return "Username is available!";
          case "taken": return "That username is taken.";
          case "invalid": return "Invalid format or character used.";
          case "error": return "Error checking availability.";
          default: return null;
      }
  };

  return (
    <div className="flex w-full flex-col space-y-2">
      <Label htmlFor="username-check" className="text-indigo-900 dark:text-neutral-200">
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
            className="pr-10 transition-all duration-200 bg-gray-50 dark:bg-zinc-900 border border-indigo-300 dark:border-indigo-600 focus:ring-2 focus:ring-indigo-500"
          />
          {/* Status Icon */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {getStatusIcon(status)}
          </div>
      </div>
      
      {/* Status Message */}
      {(status !== "initial" || value.length > 0) && (
          <p className={`text-xs ${
              status === "available" ? "text-green-600 dark:text-green-400" : 
              status === "taken" || status === "invalid" || status === "error" ? "text-red-600 dark:text-red-400" : 
              "text-gray-500 dark:text-gray-400"
          }`}>
              {statusMessage()}
          </p>
      )}
    </div>
  );
}