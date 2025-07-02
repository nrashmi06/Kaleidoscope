import React from "react";

export const Loader = () => {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
};
