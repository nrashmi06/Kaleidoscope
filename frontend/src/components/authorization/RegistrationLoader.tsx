"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, Loader2, Upload, User, Mail, Shield } from "lucide-react";

interface RegistrationLoaderProps {
  isLoading: boolean;
  onComplete?: () => void;
}

interface LoadingStep {
  id: string;
  message: string;
  icon: React.ElementType;
  duration: number;
  completed: boolean;
}

export const RegistrationLoader: React.FC<RegistrationLoaderProps> = ({
  isLoading,
  onComplete,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<LoadingStep[]>([
    {
      id: "profile",
      message: "Creating your profile...",
      icon: User,
      duration: 2000,
      completed: false,
    },
    {
      id: "upload",
      message: "Uploading your profile picture...",
      icon: Upload,
      duration: 2500,
      completed: false,
    },
    {
      id: "security",
      message: "Setting up security features...",
      icon: Shield,
      duration: 1800,
      completed: false,
    },
    {
      id: "email",
      message: "Preparing verification email...",
      icon: Mail,
      duration: 1500,
      completed: false,
    },
    {
      id: "finalizing",
      message: "Finalizing your account...",
      icon: CheckCircle,
      duration: 1200,
      completed: false,
    },
  ]);

  useEffect(() => {
    if (!isLoading) {
      setCurrentStepIndex(0);
      setSteps(prev => prev.map(step => ({ ...step, completed: false })));
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const processStep = (stepIndex: number) => {
      if (stepIndex >= steps.length) {
        onComplete?.();
        return;
      }

      const currentStep = steps[stepIndex];

      setCurrentStepIndex(stepIndex);

      timeoutId = setTimeout(() => {
        setSteps(prev =>
          prev.map((step, index) =>
            index === stepIndex ? { ...step, completed: true } : step
          )
        );

        setTimeout(() => {
          processStep(stepIndex + 1);
        }, 300);
      }, currentStep.duration);
    };

    processStep(0);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, onComplete, steps.length]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4">
        <div className="bg-cream-50 dark:bg-navy-700/90 rounded-3xl p-8 shadow-2xl border border-cream-300/40 dark:border-navy-600/40">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-steel to-sky rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Loader2 className="w-10 h-10 text-cream-50 animate-spin" />
            </div>
            <h2 className="text-2xl font-display font-bold text-navy dark:text-cream mb-2">
              Creating Your Account
            </h2>
            <p className="text-steel/60 dark:text-sky/40">
              Please wait while we set everything up for you
            </p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = step.completed;
              const isPending = index > currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-500 ${
                    isActive
                      ? "bg-steel/10 dark:bg-sky/10 border-2 border-steel/30 dark:border-sky/30"
                      : isCompleted
                      ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700"
                      : "bg-cream-100/40 dark:bg-navy-700/30 border-2 border-transparent"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                      isCompleted
                        ? "bg-green-500 text-cream-50"
                        : isActive
                        ? "bg-steel dark:bg-sky text-cream-50 dark:text-navy animate-pulse"
                        : isPending
                        ? "bg-cream-300/40 dark:bg-navy-600/40 text-steel/40 dark:text-sky/30"
                        : "bg-cream-300/40 dark:bg-navy-600/40 text-steel/40 dark:text-sky/30"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : isActive ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>

                  {/* Message */}
                  <div className="flex-1">
                    <p
                      className={`font-medium transition-colors duration-300 ${
                        isCompleted
                          ? "text-green-700 dark:text-green-300"
                          : isActive
                          ? "text-navy dark:text-cream"
                          : "text-steel/50 dark:text-sky/40"
                      }`}
                    >
                      {step.message}
                    </p>
                  </div>

                  {/* Loading indicator for active step */}
                  {isActive && (
                    <div className="w-6 h-6">
                      <div className="w-6 h-6 border-2 border-steel dark:border-sky border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}

                  {/* Check mark for completed steps */}
                  {isCompleted && (
                    <div className="w-6 h-6 text-green-500">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-between text-sm text-steel/60 dark:text-sky/40 mb-2">
              <span>Progress</span>
              <span>{Math.round(((currentStepIndex + (steps[currentStepIndex]?.completed ? 1 : 0)) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-cream-300/40 dark:bg-navy-600/40 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-steel to-sky h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentStepIndex + (steps[currentStepIndex]?.completed ? 1 : 0)) / steps.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Fun fact or tip */}
          <div className="mt-6 p-4 bg-cream-100/40 dark:bg-navy-700/30 rounded-xl">
            <p className="text-sm text-steel/60 dark:text-sky/40 text-center">
              <span className="font-medium">Did you know?</span> Kaleidoscope uses advanced security measures to protect your data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
