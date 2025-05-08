import { useState } from "react";
import { IconPencil } from "@tabler/icons-react";

export default function SearchAndCreate() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="flex items-center space-x-4 backdrop-blur-sm p-4 rounded-lg">
      {/* Search Input */}
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search..."
        className="flex-grow px-4 py-2 rounded-full border border-gray-300"
      />

      {/* Create Post Button for md+ screens */}
      <button className="hidden md:block bg-gradient-to-r from-sky-900 to-blue-700 hover:from-sky-950 hover:to-blue-800 text-white px-4 py-2 rounded-full text-sm transition-colors duration-200">
        + Create new post
      </button>

      {/* Pen Icon for small screens */}
      <button className="block md:hidden p-2 rounded-full bg-blue-700 text-white hover:bg-blue-800 transition">
        <IconPencil className="h-5 w-5" />
      </button>
    </div>
  );
}
