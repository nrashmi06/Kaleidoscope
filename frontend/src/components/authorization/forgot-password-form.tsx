"use client";
import React, { useState } from "react";
import EmailStage from "./EmailStage";
import ResetStage from "./ResetStage";

export default function ForgotPasswordForm() {
  const [stage, setStage] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [newPassword, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-cream-50 dark:bg-navy-700/50 p-4 md:rounded-2xl md:p-8">
      <h2 className="text-xl text-center font-display font-bold text-navy dark:text-cream">
        Forgot Password
      </h2>
      <p className="mt-2 text-center text-sm text-steel/60 dark:text-sky/40">
        {stage === 1
          ? "Enter your email to receive a reset code."
          : "Enter the OTP and set a new password."}
      </p>

      {stage === 1 ? (
        <EmailStage
          email={email}
          setEmail={setEmail}
          setStage={setStage}
          setMessage={setMessage}
          setError={setError}
        />
      ) : (
        <ResetStage
          otp={otp}
          setOtp={setOtp}
          newPassword={newPassword}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          setStage={setStage}
          setMessage={setMessage}
          setError={setError}
        />
      )}

      {message && <p className="text-green-600 dark:text-green-400 text-sm text-center">{message}</p>}
      {error && <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>}
    </div>
  );
}
