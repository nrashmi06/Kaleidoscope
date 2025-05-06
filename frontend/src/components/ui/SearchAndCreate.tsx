import { useState } from "react";

export default function SearchAndCreate() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="flex items-center space-x-4 mb-4">
      {/* Search Input (flex-grow to take all available space) */}
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search..."
        className="flex-grow px-4 py-2 rounded-full border border-gray-300"
      />

      {/* Create Post Button */}
      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm transition-colors">
        + Create new post
      </button>
    </div>
  );
}
