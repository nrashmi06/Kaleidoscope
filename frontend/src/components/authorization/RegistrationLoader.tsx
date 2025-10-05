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
      
      // Mark current step as active
      setCurrentStepIndex(stepIndex);

      timeoutId = setTimeout(() => {
        // Mark current step as completed
        setSteps(prev => 
          prev.map((step, index) => 
            index === stepIndex ? { ...step, completed: true } : step
          )
        );

        // Move to next step after a brief delay
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Creating Your Account
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
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
                      ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700"
                      : isCompleted
                      ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700"
                      : "bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-blue-500 text-white animate-pulse"
                        : isPending
                        ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                        : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
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
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {step.message}
                    </p>
                  </div>

                  {/* Loading indicator for active step */}
                  {isActive && (
                    <div className="w-6 h-6">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{Math.round(((currentStepIndex + (steps[currentStepIndex]?.completed ? 1 : 0)) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentStepIndex + (steps[currentStepIndex]?.completed ? 1 : 0)) / steps.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Fun fact or tip */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              💡 <span className="font-medium">Did you know?</span> Kaleidoscope uses advanced security measures to protect your data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
