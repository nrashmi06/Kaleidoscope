"use client";

import { motion, AnimatePresence } from "framer-motion";
import { XCircle, Loader2 } from "lucide-react";
import { useEffect } from "react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  title?: string;
  message?: string;
}

export default function DeleteConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  isDeleting = false,
  title = "Delete Comment",
  message = "Are you sure you want to delete this comment? This action cannot be undone.",
}: DeleteConfirmationModalProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-navy/50 backdrop-blur-sm z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        >
          <motion.div
            className="bg-cream-50 dark:bg-navy rounded-2xl shadow-lg shadow-navy/10 dark:shadow-black/30 p-6 w-full max-w-sm border border-border-default"
            initial={{ opacity: 0, scale: 0.95, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/40">
                <XCircle
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  aria-hidden="true"
                />
              </div>

              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-heading">
                  {title}
                </h2>
                <p className="text-sm text-steel/60 dark:text-sky/40">
                  {message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-3 gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={isDeleting}
                className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-cream-300 dark:border-navy-700 px-4 py-2 text-sm font-medium text-heading shadow-sm hover:bg-surface-hover transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-xl border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
