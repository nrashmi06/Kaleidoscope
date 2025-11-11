// src/components/common/TrendingHashtagsModal.tsx
"use client";

import React from "react";
import { TrendingHashtags } from "@/components/hashtag/TrendingHashtags";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrendingHashtagsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrendingHashtagsModal: React.FC<TrendingHashtagsModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl max-h-[80vh] bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-800 flex flex-col"
            onClick={(e) => e.stopPropagation()} // Prevent closing on modal click
          >
            {/* Modal Header */}
            <header className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Trending Hashtags
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </header>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5">
              <TrendingHashtags />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};